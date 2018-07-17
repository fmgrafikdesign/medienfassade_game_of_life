// This module handles, updates and removes the players currently connected to the game

var m = require('mithril');
var socket = require('./Socket');

const dead = -1;
const neutral = 0;

var Players = {
    players: [],
    updatePlayerCellCount: function(array) {
        //var timestamp = Date.now();
        // Loop through rows
        //console.log(array);
        var cellcount = {};
        for (var x = 0; x < array.length; x++) {
            for (var y = 0; y < array[x].length; y++) {
                var cell = array[x][y];
                //console.log(cell);
                if(cell != dead && cell != neutral) {
                    if(cellcount[cell] === undefined) {
                        cellcount[cell] = 0;
                    }
                    cellcount[cell]++;
                }

            }
        }
        //console.log(cellcount);

        Players.players.forEach(function(player) {
            if(cellcount[player.uid]) player.cells = cellcount[player.uid];
            else player.cells = 0;
        });
        m.redraw();
        //console.log('cell count took ' + (Date.now() - timestamp) + 'ms');
    }
};

function getPlayerByUid(uid) {
    return Players.players.find(function (player) {
        return player.uid == uid;
    });
}

socket.on('game players', function(players) {
    //console.log('received players: ');
    Players.players = players;
    console.log(Players.players);
});

socket.on('game add player', function(player) {
    Players.players.push(player);
    console.log(Players.players);
});

socket.on('player disconnect', function(id) {
    var player = Players.players.find(function(player) {
        return player.id == id;
    });

    player.active = false;
    m.redraw();
});

socket.on('player remove', function(id) {
    Players.players = Players.players.filter(function(player) {
        return player.id != id;
    });

    m.redraw();
});

module.exports = Players;