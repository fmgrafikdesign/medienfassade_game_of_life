// This module handles, updates and removes the players currently connected to the game

var m = require('mithril');
var socket = require('./Socket');

var Players = {
    players: []
};

socket.on('game players', function(players) {
    //console.log('received players: ');
    Players.players = players;
    //console.log(Players);
});

socket.on('game add player', function(player) {
    Players.players.push(player);
    //console.log(Players.players);
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