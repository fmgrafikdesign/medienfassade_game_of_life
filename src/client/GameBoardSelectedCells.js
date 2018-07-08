// Handles the placement of cells, draws a preselection and similiar.

var m = require('mithril');
var socket = require('./Socket');

var GameBoardSelectedCells = {

    selectedCells: [],

    isSelected: function( coordinates ) {
        return GameBoardSelectedCells.selectedCells.find(function(cell) {
            return (cell.x === coordinates.x-1 && cell.y === coordinates.y-1)
        });
    },

    addCellToSelection: function( coordinates ) {
        //console.log('adding cell {%s,%s} to selection', coordinates.x, coordinates.y);
        GameBoardSelectedCells.selectedCells.push( {x: coordinates.x-1, y: coordinates.y-1 });
    },

    removeCellFromSelection: function(coordinates) {
        //console.log('removing cell {%s,%s} from selection', coordinates.x, coordinates.y);
        GameBoardSelectedCells.selectedCells = GameBoardSelectedCells.selectedCells.filter(function(cell) {
            return !(cell.x === coordinates.x-1 && cell.y === coordinates.y-1)
        });
    },

    select: function(coordinates) {
        if(GameBoardSelectedCells.isSelected(coordinates)) {
            GameBoardSelectedCells.removeCellFromSelection(coordinates);
        } else {
            GameBoardSelectedCells.addCellToSelection(coordinates);
        }
        //console.log(GameBoardSelectedCells.selectedCells);
        require('./GameBoard').redrawSelection();
    },

    placeCells: function() {
        console.log('trying to place cells...');
        socket.emit('place cells', GameBoardSelectedCells.selectedCells, function (response) {
            //console.log('got response: %s', response);
            if(response === true) {
                // clear the selection
                //console.log('successfully placed');
                while(GameBoardSelectedCells.selectedCells.length > 0) {
                    GameBoardSelectedCells.selectedCells.pop();
                }

                //console.log('cleared selection:');
                //console.log(GameBoardSelectedCells.selectedCells);
                require('./GameBoard').redrawSelection();

            } else {
                console.log(response);
            }
        })
    }
}

module.exports = GameBoardSelectedCells;