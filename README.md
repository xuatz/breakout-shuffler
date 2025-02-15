# Breakout Shuffler

## Setup

1. Ensure you have Node.js (v20+) installed
2. Install PNPM: `npm install -g pnpm`
3. Install dependencies: `pnpm install`
4. Update /etc/hosts

```diff
...
127.0.0.1       localhost
::1             localhost
...
+ 127.0.0.1 client.breakout.local
+ 127.0.0.1 server.breakout.local
```

## Local Development

Because this application shares the cookie between the client and server app, it is probably easier if you just the whole local dev environment with docker compose, with caddy (and redis) setup already.

1. install docker
2. docker compose up -d
3. visit https://client.breakout.local

## Workspace Structure

- `apps/`: Application-specific projects
- `packages/`: Shared libraries and utilities

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

Uncategorised ideas

* clients should send periodic healthcheck back to server, so we know which clients are actually active
* host should be able to click on user name, and remove them from the room (for cleanup)
* participants can click on "nudge host" on their screen, and it will appear as a notification in the host (maybe in the top right hand corner)
    * each time they press nudge, it should bring them to the top of the list, and add a counter to the number of times they nudged host
    * host can then click on the user, and put them into xxx group easily
    * host can also "freeze" user that is abusing the nudge, which will put them in a separate tab

