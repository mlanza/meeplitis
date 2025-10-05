# Meeplitis Project Structure

This document provides a high-level overview of the Meeplitis project, detailing its directory structure, key components, and the architectural principles that guide its development. The goal is to provide a map for any developer, human or virtual, to navigate the codebase and understand how its different parts work together. This document is a living guide and should be updated as the project evolves.

## Top-Level Directories

The project is organized into several top-level directories, each with a specific purpose.

*   **`/`**: The project root, containing configuration files and top-level scripts.
*   **`ax/`**: Contains architectural documents, PRDs, plans, and other guiding materials for development.
*   **`node_modules/`**: Manages all of the project's Node.js dependencies.
*   **`sql/`**: Contains all database-related scripts, including schema definitions, functions, and triggers for PostgreSQL.
*   **`src/`**: The primary source directory for the frontend web application, built using Nunjucks templates.
*   **`supabase/`**: Holds configuration and serverless functions for the project's Supabase backend.
*   **`tasks/`**: A collection of shell scripts for automating common development and operational tasks.
*   **`workers/`**: Contains code for background workers or serverless functions that handle specific jobs.

## The `src` Directory: Frontend Source

The `src` directory is the heart of the Meeplitis frontend. It contains all the source files for the web application, which are processed by Lume, a static site generator, to produce the final HTML, CSS, and JavaScript.

*   **`_includes/`**: Holds reusable Nunjucks templates, such as base layouts (`layouts/`) and partials that are included across multiple pages.
*   **`about/`, `bugs/`, `sustainability/`**: These directories contain the content for static pages like "About Us", "Bug Reports", and "Sustainability".
*   **`components/`**: Contains reusable UI components that are smaller than a full page, for example, the game table component.
*   **`games/`**: This is a critical directory containing the specific UI, logic, and assets for each game available on the platform, such as Backgammon and Mexica.
*   **`images/`**: Stores all static image assets (icons, logos, game pieces) used throughout the application.
*   **`libs/`**: Contains third-party or internal JavaScript libraries used on the frontend.
*   **`pages/`**: A directory for other miscellaneous top-level pages.
*   **`profiles/`**: Holds the templates for rendering user profile pages.
*   **`{signin, signout, signup, reset-password, update-password}/`**: A collection of directories that manage all aspects of user authentication and account management.
*   **`*.css`, `*.js`, `*.njk`**: Loose files in the `src` root provide global styles, scripts, and the main entry-point templates for the site.

## The `sql` Directory: Database Logic

This directory houses all the SQL scripts that define the database schema and business logic for the Meeplitis platform, which runs on PostgreSQL. It's a critical part of the backend infrastructure.

*   **`cron/`**: Contains SQL scripts designed to be run on a schedule (i.e., as cron jobs). These are typically for maintenance tasks like cleaning up stale data or pruning old records.
*   **`functions/`**: This directory is for custom PostgreSQL functions. These functions encapsulate complex business logic and operations, making them reusable and accessible directly from the database.
*   **`triggers/`**: Holds the definitions for database triggers. Triggers are procedures that automatically execute in response to specific events on a table, such as `INSERT`, `UPDATE`, or `DELETE` operations, enforcing data integrity and automating actions.
*   **`views/`**: Contains the SQL definitions for database views. Views are virtual tables created from the result of a query, which can simplify complex data retrieval and provide a stable API for the application to query against.

## The `games` Directory

The `src/games/` directory is where the implementations for the individual board games reside. Each game has its own subdirectory containing all the necessary frontend code and assets. The project follows a consistent architectural pattern for each game, separating core logic from UI and side effects.

There are currently three games in the project:

*   **Backgammon**: Located at `src/games/backgammon/`. This is an implementation of the classic board game where players race their checkers around the board according to the roll of dice.
*   **Mexica**: Located at `src/games/mexica/`. While detailed rules are not in the `ax/` directory, the name suggests a historical strategy game based on the Mexica people and the founding of Tenochtitlan.
*   **Up & Down**: Located at `src/games/up-down/`. The specific rules for this game are not currently documented in the `ax/` directory.

### Common Game File Pattern

Each game follows the "Functional Core, Imperative Shell" (FC/IS) architecture use by [Atomic](./atomic.md), which is reflected in its file structure:

*   **`core.js` (Functional Core)**: This file contains the pure game logic. It exports functions to initialize the game state, execute commands, and query the state, but it never performs side effects.
*   **`main.js` (Imperative Shell)**: This file orchestrates the game. It listens for user input, dispatches commands to the `core.js` engine, manages the game state atom, and renders the UI. This file often handles complex, multi-step user interactions by managing a temporary `workingCommand` state, providing visual feedback to the user as they build a command.
*   **`main.css`**: One or more stylesheets that define the visual appearance of the game board, pieces, and UI components.
*   **`index.njk`**: The main Nunjucks template file that structures the HTML for the game page.
*   **`images/`**: A subdirectory containing game-specific assets like board images, piece designs, and icons.

## The `ax` (Agentic Experience) Directory: The Project Brain

The `ax` directory is the "brain" and contains details for the architecture of the Meeplitis project. It holds all the high-level documentation that guides the development process, ensuring consistency and a shared understanding of the project's goals and technical design.

*   **`hats/`**: This directory defines the various roles, or "hats," that the AI assistant can assume (e.g., `Planning`, `Coding`, `Fixing`). Each file outlines the principles and responsibilities associated with that role.
*   **`prds/`**: Contains Product Requirement Documents (PRDs). These are detailed specifications for major features and architectural patterns, like the `workingCommand` abstraction.
*   **`backgammon/`**: A game-specific subdirectory containing all documentation related to Backgammon, including its rules, development `TODO.md` list, and PRDs for its features. This serves as a template for how other games should be documented.

## Key Configuration Files

The project root contains several important configuration files that control various aspects of the development environment, dependencies, and build processes.

*   **`_config.js`**: The main configuration file for Lume, the static site generator used to build the frontend. It defines plugins, sets up data sources, and configures the build process.
*   **`_config.sim.js`**: A specialized Lume configuration file for the simulation environment, likely overriding or extending the main configuration for testing purposes.
*   **`deno.json`**: The configuration file for the Deno runtime. It specifies settings for linting, formatting, and defines tasks that can be run with `deno task`.
*   **`import_map.json`**: An import map for Deno, which allows for using bare module specifiers in import statements, making dependency management cleaner (e.g., `import "atomic_/core"` instead of a relative path).
*   **`package.json`**: The standard Node.js package manifest. It lists project dependencies (managed by npm or yarn), and defines scripts for common tasks.
*   **`rollup.config.js` / `webpack.config.js`**: Configuration files for JavaScript module bundlers. Their presence suggests that different parts of the project may use different bundling strategies to process and optimize frontend assets.
