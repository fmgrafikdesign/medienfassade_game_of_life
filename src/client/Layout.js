var m = require('mithril');
var FooterMenu = require('./FooterMenu');
var AvailableCells = require('./AvailableCells');

var PlaceButton = require('./PlaceButton');

var GameState = require('./GameState');

var NextGenerationBar = require('./NextGenerationBar');



module.exports = {
    view: function(vnode) {

        return m('.content', [
            m(NextGenerationBar),
            m(AvailableCells),
            m(PlaceButton),
            m(FooterMenu),
            vnode.children
            ]);
    }
};



/*
<svg width="100%" height="100vh" xmlns="http://www.w3.org/2000/svg">
    <defs>
    <pattern id="smallGrid" width="24" height="24" patternUnits="userSpaceOnUse">
    <path d="M 0 0 L 0 24 24 24 24 0 Z" fill="#333333" stroke="#7e7e7e" stroke-width="1" />
    </pattern>
    </defs>

    <rect id="gameboard" width="100%" height="1005" fill="url(#smallGrid)" />
    </svg>

    <!-- Indicator for time until next generation -->
    <div class="top-bar"></div>


*/