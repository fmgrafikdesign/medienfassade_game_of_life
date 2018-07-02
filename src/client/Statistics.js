var m = require('mithril');
var GamePlayers = require('./GamePlayers');

var PlayerStatistics = {

    view: function() {

        // Sort them by cell count
        var sorted = GamePlayers.players.sort(function(a, b) {
            return a.cells > b.cells;
        });

        // Map them to their html representation
        var players = sorted.map(function(player) {
            return m('.player-statistic', { class: player.active ? '' : 'inactive'}, [
                m('.player-color', { style: "background-color: " + player.color}),
                m('.player-name', player.name + (player.active ? '' : ' (Spiel verlassen)')),
                m('.player-cellcount', player.cells)
            ])
        });
        //console.log(GamePlayers.players);
        return m('.player-statistics', players)
    }
};

module.exports = {
    view: function() {
        return [
            m('h1', 'Statistik'),
            m(PlayerStatistics)
            ]
    }
};