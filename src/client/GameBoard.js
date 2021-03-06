var m = require('mithril');
var GameState = require('./GameState');
var GamePlayers = require('./GamePlayers');
var GameBoardSelectedCells = require('./GameBoardSelectedCells');
var Settings = require('./Settings');
var socket = require('./Socket');

// initial game board
socket.on('game board', function (board) {
    GameBoard.board = board;
    //console.log('initial board:');
    //console.log(board);
});

// update game board
/*
socket.on('game update board', function (board) {
    GameBoard.board = board;
    drawCells();
    if (GameBoard.canvas) {
        GameBoard.canvas.redraw();
    }
});
*/
// Improved, compressed game board update
/** Receives data like this:
 *  Array board = [ [1,[[3,4],[4,4],[3,4],[4,4]]],  [1,[[3,4],[4,4]]] ]
 *  [
 *      [y,[[x,i],x,[x,i]]],
 *      [y,[[x,i],[x,i],x]],
 *      ...
 *  ]
 *  y is the row we look at.
 *  x is the column we look at.
 *  i is the index of the player the cell belongs to.
 *  if the cell changed to dead, it'll only tell you its position, since the player number is void.
 */
socket.on('game board update', function (board) {
    //console.log(board);
    /*
    GameBoard.board = board;
    drawCells();
    if(GameBoard.canvas) {
        GameBoard.canvas.redraw();
    }
    */
    updateBoard(board);

    drawCells();
    if (GameBoard.canvas) {
        GameBoard.canvas.redraw();
    }

    GamePlayers.updatePlayerCellCount(GameBoard.board);

    //console.log(GameBoard.board);
});

// Updates the board with a supplied set of changes (see the 'game board update' event)
function updateBoard(updates) {

    var temp = GameBoard.board;

    // Loop through rows
    for (var y = 0; y < updates.length; y++) {

        // what row are we looking at?
        var row = updates[y][0];
        // Loop through changes
        var changes = updates[y][1];
        for (var x = 0; x < changes.length; x++) {

            // If it's an array, the cell is alive and has a player id associated with it
            if (Array.isArray(changes[x])) {
                var column = changes[x][0];
                temp[row][column] = changes[x][1];
            }
            // If it's not an array, the cell is dead. We only care for its position then.
            else {
                temp[row][changes[x]] = dead;
            }

        }

    }
    GameBoard.board = temp;
    //console.log(GameBoard.board);
}

// Pixels per cell, including surrounding border
var pixels_per_cell = 20;

// More pixels per cell on high-resolution displays
//serverdebug(window.devicePixelRatio);
if(window.devicePixelRatio > 1.5) {
    pixels_per_cell = 26;
}

const dead = -1;
const neutral = 0;

// Width of the border in px
var border_width = 2;

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};

var width = GameState.rules.width;
var height = GameState.rules.height;
var settings = Settings.rendering;

// Draw the grid
var grid;
function drawGrid() {
    //console.log('generating grid...');
    var grid_canvas = document.createElement('canvas');
    var grid_ctx = grid_canvas.getContext('2d');
    grid_canvas.width = GameState.rules.width * pixels_per_cell;
    grid_canvas.height = GameState.rules.height * pixels_per_cell;

    //console.log(GameState.rules.width + ' ' + pixels_per_cell);

    for (var i = 0; i < width; i++) {
        for (var j = 0; j < height; j++) {
            // Border
            grid_ctx.fillStyle = settings.grid;
            grid_ctx.fillRect(i * pixels_per_cell, j * pixels_per_cell, pixels_per_cell, pixels_per_cell);
            grid_ctx.fillStyle = settings.grid_background;
            grid_ctx.fillRect(i * pixels_per_cell + border_width / 2, j * pixels_per_cell + border_width / 2, pixels_per_cell - border_width, pixels_per_cell - border_width);
        }
        //console.log(i);
    }

    //grid_ctx.fillRect(10, 10, 100, 100);

    //console.log(grid_canvas);
    grid = grid_canvas;
}

// Draw active cells
var cells;
function drawCells() {
    var board = GameBoard.board;
    //console.log(board);

    var cells_canvas = document.createElement('canvas');
    var cells_ctx = cells_canvas.getContext('2d');
    cells_canvas.width = GameState.rules.width * pixels_per_cell;
    cells_canvas.height = GameState.rules.height * pixels_per_cell;

    // Cache player colors
    var colors = { '0': Settings.rendering.neutral };
    GamePlayers.players.forEach(function(player) {
        colors[player.uid] = player.color;
    });

    for (var row = 0; row < board.length; row++) {
        for (var column = 0; column < board[row].length; column++) {

            //console.log(board[column][row]);
            if (board[row][column] !== dead) {
                cells_ctx.fillStyle = colors[board[row][column]] || Settings.rendering.neutral;
                //cells_ctx.fillStyle = '#ddd';
                cells_ctx.fillRect(column * pixels_per_cell + border_width / 2, row * pixels_per_cell + border_width / 2, pixels_per_cell - border_width, pixels_per_cell - border_width);
            }
        }
    }

    cells = cells_canvas;
}

