<?php
/**
 * Global High-Score API (Hardened)
 *
 * Security controls:
 * - strict schema validation
 * - request freshness + nonce replay protection
 * - HMAC request signing bound to short-lived submit token
 * - per-IP rate limiting
 * - conservative server-side score plausibility checks
 * - CORS allowlist via environment variable
 */

// --- Environment bootstrap (supports no-root shared hosting) ---
$dotenv = loadDotEnvFiles([
    __DIR__ . '/.env.local',
    __DIR__ . '/.env',
    dirname(__DIR__) . '/.env.local',
    dirname(__DIR__) . '/.env',
]);

// --- Configuration ---
$dbFile = __DIR__ . '/highscores.sqlite';
$maxLimit = 50;
$defaultLimit = 20;

$scoreMin = envInt('HIGHSCORE_SCORE_MIN', 1, $dotenv);
$scoreMax = envInt('HIGHSCORE_SCORE_MAX', 1000000, $dotenv);
$maxScoreDelta = envInt('HIGHSCORE_MAX_SCORE_DELTA', 200000, $dotenv);
$maxTimestampSkewSec = envInt('HIGHSCORE_MAX_TIMESTAMP_SKEW_SECONDS', 30, $dotenv);
$nonceTtlSec = envInt('HIGHSCORE_NONCE_TTL_SECONDS', 120, $dotenv);
$sessionTtlSec = envInt('HIGHSCORE_SESSION_TTL_SECONDS', 180, $dotenv);
$rateLimitWindowSec = envInt('HIGHSCORE_RATE_LIMIT_WINDOW_SECONDS', 60, $dotenv);
$rateLimitMaxRequests = envInt('HIGHSCORE_RATE_LIMIT_MAX_REQUESTS', 10, $dotenv);
$allowedOrigins = envCsv('HIGHSCORE_ALLOWED_ORIGINS', '', $dotenv);

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Highscore-Signature, X-Highscore-Timestamp, X-Highscore-Nonce, X-Highscore-Session');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$origin = isset($_SERVER['HTTP_ORIGIN']) ? trim((string) $_SERVER['HTTP_ORIGIN']) : '';
if ($origin !== '' && isAllowedOrigin($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if ($origin !== '' && !isAllowedOrigin($origin, $allowedOrigins)) {
        http_response_code(403);
    } else {
        http_response_code(204);
    }
    exit;
}

if ($origin !== '' && !isAllowedOrigin($origin, $allowedOrigins)) {
    errorResponse('Origin not allowed', 403);
}

// --- Helper Functions ---
function respond($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function errorResponse($message, $status = 400)
{
    respond(['error' => $message], $status);
}

function loadDotEnvFiles($paths)
{
    $vars = [];

    foreach ($paths as $path) {
        if (!is_string($path) || $path === '' || !is_file($path) || !is_readable($path)) {
            continue;
        }

        $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!is_array($lines)) {
            continue;
        }

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                continue;
            }

            $eqPos = strpos($trimmed, '=');
            if ($eqPos === false) {
                continue;
            }

            $key = trim(substr($trimmed, 0, $eqPos));
            $value = trim(substr($trimmed, $eqPos + 1));
            if ($key === '') {
                continue;
            }

            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }

            $vars[$key] = $value;
        }
    }

    return $vars;
}

function envRaw($name, $dotenv = null)
{
    $raw = getenv($name);
    if ($raw !== false && $raw !== '') {
        return $raw;
    }

    if (isset($_ENV[$name]) && $_ENV[$name] !== '') {
        return (string) $_ENV[$name];
    }

    if (isset($_SERVER[$name]) && $_SERVER[$name] !== '') {
        return (string) $_SERVER[$name];
    }

    if (is_array($dotenv) && isset($dotenv[$name]) && $dotenv[$name] !== '') {
        return (string) $dotenv[$name];
    }

    return false;
}

