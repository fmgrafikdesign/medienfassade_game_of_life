var app = require('express')();
var express = require('express');
var http = require('http').Server(app);

var io = require('socket.io')(http);

var port = 61162;

// A constant for dead cells
const dead = -1;
// A constant for neutral cells
const neutral = 0;
//incremental uids for players, starting at 1
var uid = neutral + 1;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client.html');
});

app.use('/', express.static(__dirname + '/public/'));
app.use('/js', express.static(__dirname + '/node_modules/'));

http.listen(port, function () {
    console.log('listening on port %s', port);
});


/** DEBUG FUNCTION **/


/** GAME VARIABLES **/

// Based on current information (21.06.18) the available pixels on the wall visible to the outside are about 3850 x 520
const time_per_generation = 1500;
var width = 99;
var height = 51;

//width = 40;
//height = 30;

// Wacky way to make a 2D array in JS
var board = new Array(height);
for (var i = 0; i < height; i++) {
    board[i] = new Array(width);
}

// Going to use multiple 2D arrays and swap them
var next = new Array(height);
for (i = 0; i < height; i++) {
    next[i] = new Array(width);
}


var empty = new Array(height);
for (i = 0; i < height; i++) {
    empty[i] = new Array(width);
    for (var j = 0; j < empty[i].length; j++) {
        empty[i][j] = -1;
    }
}
// Extra array for hotswapping in changes
var changes = new Array(height);
for (i = 0; i < height; i++) {
    changes[i] = new Array(width);
    for (var j = 0; j < changes[i].length; j++) {
        changes[i][j] = -1;
    }
}
function resetChangesArray() {
    for (i = 0; i < height; i++) {
        changes[i] = new Array(width);
        for (var j = 0; j < changes[i].length; j++) {
            changes[i][j] = -1;
        }
    }
}


// Our game object.
var game = {
    rules: {
        width: width,
        height: height,
        time_per_generation: time_per_generation, // Time per generation in milliseconds
        cells_per_player: 48 // How many cells a single player can place at once
    },
    remaining_time: time_per_generation,
    players: [],
    board: board,
    generation: 0,

    // For testing purposes: fill randomly
    init: function () {

        for (var i = 0; i < game.rules.height; i++) {

            for (var j = 0; j < game.rules.width; j++) {
                board[i][j] = Math.floor(Math.random() + 0.1) - 1;
                next[i][j] = -1;
            }
        }

        //console.log(board);

        // Initialize the board with empty cells
        /*
        for (var i = 0; i < game.rules.height; i++) {

            for (var j = 0; j < game.rules.width; j++) {
                board[i][j] = neutral;
                next[i][j] = neutral;
            }
        }
        */
        /*
                board[4][1] = 1;
                board[4][2] = 1;
                board[5][1] = 1;
                board[5][2] = 1;
        */
        game.state = board;

    },

    // TODO: Factor in player colors
    generate: function () {
        //var timestamp = Date.now()
        // Loop through every spot in our 2D array and check spots neighbors
        var log = true;
        for (var x = 0; x < game.rules.height; x++) {
            for (var y = 0; y < game.rules.width; y++) {
                // Add up all the states in a 3x3 surrounding grid
                var neighbors = 0;
                var neighbors_owners = {};
                for (var i = -1; i <= 1; i++) {
                    for (var j = -1; j <= 1; j++) {
                        // If out of bounds, skip!
                        if (x + i < 0 || y + j < 0 || x + i >= height || y + j >= width) {
                            continue;
                        }
                        if (board[x + i][y + j] !== dead) {
                            neighbors += 1;
                            if(neighbors_owners[board[x + i][y + j]] === undefined) {
                                neighbors_owners[board[x + i][y + j]] = 0;
                            }
                            neighbors_owners[board[x + i][y + j]]++;
                        }
                    }
                }

                // Substract the cells active state from the neighbor calculation if it's alive
                if (board[x][y] !== dead) {
                    neighbors--;
                }
                //console.log(neighbors);

                // Rules of Life
                // 0 = neutral, -1 = dead, everything else is the uid of a player to signal ownership
                if ((board[x][y] !== dead) && (neighbors < 2)) next[x][y] = dead;           // Loneliness
                else if ((board[x][y] !== dead) && (neighbors > 3)) next[x][y] = dead;           // Overpopulation

                else if ((board[x][y] === dead) && (neighbors === 3)) {
                    var owner = Object.keys(neighbors_owners).reduce(function (a, b) { return neighbors_owners[a] > neighbors_owners[b] ? a : b });
                    next[x][y] = owner; // Reproduction
                }
                else next[x][y] = board[x][y]; // Stasis ('ALLES BLEIBT SO WIES IS!')
            }
        }

        // Swap!
        var temp = board;

        board = next;
        next = temp;

        game.state = board;

        // first: now, second: before
        calculateBoardDifferences(game.state, next);
        //console.log('generation took ' + (Date.now() - timestamp) + 'ms');
    }
};

