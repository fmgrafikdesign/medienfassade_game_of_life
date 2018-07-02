// Handles the placement of cells, draws a preselection and similiar.

var m = require('mithril');
var socket = require('./Socket');

var GameBoardPlaceCells = {

    cells: [
        {x:1,y:4},
        {x:2,y:4},
        {x:1,y:5},
        {x:2,y:5}
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