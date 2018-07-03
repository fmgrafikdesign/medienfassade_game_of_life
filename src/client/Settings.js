// Settings object that stores player name, color, dark/light theme and other settings


var m = require('mithril');

var Settings = {
    color: '#ffffff',
    name: '',
    darktheme: true,
    setupcompleted: false,

    rendering: {
        grid_background: '#333',
        grid: '#6b6b6b',
        neutral: '#ddd'
    }
};



module.exports = Settings;