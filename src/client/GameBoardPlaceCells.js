// Handles the placement of cells, draws a preselection and similiar.

var m = require('mithril');
var socket = require('./Socket');

var GameBoardPlaceCells = {

    cells: [
        {x:10,y:4},
        {x:11,y:4},
        {x:10,y:5},
        {x:11,y:5},
        {x:13,y:5},
        {x:14,y:6},
        {x:11,y:7},
        {x:12,y:8},
        {x:14,y:8},
        {x:15,y:8},
        {x:14,y:9},
        {x:15,y:9}
        ],

    placeCells: function() {
        socket.emit('place cells', GameBoardPlaceCells.cells, function (response) {
            if(response === true) {
                console.log('placing successful!');
            } else {
                console.log(response);
            }
        })
    }
}

module.exports = GameBoardPlaceCells;