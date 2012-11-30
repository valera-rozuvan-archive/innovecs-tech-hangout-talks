var application = require('application');

module.exports = Backbone.Router.extend({
    routes: {
        '': 'home',
        'new_file': 'new_file',
        'view_file': 'view_file'
    },

    'home': function() {
        $('body').html(application.homeView.render().el);
    },

    'new_file': function (num) {
        $('body').html(application.newFileView.render().el);
    },

    'view_file': function (fileName) {
        $('body').html(application.viewFileView.render().el);
    }
});