game.init();
console.log('initialized.');

// This is how we get the game to unfold.
setInterval(function () {

    //resetCellCounts();

    game.generate();
    game.generation++;
    //console.log(game.generation);
    sendNewGenerationToClients();
    //sendCellCountToClients();
    increaseAvailableCells();

}, game.rules.time_per_generation);

// Array of players, their properties and statitics
// id, active, color, name, number of cells on field, number of cells available

/** NETWORK EVENTS
 *  y - new player connects
 *     - send him the game rules (width, height, time per generation)
 *     - send him the game state
 *     - send him the time to the next generation
 *     - send him current players (names & colors, maybe incl statistic)
 *
 *  y - player joins (id, color, name)
 *     - add him to statistics
 *     - store his info in the game object
 *     - send his data to all players (including himself)
 *
 *  y - player leaves
 *     - remove him from statistics
 *
 *  - player adds cells to selection (id)
 *  - player chooses cell position
 *  - player places cells
 *    - check to see if placement is possible/legit (overlap, out of bounds, ...)
 *
 *  - server: time to next generation (every generation, to prevent errors piling up from lag)
 *  - server: start of new generation
 *  - server: updates of playing field on new generation
 * **/

function resetCellCounts() {
    game.players.forEach(function(player) {
        player.cells = 0;
    })
}

function sendCellCountToClients() {

    var cellcount = {};

    game.players.forEach(function(player) {
        cellcount[player.uid] = player.cells;
    });

    io.emit('player update cell count', cellcount);
}

io.on('connection', function (socket) {
    console.log('a user connected! | ' + socket.id);

    // Send game data to client (once on connection)
    sendInitialData(socket);

    // Receive information about new player
    socket.on('new player', function (player, fn) {

        var name = player.name.trim();

        // If this player already joined the game, deny.;
        if (game.players.find(function (player) {
                return player.id == socket.id;
            })) {
            fn('player with same id (' + socket.id + ') found, preventing them from joining.');
            return false;
        }
        ;

        // If this player name already exists, deny.;
        if (game.players.find(function (server_player) {
                return server_player.name == name;
            })) {
            fn('player with this name already exists, preventing you from joining.');
            return false;
        }

        if (player.name.length === 0) {
            fn('Your name can\'t be empty, sweetheart.');
            return false;
        }

        newPlayerConnected(socket, player);
        fn(true);
    });

    // Remove player from statistics on disconnect
    socket.on('disconnect', function () {
        console.log('player disconnected | ' + socket.id);
        playerDisconnected(socket.id);
    });

    socket.on('place cells', function (cells, result) {
        // cells: The cells (their position) the player wants to place

        var player = getPlayerBySocketId(socket.id);
        console.log('player ' + player.name + ' is trying to place cells, checking...');

        var checkresult = canPlaceCells(player, cells);

        // If the wanted action is legit, place the cells
        if (checkresult === true) {
            //console.log('passed check, placing cells');

            // Place cells
            placeCells(player, cells);

            // Diff the game state and the new board state and send it to clients
            //console.log(old);
            //console.log(board);
            //calculateBoardDifferences(old, board);

            // Send the player his available cells
            socket.emit('player cells', player.availablecells);
            result(true);

            return true;
        } else {
            result(checkresult);
        }

    });

    socket.on('debug msg', function(msg) {
        console.log('debug from client:');
        console.log(msg);
    });

});

