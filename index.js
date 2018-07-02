var app = require('express')();
var express = require('express');
var http = require('http').Server(app);

var io = require('socket.io')(http);

var port = 61162;

//incremental uids for players
var uid = 0;

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client.html');
});

app.use('/', express.static(__dirname + '/public/'));
app.use('/js', express.static(__dirname + '/node_modules/'));

http.listen(port, function(){
    console.log('listening on port %s', port);
});


/** DEBUG FUNCTION **/


/** GAME VARIABLES **/

// Based on current information (21.06.18) the available pixels on the wall visible to the outside are about 3850 x 520
const time_per_generation = 2000;
var width = 385;
var height = 52;

//width = 8;
//height = 7;

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
    init: function() {

        /*
        for (var i = 0; i < game.rules.height; i++) {

            for (var j = 0; j < game.rules.width; j++) {
                board[i][j] = Math.floor(Math.random() + .1);
                next[i][j] = 0;
            }
        }
*/

        // Initialize the board with 0 and 1
        for (var i = 0; i < game.rules.height; i++) {

            for (var j = 0; j < game.rules.width; j++) {
                board[i][j] = 0;
                next[i][j] = 0;
            }
        }
/*
        board[4][1] = 1;
        board[4][2] = 1;
        board[5][1] = 1;
        board[5][2] = 1;
*/
        game.state = board;

    },

    // TODO: Factor in player colors
    generate: function() {
        // Loop through every spot in our 2D array and check spots neighbors
        for (var x = 0; x < game.rules.height; x++) {
            for (var y = 0; y < game.rules.width; y++) {
                // Add up all the states in a 3x3 surrounding grid
                var neighbors = 0;
                for (var i = -1; i <= 1; i++) {
                    for (var j = -1; j <= 1; j++) {
                        // If out of bounds, skip!
                        if(x+i < 0 || y+j < 0 || x+i >= height || y+j >= width) {
                            continue;
                        }
                        //console.log(x+i);
                        neighbors += board[x+i][y+j];
                    }
                }

                // A little trick to subtract the current cell's state since
                // we added it in the above loop
                neighbors -= board[x][y];
                // Rules of Life

                if      ((board[x][y] == 1) && (neighbors <  2)) next[x][y] = 0;           // Loneliness
                else if ((board[x][y] == 1) && (neighbors >  3)) next[x][y] = 0;           // Overpopulation
                else if ((board[x][y] == 0) && (neighbors == 3)) next[x][y] = 1;           // Reproduction
                else                                             next[x][y] = board[x][y]; // Stasis
            }
        }

        // Swap!
        var temp = board;
        board = next;
        next = temp;

        game.state = board;
        //console.log(board);
    }
};

game.init();
console.log('initialized.');

// This is how we get the game to unfold.
setInterval(function() {
    game.generate();
    game.generation++;
    //console.log(game.generation);
    sendNewGenerationToClients();

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


io.on('connection', function(socket) {
    console.log('a user connected! | ' + socket.id);

    // Send game data to client (once on connection)
    sendInitialData(socket);

    // Receive information about new player
    socket.on('new player', function(player, fn) {

        var name = player.name.trim();

        // If this player already joined the game, deny.;
        if(game.players.find(function(player) {
                return player.id == socket.id;
            })) {
            fn('player with same id (' + socket.id + ') found, preventing them from joining.');
            return false;
        };

        // If this player name already exists, deny.;
        if(game.players.find(function(server_player) {
                return server_player.name == name;
            })) {
            fn('player with this name already exists, preventing you from joining.');
            return false;
        };

        if(player.name.length === 0) {
            fn('Your name can\'t be empty, sweetheart.');
            return false;
        }

        newPlayerConnected(socket, player);
        fn(true);
    });

    // Remove player from statistics on disconnect
    socket.on('disconnect', function() {
        console.log('player disconnected | ' + socket.id);
        playerDisconnected(socket.id);
    })

    socket.on('place cells', function(cells, result) {
        // cells: The cells (their position) the player wants to place

        var player = getPlayerBySocketId(socket.id);
        console.log('player ' + player.name + ' is trying to place cells, checking...' );

        var checkresult = canPlaceCells(player,cells);

        // If the wanted action is legit, place the cells
        if(checkresult === true) {
            console.log('passed check, placing cells');
            // Place cells
            placeCells(player, cells);

            // Send the player his available cells
            socket.emit('player cells', player.availablecells);

            // Update the board for all players
            sendGameboardToClients();

            return true;
        } else {
            result(checkresult);
        }

    })

});

// Gets a player by socket id
function getPlayerBySocketId(id) {
    return game.players.find(function(player) {
        return player.id == id;
    });
}

// Gets a player by uid
function getPlayerByUid(uid) {
    return game.players.find(function(player) {
        return player.uid == uid;
    });
}

function getPlayerName(id) {
    return game.players.find(function(player) {
        return player.id == id;
    })
}

// Checks if a player may place a given set of cells
function canPlaceCells(player, cells) {
    var timestamp = Date.now();

    // cells looks like this: Array [ {x:5, y:3}, {x:2, y:18}, ... ]

    // cells is not empty
    if(cells.length === 0 || !cells) {
        return 'You haven\'t selected any cells to be placed yet.';
    }

    // not more than available to the player
    if(cells.length > player.availablecells) {
        return 'You\'re trying to place more cells than you currently can.';
    }

    // does not overlap with existing cells
    var overlap = false;
    // Check for each
    cells.forEach(function(cell) {
        if(game.board[cell.y][cell.x]) {
            overlap = true;
            console.log('overlap at x: %s, y: %s', cell.x, cell.y)
        }
    });

    if(overlap) {
        return 'You\'re trying to place cells on top of other cells. That\'s not possible.';
    }

    console.log('check took ' + (Date.now() - timestamp) + 'ms');
    return true;

}

function placeCells(player, cells) {
    var uid = player.uid;

    // Place the cells on the board
    cells.forEach(function(cell) {
        board[cell.y][cell.x] = 1;
    });

    // Substract the amount of cells placed from his available cells
    player.availablecells -= cells.length;
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

    duplicate.forEach(function(player) {
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
    var player = game.players.find(function(player) {
        return player.id == id;
    });

    // If no player was found, abort
    if(!player) return;

    // Set him to inactive
    player.active = false;

    // Send disconnect event to clients
    io.emit('player disconnect', id);

    // Check if he has any cells, delete if not.
    if(!playerHasCellsOnBoard(id)) {
        console.log('No active cells remaining, deleting player ' + id + '...');
        game.players = game.players.filter(function(player) {
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
    sendGameboardToClients()
}

function sendGameboardToClients() {
    // TODO: Only send updates or otherwise compress the data sent.
    io.emit('game update board', game.state);

    // use this for a better compressed version. To be implemented soon(tm)
    // io.emit('game board update', game.state);
}

/**
 * Returns true if a given player (id) has any living cells on the board. False if not.
 * Useful to check if you can kick a player from the game object after he disconnected.
 * @param id
 */
function playerHasCellsOnBoard(id) {
    // if: has active cells
    // check again soon!

    var active = game.players.find(function(player) {
        return player.id == id;
    });

    //if(!active) return;

    if(active.cells) {
        console.log('has cells atm. Checking again in 5s.');
        setTimeout(function() {
            playerHasCellsOnBoard(id);
        }, 5000);
        return true;
    } else {
        return false;
    }
}