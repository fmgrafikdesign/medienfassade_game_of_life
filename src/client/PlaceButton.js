var m = require('mithril');
var GameBoardSelectedCells = require('./GameBoardSelectedCells');

module.exports = {
    view: function() {
        return m('.button-wrapper', m('a.place-button', { onclick: placeSelection },'Platzieren'));
    }
};

function placeSelection() {
    GameBoardSelectedCells.placeCells();
};

/*

20.020 selectedCells in total (with current game setup)

[{x:1,y:5},]
10 bits per cell (ohne Spielerinformation)

[{x:1,y:5,i:3},]
14 bits per cell (with player info)

Ganzes Spielfeld als Objekte: 278.528 Bits |34 kB

Kombination? Reihen als Arrays, Spalten als Objekte:
[
{
 x:1,a:[{y:3,i:4},{y:5,i:3}],
}

Worst case: each row has 1 difference -> 4 bits more than the all object approach (14 -> 18)
[{x:1,[{y:3,i:4}]},]

Next worst case: each row has 2 differences -> 14 bits per row (already on par with the all object approach)
[{x:1,[{y:3,i:4}]},{y:5,i:3},]

Alles verschachtelte Arrays



Ganzes Array: 4,88 kB (ohne Spielerinformationen)
Ganzes Array 120.176 Bits | 14,67 kB (mit Spielerinformationen, unkomprimiert)

8584 (~43% des Spielfeldes) Zellen können als Objekte geupdatet werden, ab dann ist es billiger, das ganze Array zu schicken

Educated guess: Es werden sich fast immer weniger als 43% der Zellen pro Generation verändern.

1
[0,1]
1 Bit
~120250 Bits mit Spielerinformation
 */
/*
[
    [1,[[3,4],[4,4],[3,4],[4,4]]],
    [1,[[3,4],[4,4]]]
]
*/
// 12 bits for a single selectedCells (worst case)
// 18 bits for 2 selectedCells (9 bits each)
// 30 bits for 4 selectedCells (7.5 bits each)

// Since the game board has more height than width, we catch more selectedCells per row than per column
// If all selectedCells in a row change, it's cheap this way: 6 chars per cell, 7 chars overhead per row
// (7 + (width * 6)) * 52
// ~120.500 bits mit Spielerinformation für das ganze Spielfeld.
// -> Im Worst Case fast so gut wie die erste Methode, die immer das ganze Spielfeld sendet
// -> Sendet aber immer nur das, was gebraucht wird. Beispiel: 10 Zellen in 5 Reihen ändern sich:

// (7 + ((10/2) * 6)) * 5

// --> 95 bits für diese Änderung