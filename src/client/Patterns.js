var m = require('mithril');

var pattern_text = 'Eine kleine Auswahl an Mustern, die zu interessanten Ergebnissen im Spielfeld führen. Bauen musst du sie aber selbst!';

var oscillators = {
    name: 'Oszillatoren',
    desc: 'Strukturen, die sich über mehrere Generationen hinweg verändern und am Ende wieder in ihrer Ausgangsform landen.',
    pattern: [
        {
            name: 'Blinker',
            cells: [
                [0,0,0],
                [1,1,1],
                [0,0,0]
            ]
        }
    ],
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 61 61"><path fill="#4d4d4d" stroke="#999" stroke-miterlimit="10" d="M.5.5h20v20H.5zM20.5.5h20v20h-20zM40.5.5h20v20h-20z"/><path fill="#e6e6e6" stroke="#999" stroke-miterlimit="10" d="M.5 20.5h20v20H.5zM20.5 20.5h20v20h-20zM40.5 20.5h20v20h-20z"/><path fill="#4d4d4d" stroke="#999" stroke-miterlimit="10" d="M.5 40.5h20v20H.5zM20.5 40.5h20v20h-20zM40.5 40.5h20v20h-20z"/></svg>'
};

var still = {
    name: 'Stillleben',
    desc: 'Strukturen, die sich ohne externe Einflüsse nicht verändern.',
    pattern: [
        {
            name: 'Block',
            cells: [
                [0,0,0,0],
                [0,1,1,0],
                [0,1,1,0],
                [0,0,0,0]
            ]
        }
    ]
};

function display_pattern_type(type) {

    return {
        view: function() {
            return [
                m('h3', type.name),
                m('p', type.desc)
            ]
        }
    }
};

module.exports = {
    view: function() {
        return [
            m('h1', 'Muster'),
            m('p', pattern_text),
            m(display_pattern_type(oscillators)),
            m(display_pattern_type(still))
            ]
    }
};