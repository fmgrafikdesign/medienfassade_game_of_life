var m = require('mithril');
m.stream = require("mithril/stream");

var GameState = require('./GameState');
var Settings = require('./Settings');
/*

This 'Observer' component expects the attrs described below.
The vdom rendered by `view` will re-render normally within
Mithril's redraw cycle.
The vdom rendered by `render` will only re-render when the
value stream updates. This will not trigger global redraws.
`render` renders into the dom node described by `selector`,
otherwise defaults to the component's root node.

ObserverAttrs<T> {
	value: Stream<T>,
	selector?: string,
	view(vnode: Vnode): Vnode,
	render(value: T): Vnode
}

*/
var observer = function observer(_ref) {
    var valueSrc = _ref.attrs.value;

    // Create a dependent stream we can usubscribe to on removal
    var value = valueSrc.map(function (v) {
        return v;
    });
    return {
        oncreate: function oncreate(_ref2) {
            var dom = _ref2.dom,
                _ref2$attrs = _ref2.attrs,
                render = _ref2$attrs.render,
                selector = _ref2$attrs.selector;

            // Did we get a selector or should we render to root node?
            var el = typeof selector === 'string' ? dom.querySelector(selector) : dom;
            // Re-render only on stream updates
            value.map(function (v) {
                m.render(el, render(v));
            });
        },
        onremove: function onremove() {
            // Unsubscribe from stream
            value.end(true);
        },
        view: function view(vnode) {
            return vnode.attrs.view(vnode);
        }
    };
};

// Hold progress state in a stream
progress = m.stream();

// Simulate loading with a RAF loop
function loadLoop() {
    progress(GameState.calculateGenerationProgress());
    requestAnimationFrame(loadLoop);
}
/*
function start() {
    progress(0);
    requestAnimationFrame(loadLoop);
}*/

loadLoop();

/**
 * The loadingBar component hands off stream subscribe/unsubscribe
 * management and manual render to the observer component.
 * We declare view (outer) and render (inner) functions that
 * the observer component will invoke.
 */
var loading = {
    view: function view(_ref3) {
        var progress = _ref3.attrs.progress;

        return m(observer, {
            // The selector used to find the render target element
            selector: '.top-bar-outer',
            value: progress,
            render: function render(progress) {
                return m('.top-bar', { style: {
                    width : progress * 100 + '%',
                    background: Settings.color
                } });
            },
            view: function view() {
                return m('.loading-block',
                    m('.top-bar-outer'));
            }
        });
    }
};

/* Main app component */
var app = {
    view: function view() {
        return m(loading, { progress: progress });
    }
};

module.exports = app;