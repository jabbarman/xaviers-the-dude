# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.3] - 2026-02-17

### Fixed

-   Implemented an SQLite schema migration to add a metadata column to the highscores table, ensuring future compatibility.

## [1.5.2] - 2026-02-17

### Fixed

-   Enhanced platform generator with strict side-approach anti-choke validation for elevated platforms.
-   Increased minimum inter-platform traversal gaps to prevent impossible jumps.
-   Restricted elevated platform placement to maintain a one sprite-width gap from screen edges.
-   Strengthened layout validation and increased maximum generation attempts to ensure consistent and playable levels.

## [1.5.1] - 2026-02-17

### Fixed

- Resolved an issue where the platform generator could create choke-points or traps, by implementing corridor checks.
