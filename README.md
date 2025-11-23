# Xavier's The Dude

A JavaScript game based upon the popular Phaser graphics library. This game features "The Dude" character who collects stars while avoiding bombs.

## Game Features

- Multiple game scenes including start screen, gameplay, end screen, and high score input
- Collect stars to increase your score
- Avoid bombs or lose lives
- Special portal jumps every 5 waves (new world each jump: Sky -> Starry -> Saturn)
- Background music and sound effects
- Mobile-friendly responsive design

## Technical Details

- Built with Phaser 3.90.0 (latest version as of August 2025)
- Pure JavaScript implementation using ES modules for maintainability
- No build tools required - runs directly in the browser
- Modular structure under `src/` (scenes, shared state, config, and logic)

## How to Run

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the game with `npm start`
4. Open your browser to the URL shown in the terminal (usually http://localhost:8080)

## Global High Scores

- The high-score scene now attempts to fetch/submit a global leaderboard via `/api/highscores` (GET/POST).
- Configure a different base with query params: `?hsBase=http://localhost:3000/api/highscores&hsTimeout=7000`.
- If the service is unreachable, the game falls back to local scores and shows a notice; gameplay is unaffected.
- Local mock server for dev: `npm run mock:highscores` (defaults to http://localhost:3000). Then start the game with `npm start` and open `http://localhost:8080?hsBase=http://localhost:3000/api/highscores`.

## Recent Updates

- Updated to latest Phaser version (3.90.0)
- Improved async/await handling for game events
- Enhanced mobile responsiveness
- Updated package dependencies
- Improved HTML and CSS structure

## Credits
- Music by <a href="https://pixabay.com/users/djartmusic-46653586/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=301272">Krzysztof Szymanski</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=301272">Pixabay</a>
- Music by <a href="https://pixabay.com/users/nocopyrightsound633-47610058/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=322342">NoCopyrightSound633</a> from <a href="https://pixabay.com/music//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=322342">Pixabay</a>
- Music by <a href="https://pixabay.com/users/sounduniversestudio-43016639/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=211547">SoundUniverseStudio</a> from <a href="https://pixabay.com/music//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=211547">Pixabay</a>
- Music by <a href="https://pixabay.com/users/kissan4-10387284/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=358340">kissan4</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=358340">Pixabay</a>
- Music by <a href="https://pixabay.com/users/nickpanek-38266323/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=218126">Nicholas Panek</a> from <a href="https://pixabay.com/music//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=218126">Pixabay</a>
- Music by <a href="https://pixabay.com/users/musicinmedia-43224764/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=387749">Dvir</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=387749">Pixabay</a>