// Draw selected cells
var selection;
function drawSelection() {
    var board = GameBoard.board;

    var selection_canvas = document.createElement('canvas');
    var selection_ctx = selection_canvas.getContext('2d');
    selection_canvas.width = GameState.rules.width * pixels_per_cell;
    selection_canvas.height = GameState.rules.height * pixels_per_cell;

    // Cache player colors
//    var colors = { '0': Settings.rendering.neutral };
//    GamePlayers.players.forEach(function(player) {
//        colors[player.uid] = player.color;
// });

    var selected = GameBoardSelectedCells.selectedCells;

    selection_ctx.strokeStyle = Settings.color;
    selection_ctx.lineWidth = 4;
    selected.forEach(function(selectedcell) {
        selection_ctx.strokeRect((selectedcell.x) * pixels_per_cell + border_width / 2, (selectedcell.y) * pixels_per_cell + border_width / 2, pixels_per_cell - border_width, pixels_per_cell - border_width);
    });

    selection = selection_canvas;

}

function setupCanvas(dom) {
    var canvas = dom;
    var ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var cam = {x: 0, y: 0};

    // Coordinates when dragging starts
    var camDragStart = {x: 0, y: 0};
    var touchStart = {x: 0, y: 0};
    var dragDelta = {x: 0, y: 0};

    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        updateTranslation();
        //redraw();
    }

    resizeCanvas();

    ctx.fillStyle = settings.grid_background;
    ctx.fillRect(0, 0, width * pixels_per_cell, height * pixels_per_cell);

    function requestRedraw() {
        if (document.hidden) return;
        //requestAnimationFrame(redraw);
        redraw();
    }

    function redraw() {
        //console.log('redrawing');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Translate everything, effectively emulating a camera
        ctx.translate(cam.x, cam.y);

        // Draw the grid on the canvas
        if (!grid) {
            drawGrid();
        }
        ctx.drawImage(grid, 0, 0);

        // Draw the active cells on the canvas
        if (!cells) {
            drawCells();
        }
        ctx.drawImage(cells, 0, 0);

        // Draw the player selection on the canvas
        if (!selection) {
            drawSelection();
        }
        ctx.drawImage(selection, 0, 0);

    }

    var dragCanvas = false;
    var dragSelection = false;

    canvas.addEventListener('touchstart', startDrag);
    canvas.addEventListener('mousedown', startDrag);

    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('touchend', endDrag);

    function startDrag(event) {
        //console.log(event);
        touchStart.x = event.x || event.changedTouches[0].pageX;
        touchStart.y = event.y || event.changedTouches[0].pageY;

        camDragStart.x = cam.x;
        camDragStart.y = cam.y;

        //console.log(camDragStart);

        canvas.addEventListener('touchmove', whileDragging);
        canvas.addEventListener('mousemove', whileDragging);
        //console.log('startDrag');

        //event.preventDefault();
        //serverdebug('startDrag');
    };

    function whileDragging(event) {
        //console.log(event);
        dragDelta.x = (event.x || event.changedTouches[0].pageX) - touchStart.x;
        dragDelta.y = (event.y || event.changedTouches[0].pageY) - touchStart.y;


        var distance = Math.sqrt(dragDelta.x*dragDelta.x + dragDelta.y*dragDelta.y);
        //serverdebug(distance);

        //console.log(distance);

        if(!dragCanvas && distance > Settings.touchdistancetreshold ) {
            dragCanvas = true;
        }

        //console.log(dragDelta);
        //serverdebug(dragDelta);
        updateTranslation();

        //console.log(dragDelta);
        //console.log('whileDragging');
        //event.preventDefault();
        //serverdebug('whileDragging');
    };

    function endDrag(event) {

        // If we were dragging something, just stop dragging
        if(dragCanvas || dragSelection) {
            dragCanvas = false;
            dragSelection = false;
            //console.log('mouseup after dragging');
        }
        // no dragging happened, select the cell we touched.
        else {
            // Calculate the x and y cell we clicked. Substract the current camera offset!
            //console.log("%s %s", cam.x, cam.y)
            var coordinates = { x: Math.ceil((touchStart.x - cam.x)/ pixels_per_cell), y: Math.ceil((touchStart.y  - cam.y) / pixels_per_cell )};
            //console.log('selected cell x: %s, y: %s', coordinates.x, coordinates.y);
            GameBoardSelectedCells.select(coordinates);
        }
        //console.log('endDrag');
        dragDelta.x = (event.x || event.changedTouches[0].pageX) - touchStart.x;
        dragDelta.y = (event.y || event.changedTouches[0].pageY) - touchStart.y;


        canvas.removeEventListener('touchmove', whileDragging);
        canvas.removeEventListener('mousemove', whileDragging);

        updateTranslation();
        event.preventDefault();
        //serverdebug('endDrag');
    }

    function updateTranslation() {
        // clamp the numbers to the screen.
        //console.log(camDragStart.x + dragDelta.x);
        cam.x = (camDragStart.x + dragDelta.x).clamp(canvas.width - width * pixels_per_cell, 0);
        cam.y = (camDragStart.y + dragDelta.y).clamp(canvas.height - height * pixels_per_cell, 0);

        //console.log(cam);

        //cam.x = (camDragStart.x + dragDelta.x);
        //cam.y = (camDragStart.y + dragDelta.y);

        requestRedraw();
    }

    requestRedraw();

    return {
        redraw: requestRedraw
    }
}

var GameBoard = {

    view: function () {
        return m('#gameboard', m('canvas.gameboard', {
                oncreate: function (ref) {
                    GameBoard.canvas = setupCanvas(ref.dom);
                }
            }
        ));
    },

    board: [],
    canvas: null,

    updateBoardRules: function () {
        width = GameState.rules.width;
        height = GameState.rules.height;
        drawGrid();
    },

    redrawSelection: function() {
        drawSelection();
        GameBoard.canvas.redraw();
    }
};

module.exports = GameBoard;

function serverdebug(msg) {
    socket.emit('debug msg', msg);
}