# Xavier's The Dude

A JavaScript game built with the Phaser 3 framework. This game features "The Dude" who collects stars while avoiding bombs across multiple worlds.

## Game Features

- Multiple game scenes: Start, Gameplay, Game Over, and High Score.
- Collect stars to increase your score.
- Avoid bombs or lose lives.
- Special "portal jumps" to new worlds with different backgrounds and music.
- Global and local high score tracking.
- Mobile-friendly responsive design.

## How to Run

1.  **Clone this repository.**
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3.  **Start the local server:**
    ```sh
    npm start
    ```
4.  Open your browser to the URL shown in the terminal (usually `http://localhost:8080`).

## Global High Scores

The game supports a global high score board. For local development, you can run a mock server.

1.  **Start the mock server** in a separate terminal:
    ```sh
    npm run mock:highscores
    ```
    This will run on `http://localhost:3000`.

2.  **Start the game** and append the following query parameter to the URL in your browser to point the game at your mock server:
    `?hsBase=http://localhost:3000/api/highscores`

If the service is unreachable, the game gracefully falls back to using local storage for high scores.

## Development Notes

-   **Debugging:** You can enable debug mode by adding `?debug=1` to the URL. This may enable extra logging or visual debugging aids in Phaser.
-   **Phaser Global:** This project uses `phaser.min.js` included via a `<script>` tag in `index.html`, which makes `Phaser` a global variable. Do not use `import Phaser from 'phaser'` in the client-side modules, as no bundling process is configured.
-   **Audio Context:** Be aware of browser autoplay policies. Audio playback should be initiated by a user gesture (like a click) to work reliably.
-   **LocalStorage:** Game state like `hiScore` and `highScores` is saved in `localStorage`. You may want to clear this between testing sessions to ensure a clean state.

## Credits

-   **Music by [Krzysztof Szymanski](https://pixabay.com/users/djartmusic-46653586/)** from Pixabay (iLoveMy8bit)
-   **Music by [NoCopyrightSound633](https://pixabay.com/users/nocopyrightsound633-47610058/)** from Pixabay (8BitMusic)
-   **Music by [SoundUniverseStudio](https://pixabay.com/users/sounduniversestudio-43016639/)** from Pixabay (flat8bit)
-   **Music by [kissan4](https://pixabay.com/users/kissan4-10387284/)** from Pixabay (pixelParadise)
-   **Music by [Nicholas Panek](https://pixabay.com/users/nickpanek-38266323/)** from Pixabay (percussiveDubstep)
-   **Music by [Dvir](https://pixabay.com/users/musicinmedia-43224764/)** from Pixabay (8bitTheme)
-   **Music 'bodenstaendig_2000_in_rock_4bit.mp3' (boden):** [TODO: Add attribution]
-   **Music 'tommy_in_goa.mp3' (tommy):** [TODO: Add attribution]
-   **Sound Effect 'player_death.wav' (gameOver):** [TODO: Add attribution]
-   **Sound Effect 'p-ping.mp3' (ping):** [TODO: Add attribution]
-   **Sound Effect 'explosion.mp3' (explode):** [TODO: Add attribution]
-   **Sound Effect 'mario-jumping-sound.mp3' (bounce):** [TODO: Add attribution]
-   **Sound Effect 'pickup.wav' (portalJump):** [TODO: Add attribution]
