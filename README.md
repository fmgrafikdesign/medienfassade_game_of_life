# Conway's Game of Life - Multiplayer

A special take on Conway's Game of Life. It has multiplayer capabilities, a progressive web app client and it can run on the "Medienfassade" (a big projection area visible from the street) of my university.

People can visit the app on their phone (or desktop), read up on the rules, place some cells and then see the events unfold on the screen.

Uses socket.io for communication, Node for the game server and html5 canvas for graphics.

## Installation

Install [node](https://nodejs.org/en/) on your pc. Clone the repo, then run
`npm install`
in the downloaded folder.

You can now run the game via `node index.js`. Join the game by typing `http://localhost:61162` in your browser. Others in your local area network can join via your IP Adress.