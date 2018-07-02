var m = require('mithril');

var GameState = require('./GameState');

module.exports = {
    view: function() {
        return m('.available-cells', m(
            '.available-cells-inner', [
                'Verfügbare Zellen: ',
                m('span#cells', GameState.currently_available)
            ]
        ));
    }
};
