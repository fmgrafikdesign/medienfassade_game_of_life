var m = require('mithril');
var GameState = require('./GameState');
var GamePlayers = require('./GamePlayers');
var Settings = require('./Settings');
var socket = require('./Socket');

// initial game board
socket.on('game board', function(board) {
    GameBoard.board = board;
});

// update game board
socket.on('game update board', function(board) {
    GameBoard.board = board;
    drawCells();
    if(GameBoard.canvas) {
        GameBoard.canvas.redraw();
    }
});

// Improved, compressed game board update
/** Receives data like this:
 *  Array board = [ [1,[[3,4],[4,4],[3,4],[4,4]]],  [1,[[3,4],[4,4]]] ]
 *  [
 *      [y,[[x,i],[x,i],[x,i]]],
 *      [y,[[x,i],[x,i],[x,i]]],
 *      ...
 *  ]
 *  y is the row we look at.
 *  x is the column we look at.
 *  i is the index of the player the cell belongs to, -1 or undefined means the cells is now dead
  */
socket.on('game board update', function(board) {
    GameBoard.board = board;
    drawCells();
    if(GameBoard.canvas) {
        GameBoard.canvas.redraw();
    }
});

// Pixels per cell, including surrounding border
var pixels_per_cell = 20;

// Width of the border in px
var border_width = 2;

Number.prototype.clamp = function(min, max) {
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

    for(var i = 0; i < width; i++) {
        for( var j = 0; j < height; j++) {
            // Border
            grid_ctx.fillStyle = settings.grid;
            grid_ctx.fillRect(i * pixels_per_cell, j * pixels_per_cell, pixels_per_cell, pixels_per_cell);
            grid_ctx.fillStyle = settings.grid_background;
            grid_ctx.fillRect(i * pixels_per_cell + border_width/2, j * pixels_per_cell + border_width/2, pixels_per_cell-border_width, pixels_per_cell-border_width);
        }
        //console.log(i);
    }

    //grid_ctx.fillRect(10, 10, 100, 100);

    //console.log(grid_canvas);
    grid = grid_canvas;
}

var cells;
function drawCells() {
    var board = GameBoard.board;
    //console.log(board);

    var cells_canvas = document.createElement('canvas');
    var cells_ctx = cells_canvas.getContext('2d');
    cells_canvas.width = GameState.rules.width * pixels_per_cell;
    cells_canvas.height = GameState.rules.height * pixels_per_cell;

    //console.log(board.length);
/*
    for(var column = 0; column < board.length; column++) {
        for( var row = 0; row < board[column].length; row++) {
            //console.log(board[column][row]);
            if(board[column][row]) {
                cells_ctx.fillStyle = '#ddd';
                cells_ctx.fillRect(column * pixels_per_cell + border_width / 2, row * pixels_per_cell + border_width / 2, pixels_per_cell - border_width, pixels_per_cell - border_width);
            }
        }
    }
    */
    for( var row = 0; row < board.length; row++) {
    for(var column = 0; column < board[row].length; column++) {

            //console.log(board[column][row]);
            if(board[row][column]) {
                cells_ctx.fillStyle = '#ddd';
                cells_ctx.fillRect(column * pixels_per_cell + border_width / 2, row * pixels_per_cell + border_width / 2, pixels_per_cell - border_width, pixels_per_cell - border_width);
            }
        }
    }

    //grid_ctx.fillRect(10, 10, 100, 100);

    //console.log(grid_canvas);
    cells = cells_canvas;
}


function setupCanvas(dom) {
    var canvas = dom;
    var ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var cam = { x:0, y:0 };

    // Coordinates when dragging starts
    var camDragStart = { x:0, y:0};
    var dragStart = { x:0, y:0 };
    var dragDelta = { x:0, y:0 };

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
        if(document.hidden) return;
        //requestAnimationFrame(redraw);
        redraw();
    }

    function redraw() {
        //console.log('redrawing');
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Translate everything, effectively emulating a camera
        ctx.translate( cam.x, cam.y);

        // Draw the grid on the canvas
        if(!grid) { drawGrid(); }
        ctx.drawImage(grid, 0, 0);

        // Draw the cells on the canvas
        if(!cells) { drawCells(); }
        ctx.drawImage(cells, 0, 0);
    }

    canvas.addEventListener('touchstart', startDrag);
    canvas.addEventListener('mousedown', startDrag);

    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('touchend', endDrag);

    function startDrag(event) {
        //console.log(event);
        dragStart.x = event.x || event.changedTouches[0].pageX;
        dragStart.y = event.y || event.changedTouches[0].pageY;

        camDragStart.x = cam.x;
        camDragStart.y = cam.y;

        //console.log(camDragStart);

        canvas.addEventListener('touchmove', whileDragging);
        canvas.addEventListener('mousemove', whileDragging);
    };

    function whileDragging(event) {
        //console.log(event);
        dragDelta.x = (event.x  || event.changedTouches[0].pageX) - dragStart.x;
        dragDelta.y = (event.y  || event.changedTouches[0].pageY) - dragStart.y;
        //console.log(dragDelta);
        updateTranslation();

        //console.log(dragDelta);
    };

    function endDrag(event) {
        //console.log(event);
        dragDelta.x = (event.x  || event.changedTouches[0].pageX) - dragStart.x;
        dragDelta.y = (event.y  || event.changedTouches[0].pageY) - dragStart.y;


        canvas.removeEventListener('touchmove', whileDragging);
        canvas.removeEventListener('mousemove', whileDragging);

        updateTranslation();
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

    view: function() {
        return m('#gameboard', m('canvas.gameboard', {
                oncreate: function (ref) {
                    GameBoard.canvas = setupCanvas(ref.dom);
                }
            }
        ));
    },

    board: [],
    canvas: null,

    updateBoardRules: function() {
        width = GameState.rules.width;
        height = GameState.rules.height;
        drawGrid();
    }
};

module.exports = GameBoard;