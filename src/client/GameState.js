// This component handles information about the game, like available cells, rules and other aspects
var m = require('mithril');


// Get the socket
var socket = require('./Socket');


// game rules
socket.on('game rules', function(ruleset) {
    //console.log('received ruleset:');
    //console.log(ruleset);
    GameState.rules = ruleset;
    GameState.currently_available = ruleset.cells_per_player;

    // Update the grid with new rules
    var GameBoard = require('./GameBoard');
    GameBoard.updateBoardRules();
});

// New generation timestamp
socket.on('game new generation', function() {
    // Set the timestamp of the current generation for progress bar calculations
    GameState.generation.timestamp = window.performance.now();
    GameState.generation.count++;

    GameState.currently_available = Math.min(GameState.currently_available+1, GameState.rules.cells_per_player);
    m.redraw();

});

socket.on('player cells', function(amount) {
    GameState.currently_available = amount;
    m.redraw();
});

var GameState = {
    rules: {
        width: 0,
        height: 0,
        time_per_generation: 10000,
        cells_per_player: 48
    },
    generation: {
        count: 0,
        remaining_time: 5000,
        progress_percentage: 20,
        timestamp: window.performance.now()
    },
    currently_available: 47,
    players: [],
    calculateGenerationProgress: function() {
        GameState.generation.remaining_time = GameState.rules.time_per_generation - (window.performance.now() - GameState.generation.timestamp);
        //console.log('remaining time: ' + GameState.generation.remaining_time);
        GameState.generation.progress_percentage = 1 - (GameState.generation.remaining_time / GameState.rules.time_per_generation);
        //console.log(GameState.generation.progress_percentage)
        return GameState.generation.progress_percentage;
    }

};

//requestAnimationFrame()

//setInterval(GameState.calculateGenerationProgress, 16);

module.exports = GameState;