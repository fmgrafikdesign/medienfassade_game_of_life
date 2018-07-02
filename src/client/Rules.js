var m = require('mithril');

var rules = [
    'Das Spielfeld besteht aus Zellen.',
    'Zellen sind entweder tot oder lebendig.',
    'Tote Zellen mit genau drei lebenden Nachbarn werden in der Folgegeneration neu geboren.',
    'Lebende Zellen mit weniger als zwei Nachbarn sterben an Einsamkeit.',
    'Lebende Zellen mit zwei oder drei Nachbarn bleiben am Leben.',
    'Lebende Zellen mit mehr als drei Nachbarn sterben an Überbevölkerung.',
];

var encouragement = 'Probieren geht über Studieren!';

module.exports = {
    view: function() {
        return [
            m('h1', 'Regeln'),
            m('.rules', rules.map(function(rule) {
                return m('p', rule);
            })),
            m('strong', encouragement)
            ];
    }
};