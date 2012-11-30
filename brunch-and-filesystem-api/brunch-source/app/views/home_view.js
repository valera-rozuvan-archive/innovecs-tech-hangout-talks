var View, application, template;

View = require('./view');
application = require('application');
template = require('./templates/home');

module.exports = View.extend({
    'id': 'home-view',

    'template': template,

    'events': {
        'click .goto': 'gotoDiv'
    },

    'afterRender': function() {
        $(this.el).find('#content').append(application.newFileView.render().el);
        $(this.el).find('#content').append(application.viewFileView.render().el);
    },

    'gotoDiv': function (event) {
        var scrollToId;

        scrollToId = $(event.target).attr('data-goto');

        console.log(scrollToId);

        $.scrollTo($('#' + scrollToId), 1000);
    }
});