function envInt($name, $default, $dotenv = null)
{
    $raw = envRaw($name, $dotenv);
    if ($raw === false || $raw === '') {
        return $default;
    }
    $v = filter_var($raw, FILTER_VALIDATE_INT);
    return $v === false ? $default : $v;
}

function envCsv($name, $default = '', $dotenv = null)
{
    $raw = envRaw($name, $dotenv);
    if ($raw === false) {
        $raw = $default;
    }
    $parts = array_filter(array_map('trim', explode(',', (string) $raw)), function ($s) {
        return $s !== '';
    });
    return array_values($parts);
}

function isAllowedOrigin($origin, $allowlist)
{
    if (count($allowlist) === 0) {
        return false;
    }
    foreach ($allowlist as $allowed) {
        if ($allowed === $origin) {
            return true;
        }
    }
    return false;
}

function getClientIp()
{
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }
    return isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown';
}

function randomB64Url($lengthBytes)
{
    return rtrim(strtr(base64_encode(random_bytes($lengthBytes)), '+/', '-_'), '=');
}

function hashHex($value)
{
    return hash('sha256', (string) $value);
}

function normalizeInitials($value)
{
    $clean = strtoupper(preg_replace('/[^A-Za-z]/', '', (string) $value));
    return substr($clean, 0, 3);
}

function sanitizeMetadata($metadata)
{
    if ($metadata === null) {
        return null;
    }
    if (!is_array($metadata)) {
        return false;
    }

    $maxKeys = 8;
    $maxKeyLen = 32;
    $maxValLen = 80;

    if (count($metadata) > $maxKeys) {
        return false;
    }

    $out = [];
    foreach ($metadata as $k => $v) {
        if (!is_string($k) || strlen($k) < 1 || strlen($k) > $maxKeyLen || !preg_match('/^[A-Za-z0-9_.-]+$/', $k)) {
            return false;
        }

        if (is_string($v)) {
            if (strlen($v) > $maxValLen) {
                return false;
            }
            $out[$k] = $v;
        } elseif (is_int($v) || is_float($v)) {
            if (!is_finite((float) $v)) {
                return false;
            }
            $out[$k] = $v + 0;
        } elseif (is_bool($v)) {
            $out[$k] = $v;
        } else {
            return false;
        }
    }

    ksort($out);
    return $out;
}

