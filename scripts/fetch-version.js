const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
    hostname: 'api.github.com',
    path: '/repos/jabbarman/xaviers-the-dude/releases/latest',
    headers: {
        'User-Agent': 'Node.js/fetch-version',
    },
};

https.get(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const release = JSON.parse(data);
            const version = release.tag_name || 'v0.0.0-dev';
            const content = `export const VERSION = '${version}';\n`;
            const outputPath = path.join(__dirname, '..', 'src', 'version.js');

            fs.writeFileSync(outputPath, content);
            console.log(`Successfully wrote version ${version} to src/version.js`);
        } catch (error) {
            console.error('Error parsing GitHub API response:', error.message);
            // Write a fallback version file so the app doesn't break
            const fallbackContent = `export const VERSION = 'v0.0.0-fallback';\n`;
            const outputPath = path.join(__dirname, '..', 'src', 'version.js');
            fs.writeFileSync(outputPath, fallbackContent);
        }
    });
}).on('error', (err) => {
    console.error('Error fetching version from GitHub:', err.message);
    // Write a fallback version file
    const fallbackContent = `export const VERSION = 'v0.0.0-error';\n`;
    const outputPath = path.join(__dirname, '..', 'src', 'version.js');
    fs.writeFileSync(outputPath, fallbackContent);
});
