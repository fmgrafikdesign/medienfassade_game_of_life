// The setup when a new player joins
var m = require('mithril');
var socket = require('./Socket');
var Settings = require('./Settings');
//var Picker = require('vanilla-picker');

// Failed attempt to require vanilla-picker in the app. It works kinda, but throws a TypeError about a non-defined html element. Weird.
/*
var _vanillaPicker = require('vanilla-picker');
var _vanillaPicker2 = _interopRequireDefault(_vanillaPicker);
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var Picker = _vanillaPicker2.default;
*/

// Chose color and a name. Maybe dark theme.

// Chose name
var PlayerName = {
    view: function () {
        return m('input[type="text"].player-name-input', {
            placeholder: 'Dein Spielername',
            value: Settings.name,
            oninput: m.withAttr('value', function (value) {
                //console.log(value);
                Settings.name = value;
            })
        });
    }
};

// Chose color
var ColorPicker = {
    oncreate: function(ref) {
        var dom = ref.dom;

        //console.log('oncreate');
        new Picker({
            parent: dom,
            popup: false,
            alpha: false,
            color: '#4c6cff',
            editor: false,

            onChange: function(color) {
                //console.log('onChange: ');
                //console.log(color);
                Settings.color = color.hex;
                m.redraw();
            }
        })
    },
    view: function() {
        return m('#color-picker')
    }
};

// Dark theme?
var DarkTheme = {
    view: function () {
        return m('.checkboxes', [
            m('label', [
                m('input[type="checkbox"].checkboxes', {
                    checked: Settings.darktheme,
                    onchange: m.withAttr('checked', function (value) {
                        console.log(value);
                        Settings.darktheme = value;
                    })
                }),
                'Dunkles Interface?'])
        ])
    }
};

// Confirm
var ConfirmButton = {
    view: function () {
        return m('a.confirm-button', {
            onclick: sendPlayerToServer,
            style: {
                'background': Settings.color
            }
        }, m('span.mix-blend-mode-difference', 'Bestätigen'));
    }
};



function sendPlayerToServer() {

    var player = {
        color: Settings.color,
        name: Settings.name
    };

    socket.emit('new player', player, function (response) {
        if(response === true) {
            Settings.setupcompleted = true;
            m.route.set('/rules');
        } else {
            console.log('Uh oh. Something went wrong... The server rejected you: ' + response);
        }
    });
}

var Setup = {
    view: function () {
        return m('.setup-wrapper', m('.setup-inner',
            [
                m(PlayerName),
                m(ColorPicker),
                m(DarkTheme),
                m(ConfirmButton)
            ]));
    }
};


module.exports = Setup;