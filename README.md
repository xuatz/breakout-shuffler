# Breakout Shuffler

## Setup

1. Ensure you have Node.js (v18+) installed
2. Install PNPM: `npm install -g pnpm`
3. Install dependencies: `pnpm install`

## Workspace Structure

- `apps/`: Application-specific projects
- `packages/`: Shared libraries and utilities

## Commands

- `pnpm dev`: Run development servers across all workspaces
- `pnpm build`: Build all projects
- `pnpm test`: Run all tests
- `pnpm lint`: Lint all projects

## Contributing

Please read the contributing guidelines before getting started.

## Feature Roadmap

Phase 1: Basic Room Creation and User Management

* Create a Room
    * Allow a host to create a room.
    * Persist room data in an external storage (database or Redis).
* Generate QR Code
    * Generate a QR code for the room URL with the roomId as a search parameter.
    * Allow the host to display the QR code for attendees to scan and join the room.
* User Connection and Identification
    * Allow users to join the room by scanning the QR code.
    * Set a cookie on the user's browser to recognize the same user even if they close and reopen the window.
    * Assign a random name to each user upon joining, with the option to rename themselves.

Phase 2: Host and Attendee Management

* Host View of Attendees
    * Allow the host to see the list of attendees connected to the room.
* Group Configuration
    * Allow the host to set the number of people per group or limit by the number of groups.
    * Implement different grouping algorithms based on the host's configuration.

Phase 3: Group Shuffling and Notifications

* Shuffle and Group Assignment
    * Allow the host to shuffle attendees into groups.
    * Enable the host to reshuffle groups if desired.
* Publish Shuffle and Notifications
    * Notify each user of their assigned group when the host publishes the shuffle.
    * Persist group assignments on the server to track and minimize repeat groupings in subsequent shuffles.

Phase 4: Advanced Features and Optimization

* Repeat Minimization Algorithm
    * Implement an algorithm to minimize repeat groupings for attendees in subsequent shuffles.
    * Ensure fair distribution of repeats within groups to avoid any attendee being repeatedly grouped with the same people.
