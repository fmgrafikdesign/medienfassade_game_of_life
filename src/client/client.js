
var m = require('mithril');

//var footer = require('./FooterMenu');
var Layout = require('./Layout');
var Overlay = require('./Overlay');
var Rules = require('./Rules');
var Patterns = require('./Patterns');
var Statistics = require('./Statistics');
var Setup = require('./Setup');
var Settings = require('./Settings');
var GameBoard = require('./GameBoard');
var GamePlayers = require('./GamePlayers');
/**

 socket.emit('game rules', game.rules); // game rules
 socket.emit('game board', game.state); // current game state
 socket.emit('generation remaining time', game.remaining_time); // time to next generation

 socket.emit('game players', scrubPlayersForClient(game.players)); // current players & statistic

 io.emit('game add player', scrubPlayerForClient(newplayer)); // add player on clients
 io.emit('player disconnect', id); // disconnect event: remove from statistics
 io.emit('player remove', id); // remove player from clients

 io.emit('game new generation', Date.now()); // new generation event with timestamp

 io.emit('game update board', game.board); // playing field update
 **/

m.route(document.body, '/', {
    '/': {
        onmatch: function() {
            if(!Settings.setupcompleted) {
                m.route.set('/setup')
            }
        },
        render: function() {
            return m(Layout, m(GameBoard));
        }
    },
    '/rules': {
        onmatch: function() {
            if(!Settings.setupcompleted) {
                m.route.set('/setup')
            }
        },
        render: function() {
            return m(Layout, m(Overlay, m(Rules)));
        }
    },
    '/patterns': {
        onmatch: function() {
            if(!Settings.setupcompleted) {
                m.route.set('/setup')
            }
        },
        render: function() {
            return m(Layout, m(Overlay, m(Patterns)));
        }
    },
    '/statistics': {
        onmatch: function() {
            if(!Settings.setupcompleted) {
                m.route.set('/setup')
            }
        },
        render: function() {
            return m(Layout, m(Overlay, m(Statistics)));
        }
    },
    '/setup': {
        onmatch: function() {
            if(Settings.setupcompleted) {
                m.route.set('/rules')
            }
        },
        render: function() {
            return m(Overlay, m(Setup));
        }
    }
});