function canonicalMetadata($metadata)
{
    if ($metadata === null) {
        return '';
    }
    return json_encode($metadata, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function cleanupSecurityState($db, $nonceTtlSec)
{
    $db->prepare('DELETE FROM used_nonces WHERE createdAt < datetime("now", :nonceTtlExpr)')
        ->execute([':nonceTtlExpr' => '-' . (int) $nonceTtlSec . ' seconds']);
    $db->exec('DELETE FROM highscore_sessions WHERE expiresAt < CURRENT_TIMESTAMP');
    $db->prepare('DELETE FROM rate_limits WHERE windowStart < datetime("now", :windowExpr)')
        ->execute([':windowExpr' => '-2 hours']);
}

function enforceRateLimit($db, $ip, $windowSec, $maxRequests)
{
    $now = time();
    $windowStartEpoch = $now - ($now % $windowSec);
    $windowStart = gmdate('Y-m-d H:i:s', $windowStartEpoch);

    $stmt = $db->prepare('SELECT count FROM rate_limits WHERE key = :key AND windowStart = :windowStart LIMIT 1');
    $stmt->execute([':key' => $ip, ':windowStart' => $windowStart]);
    $row = $stmt->fetch();

    if ($row) {
        $nextCount = ((int) $row['count']) + 1;
        $update = $db->prepare('UPDATE rate_limits SET count = :count WHERE key = :key AND windowStart = :windowStart');
        $update->execute([':count' => $nextCount, ':key' => $ip, ':windowStart' => $windowStart]);
    } else {
        $nextCount = 1;
        $insert = $db->prepare('INSERT INTO rate_limits (key, windowStart, count) VALUES (:key, :windowStart, :count)');
        $insert->execute([':key' => $ip, ':windowStart' => $windowStart, ':count' => $nextCount]);
    }

    if ($nextCount > $maxRequests) {
        errorResponse('Too many submissions; try again shortly', 429);
    }
}

function ensureRequiredString($input, $key, $maxLen = 256)
{
    if (!isset($input[$key]) || !is_string($input[$key])) {
        errorResponse("Missing or invalid field: $key", 422);
    }
    $v = trim($input[$key]);
    if ($v === '' || strlen($v) > $maxLen) {
        errorResponse("Missing or invalid field: $key", 422);
    }
    return $v;
}

function ensureRequiredInt($input, $key)
{
    if (!array_key_exists($key, $input)) {
        errorResponse("Missing field: $key", 422);
    }

    $raw = $input[$key];
    if (is_int($raw)) {
        return $raw;
    }
    if (is_string($raw) && preg_match('/^-?\d+$/', $raw)) {
        return (int) $raw;
    }

    errorResponse("Invalid integer field: $key", 422);
}

// --- Database Initialization ---
try {
    $db = new PDO("sqlite:$dbFile");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $db->exec("CREATE TABLE IF NOT EXISTS highscores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        initials TEXT NOT NULL,
        score INTEGER NOT NULL,
        metadata TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $db->exec("CREATE INDEX IF NOT EXISTS idx_highscores_score ON highscores (score DESC, createdAt ASC)");

    $db->exec("CREATE TABLE IF NOT EXISTS highscore_sessions (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        ip TEXT NOT NULL,
        lastScore INTEGER NOT NULL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME NOT NULL
    )");

    $db->exec("CREATE TABLE IF NOT EXISTS used_nonces (
        sessionId TEXT NOT NULL,
        nonce TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (sessionId, nonce)
    )");

    $db->exec("CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT NOT NULL,
        windowStart DATETIME NOT NULL,
        count INTEGER NOT NULL,
        PRIMARY KEY (key, windowStart)
    )");

    cleanupSecurityState($db, $nonceTtlSec);

} catch (PDOException $e) {
    errorResponse('Database connection failed', 500);
}

// --- Request Handling ---
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = isset($_GET['action']) ? trim((string) $_GET['action']) : '';

    if ($action === 'challenge') {
        try {
            $sessionId = randomB64Url(18);
            $submitToken = randomB64Url(32);
            $ip = getClientIp();
            $expiresAt = gmdate('Y-m-d H:i:s', time() + $sessionTtlSec);

            $stmt = $db->prepare('INSERT INTO highscore_sessions (id, token, ip, expiresAt) VALUES (:id, :token, :ip, :expiresAt)');
            $stmt->execute([
                ':id' => $sessionId,
                ':token' => $submitToken,
                ':ip' => $ip,
                ':expiresAt' => $expiresAt,
            ]);

            respond([
                'sessionId' => $sessionId,
                'submitToken' => $submitToken,
                'expiresAt' => $expiresAt,
                'maxTimestampSkewSeconds' => $maxTimestampSkewSec,
            ]);
        } catch (Throwable $e) {
            errorResponse('Failed to issue submit challenge', 500);
        }
    }

    $limit = isset($_GET['limit']) ? filter_var($_GET['limit'], FILTER_VALIDATE_INT) : $defaultLimit;
    if ($limit === false || $limit < 1)
        $limit = $defaultLimit;
    if ($limit > $maxLimit)
        $limit = $maxLimit;

    try {
        $stmt = $db->prepare('SELECT initials, score, createdAt FROM highscores ORDER BY score DESC, createdAt ASC LIMIT :limit');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $results = $stmt->fetchAll();

        respond($results);
    } catch (PDOException $e) {
        errorResponse('Failed to fetch high scores', 500);
    }

} elseif ($method === 'POST') {
    $ip = getClientIp();
    enforceRateLimit($db, $ip, $rateLimitWindowSec, $rateLimitMaxRequests);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        errorResponse('Invalid JSON input', 400);
    }

    $initialsRaw = ensureRequiredString($input, 'initials', 16);
    $score = ensureRequiredInt($input, 'score');
    $sessionId = ensureRequiredString($input, 'sessionId', 128);
    $timestamp = ensureRequiredInt($input, 'timestamp');
    $nonce = ensureRequiredString($input, 'nonce', 128);
    $signature = ensureRequiredString($input, 'signature', 256);

    $metadata = null;
    if (array_key_exists('metadata', $input)) {
        $metadata = sanitizeMetadata($input['metadata']);
        if ($metadata === false) {
            errorResponse('Invalid metadata', 422);
        }
    }

    $initials = normalizeInitials($initialsRaw);

    if (strlen($initials) < 1 || strlen($initials) > 3) {
        errorResponse('Initials must be 1-3 letters (A-Z)', 422);
    }
    if ($score < $scoreMin || $score > $scoreMax) {
        errorResponse('Score out of accepted bounds', 422);
    }

    if (!preg_match('/^[A-Za-z0-9_-]{8,128}$/', $nonce)) {
        errorResponse('Invalid nonce format', 422);
    }

    $nowTs = time();
    if (abs($nowTs - $timestamp) > $maxTimestampSkewSec) {
        errorResponse('Stale or future timestamp', 401);
    }

    try {
        $db->beginTransaction();

        $sessionStmt = $db->prepare('SELECT id, token, ip, lastScore, expiresAt FROM highscore_sessions WHERE id = :id LIMIT 1');
        $sessionStmt->execute([':id' => $sessionId]);
        $session = $sessionStmt->fetch();

        if (!$session) {
            $db->rollBack();
            errorResponse('Unknown session', 401);
        }

        if ((string) $session['ip'] !== $ip) {
            $db->rollBack();
            errorResponse('Session/IP mismatch', 401);
        }

        if (strtotime((string) $session['expiresAt']) <= time()) {
            $db->rollBack();
            errorResponse('Session expired', 401);
        }

        $metaCanonical = canonicalMetadata($metadata);
        $stringToSign = implode('|', [
            $sessionId,
            (string) $timestamp,
            $nonce,
            $initials,
            (string) $score,
            hashHex($metaCanonical),
        ]);

        $expectedSig = hash_hmac('sha256', $stringToSign, (string) $session['token']);
        if (!hash_equals($expectedSig, strtolower($signature))) {
            $db->rollBack();
            errorResponse('Invalid signature', 401);
        }

        $nonceInsert = $db->prepare('INSERT INTO used_nonces (sessionId, nonce) VALUES (:sessionId, :nonce)');
        try {
            $nonceInsert->execute([':sessionId' => $sessionId, ':nonce' => $nonce]);
        } catch (PDOException $e) {
            if ((string) $e->getCode() === '23000') {
                $db->rollBack();
                errorResponse('Replay detected', 409);
            }
            throw $e;
        }

        $lastScore = (int) $session['lastScore'];
        if ($score < $lastScore) {
            $db->rollBack();
            errorResponse('Score regression in session', 422);
        }

        if (($score - $lastScore) > $maxScoreDelta) {
            $db->rollBack();
            errorResponse('Implausible score jump', 422);
        }

        $updateSession = $db->prepare('UPDATE highscore_sessions SET lastScore = :lastScore WHERE id = :id');
        $updateSession->execute([':lastScore' => $score, ':id' => $sessionId]);

        $metaStored = $metadata === null ? null : json_encode($metadata, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $insertScore = $db->prepare('INSERT INTO highscores (initials, score, metadata) VALUES (:initials, :score, :metadata)');
        $insertScore->execute([
            ':initials' => $initials,
            ':score' => (int) $score,
            ':metadata' => $metaStored,
        ]);

        $db->commit();

        respond(['status' => 'success', 'message' => 'Score recorded'], 201);
    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        errorResponse('Failed to save score', 500);
    }

} else {
    errorResponse("Method $method not allowed", 405);
}
