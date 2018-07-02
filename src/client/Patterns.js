var m = require('mithril');

var pattern_text = 'Eine kleine Auswahl an Mustern, die zu interessanten Ergebnissen im Spielfeld führen. Bauen musst du sie aber selbst!';

module.exports = {
    view: function() {
        return [
            m('h1', 'Muster'),
            m('p', pattern_text)
            ]
    }
};