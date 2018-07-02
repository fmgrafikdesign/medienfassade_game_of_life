var m = require('mithril');

var footer_links = [
    {
        name: 'Spielregeln',
        href: '/rules'
    },
    {
        name: 'Muster',
        href: '/patterns'
    },
    {
        name: 'Statistik',
        href: '/statistics'
    }
];

//console.log(footer_links);
var FooterLinks = {
    view: function() {
        return footer_links.map(function(item) {
            //console.log(item.href);
            return m('a.footer-link', { href: item.href, oncreate: m.route.link, class: ''}, item.name)
        })
    }
};

module.exports = {
    view: function() {
        return m('.footer-menu',
            m('.footer-links', m(FooterLinks)))
    }
};

/*

<!-- Footer Navigation -->
<div class="footer-menu">
    <div class="footer-links">
        <a href="#" id="show-rules" class="footer-link">Spielregeln</a>
        <a href="#" id="show-patterns" class="footer-link">Muster</a>
        <a href="#" id="show-statistic" class="footer-link">Statistik</a>
    </div>
</div>

 */