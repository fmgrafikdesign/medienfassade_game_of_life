var m = require('mithril');
var GameState = require('./GameState');
var GamePlayers = require('./GamePlayers');
var Settings = require('./Settings');
//var p5 = require('p5');

// Pixels per cell, including surrounding border
var pixels_per_cell = 20;

// Width of the border in px
var border_width = 2;

Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};

function setupCanvas(dom) {
    var canvas = dom;
    var ctx = canvas.getContext('2d');

    var settings = Settings.rendering;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    //
    var width = GameState.rules.width;
    var height = GameState.rules.height;

    var cam = { x:0, y:0 };

    // Coordinates when dragging starts
    var camDragStart = { x:0, y:0};
    var dragStart = { x:0, y:0 };
    var dragDelta = { x:0, y:0 };

    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        redraw();
        updateTranslation();
    }
    resizeCanvas();

    ctx.fillStyle = settings.grid_background;
    ctx.fillRect(0, 0, width * pixels_per_cell, height * pixels_per_cell);

    // Draw the grid
    ctx.fillStrokeStyle = '#ff0000';
    ctx.fillStyle = 'green';
    ctx.lineWidth = 2;
    for(var i = 0; i < width; i++) {
        for( var j = 0; j < height; j++) {
            // Border
            ctx.fillStyle = settings.grid;
            ctx.fillRect(i * pixels_per_cell, j * pixels_per_cell, pixels_per_cell, pixels_per_cell);
            ctx.fillStyle = settings.grid_background;
            ctx.fillRect(i * pixels_per_cell + border_width/2, j * pixels_per_cell + border_width/2, pixels_per_cell-border_width, pixels_per_cell-border_width);
        }
    }

    function redraw() {
        console.log('redrawing');
        ctx.setTransform(1,0,0,1,0,0);
        //ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.translate( cam.x, cam.y);



        ctx.fillRect(10, 10, 100, 100);

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

        canvas.addEventListener('touchmove', whileDragging);
        canvas.addEventListener('mousemove', whileDragging);
    };

    function whileDragging(event) {
        //console.log(event);
        dragDelta.x = (event.x  || event.changedTouches[0].pageX) - dragStart.x;
        dragDelta.y = (event.y  || event.changedTouches[0].pageY) - dragStart.y;

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
        cam.x = (camDragStart.x + dragDelta.x).clamp(0, canvas.width - width * pixels_per_cell);
        cam.y = (camDragStart.y + dragDelta.y).clamp(0, canvas.height - height * pixels_per_cell);

        cam.x = (camDragStart.x + dragDelta.x);
        cam.y = (camDragStart.y + dragDelta.y);

        console.log(cam);
        redraw();
    }

    function clamp(min, max, value) {

    }

}

module.exports = {

    view: function() {
        return m('#gameboard', m('canvas.gameboard', {
                oncreate: function (ref) {
                    setupCanvas(ref.dom);
                }
            }
            ));
    }
};