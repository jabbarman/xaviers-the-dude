<?php
/**
 * Global High-Score API
 * Handles fetching and submitting high scores for Xavier's The Dude.
 * Uses SQLite for simple, self-contained data storage.
 */

// --- Configuration ---
$dbFile = __DIR__ . '/highscores.sqlite';
$maxLimit = 50;
$defaultLimit = 20;

header('Content-Type: application/json');

// --- Helper Functions ---
function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function error($message, $status = 400) {
    respond(['error' => $message], $status);
}

// --- Database Initialization ---
try {
    $db = new PDO("sqlite:$dbFile");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Create table if it doesn't exist
    $db->exec("CREATE TABLE IF NOT EXISTS highscores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        initials TEXT NOT NULL,
        score INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Index for faster retrieval
    $db->exec("CREATE INDEX IF NOT EXISTS idx_highscores_score ON highscores (score DESC, createdAt ASC)");

} catch (PDOException $e) {
    error("Database connection failed: " . $e->getMessage(), 500);
}

// --- Request Handling ---
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // --- Fetch Scores ---
    $limit = isset($_GET['limit']) ? filter_var($_GET['limit'], FILTER_VALIDATE_INT) : $defaultLimit;
    if ($limit === false || $limit < 1) $limit = $defaultLimit;
    if ($limit > $maxLimit) $limit = $maxLimit;

    try {
        $stmt = $db->prepare("SELECT initials, score, createdAt FROM highscores ORDER BY score DESC, createdAt ASC LIMIT :limit");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        respond($results);
    } catch (PDOException $e) {
        error("Failed to fetch high scores: " . $e->getMessage(), 500);
    }

} elseif ($method === 'POST') {
    // --- Submit Score ---
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        error("Invalid JSON input");
    }

    $initials = isset($input['initials']) ? trim($input['initials']) : '';
    $score = isset($input['score']) ? filter_var($input['score'], FILTER_VALIDATE_INT) : null;

    // Validation
    $initials = strtoupper(preg_replace('/[^A-Za-z]/', '', $initials));
    if (strlen($initials) < 1 || strlen($initials) > 3) {
        error("Initials must be 1-3 letters (A-Z)");
    }

    if ($score === null || $score < 0) {
        error("Score must be a non-negative integer");
    }

    try {
        $stmt = $db->prepare("INSERT INTO highscores (initials, score) VALUES (?, ?)");
        $stmt->execute([$initials, (int)$score]);
        
        respond(['status' => 'success', 'message' => 'Score recorded'], 201);
    } catch (PDOException $e) {
        error("Failed to save score: " . $e->getMessage(), 500);
    }

} else {
    // --- Method Not Allowed ---
    error("Method $method not allowed", 405);
}
