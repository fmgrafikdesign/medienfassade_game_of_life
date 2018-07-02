var m = require('mithril');
var Settings = require('./Settings');

var closebutton = {

    view: function() {
        if(!Settings.setupcompleted) return;
        return m('a.close', { href: '/', oncreate: m.route.link} )
    }
};

module.exports = {
    view: function(vnode) {
        //console.log(vnode.children);
        return m('.overlay', vnode.children, m(closebutton));
    }
};