// Gets a player by socket id
function getPlayerBySocketId(id) {
    return game.players.find(function (player) {
        return player.id == id;
    });
}

// Gets a player by uid
function getPlayerByUid(uid) {
    return game.players.find(function (player) {
        return player.uid == uid;
    });
}

function getPlayerName(id) {
    return game.players.find(function (player) {
        return player.id == id;
    })
}

// Checks if a player may place a given set of cells
function canPlaceCells(player, cells) {
    var timestamp = Date.now();

    // cells looks like this: Array [ {x:5, y:3}, {x:2, y:18}, ... ]

    // cells is not empty
    if (cells.length === 0 || !cells) {
        return 'You haven\'t selected any cells to be placed yet.';
    }

    // not more than available to the player
    if (cells.length > player.availablecells) {
        return 'You\'re trying to place more cells than you currently can.';
    }

    // does not overlap with existing cells
    var overlap = false;
    // Check for each
    cells.forEach(function (cell) {
        if (game.board[cell.y][cell.x] !== dead) {
            overlap = true;
            //console.log('overlap at x: %s, y: %s', cell.x, cell.y)
        }
    });

    if (overlap) {
        return 'You\'re trying to place cells on top of other cells. That\'s not possible.';
    }

    //console.log('check took ' + (Date.now() - timestamp) + 'ms');
    return true;

}

function placeCells(player, cells) {
    var uid = player.uid;
    var timestamp = Date.now();

    // Place the cells on the changes board and the game board
    cells.forEach(function (cell) {
        changes[cell.y][cell.x] = uid;
        board[cell.y][cell.x] = uid;
    });

    //console.log('placing cells took ' + (Date.now()-timestamp) + 'ms');
     // first: now, second: before
     calculateBoardDifferences(changes, empty);

    //console.log('placing cells took ' + (Date.now()-timestamp) + 'ms');
     // Reset the changes array
     resetChangesArray();

    // Substract the amount of cells placed from his available cells
    player.availablecells -= cells.length;
    //console.log('placing cells took ' + (Date.now()-timestamp) + 'ms');
}

/** sendInitialData
 *  - new player connects
 *      - send him the game rules (width, height, time per generation, maximum placable cells)
 *      - send him the game state
 *      - send him the time to the next generation
 *      - send him current players (names & colors, maybe incl statistic)
 *    **/

function sendInitialData(socket) {

    // Send game rules (width, height, time per generation)

    socket.emit('game rules', game.rules);

    // Send current game state
    socket.emit('game board', game.state);

    // Send time to next generation
    socket.emit('generation remaining time', game.remaining_time);

    // Send current players & statistic
    socket.emit('game players', scrubPlayersForClient(game.players));
}

function scrubPlayersForClient(players) {
    // Remove reference so we can return another array
    var duplicate = JSON.parse(JSON.stringify(players));

    duplicate.forEach(function (player) {
        // Remove info how many cells are available for each player
        delete player.availablecells;
    });
    return duplicate;
}

function scrubPlayerForClient(player) {
    // Remove reference so we can return another array
    var duplicate = JSON.parse(JSON.stringify(player));
    // Remove info how many cells are available for the player
    delete duplicate.availablecells;
    return duplicate;
}

/**
 * New Player connects: Store his data in the game object and send his info to all clients for statistic purposes
 * @param socket
 * @param player
 */
function newPlayerConnected(socket, player) {
    console.log('new player ' + player.name + ' connected.');

    var newplayer = player;

    newplayer.id = socket.id;
    newplayer.uid = uid;
    uid++;
    newplayer.availablecells = game.rules.cells_per_player;
    newplayer.cells = 0;
    newplayer.active = true;
    newplayer.color = player.color;
    newplayer.name = player.name.trim();

    game.players.push(newplayer);
    io.emit('game add player', scrubPlayerForClient(newplayer));
}

/**
 * A player disconnected from the game
 * - He stays in the game object for color lookups
 * - Set him to inactive
 * - He stays in the clients for color lookups
 * - Don't display him in client statistics
 * - His cells stick around
 * - Occasionally check if he has any cells on the board, if not remove him from game object
 *
 * @param id
 */

function playerDisconnected(id) {
    // Get the player from the game object
    var player = game.players.find(function (player) {
        return player.id == id;
    });

    // If no player was found, abort
    if (!player) return;

    // Set him to inactive
    player.active = false;

    // Send disconnect event to clients
    io.emit('player disconnect', id);

    // Check if he has any cells, delete if not.
    if (!playerHasCellsOnBoard(id)) {
        console.log('No active cells remaining, deleting player ' + id + '...');
        game.players = game.players.filter(function (player) {
            return player.id != id;
        });

        // Tell clients to toss him out, too
        io.emit('player remove', id);
    }


}

/**
 * Send updates to clients when a new generation starts
 *  - server: time to next generation (every generation, to prevent errors piling up from lag)
 *    ^- maybe rather timestamp of this generation, so client can counteract ping?
 *  - server: start of new generation
 *  - server: updates of playing field on new generation
 */

function sendNewGenerationToClients() {
    // Send new generation event with timestamp
    io.emit('game new generation', Date.now());

    // Send playing field update
    //sendGameboardToClients()
}

/**
 * Increase the available cells of players, up to the maximum amount
 */
function increaseAvailableCells() {
    game.players.forEach(function(player) {
        player.availablecells = Math.min( player.availablecells+1, game.rules.cells_per_player);
    })
}

function sendGameboardToClients() {
    // TODO: Only send updates or otherwise compress the data sent.
    //io.emit('game update board', game.state);

    // use this for a better compressed version. To be implemented soon(tm)
    // io.emit('game board update', game.state);
}

/*
function SendGameboardUpdatesToClients(updates) {
    io.emit('game board update', updates);
}
*/
/**
 * Returns true if a given player (id) has any living cells on the board. False if not.
 * Useful to check if you can kick a player from the game object after he disconnected.
 * @param id
 */
function playerHasCellsOnBoard(id) {
    // if: has active cells
    // check again soon!

    var active = game.players.find(function (player) {
        return player.id == id;
    });

    //if(!active) return;

    if (active.cells) {
        console.log('has cells atm. Checking again in 5s.');
        setTimeout(function () {
            playerHasCellsOnBoard(id);
        }, 5000);
        return true;
    } else {
        return false;
    }
}

/** This is what we want in the end:
 *
 *  [
 *      [y,[[x,i],[x,i],[x,i]]],
 *      [y,[[x,i],[x,i],[x,i]]],
 *      ...
 *  ]
 */

/**
 * Calculates the differences between a "before" and "after" state and sends the differences to all clients
 * for redrawing their grid
 * @param now
 * @param before
 * @param print_result
 * @returns {Array}
 */

function calculateBoardDifferences(now, before, print_result) {

    var timestamp = Date.now();

    var differences = [];

    var i = 0;

    // Check for each row
    for (var y = 0; y < game.rules.height; y++) {
        var difference_in_row = false;

        for (var x = 0; x < game.rules.width; x++) {

            // If the cells is not different, skip it
            if (now[y][x] === before[y][x]) continue;

            // If the cell is different, store its position and player in the array
            else {
                // If there wasn't a difference up to this point, create space in the array now
                if (!difference_in_row) {
                    differences[i] = [y, []];
                    difference_in_row = true;
                }
                //console.log(differences[i]);

                // If the cell is dead now, just push its position, it's assumed dead
                if (now[y][x] === dead) {
                    differences[i][1].push(x);
                }

                // Else push an array of position and player id
                else {
                    differences[i][1].push([x, now[y][x]]);
                }
            }

        }

        //increment the i counter for the next row
        if (difference_in_row) {
            i++;
        }
    }

    //console.log('calculating differences took ' + (Date.now() - timestamp) + 'ms');
    //
    io.emit('game board update', differences);

    if(print_result) {
        console.log(differences);
        console.log('calculating differences took ' + (Date.now() - timestamp) + 'ms');
    }

    return differences;
}