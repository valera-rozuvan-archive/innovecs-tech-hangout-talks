// Application bootstrapper.
Application = {
    'initialize': function() {
        var Router = require('lib/router');

        var Files = require('models/files');

        var HomeView = require('views/home_view');
        var NewFileView = require('views/new_file_view');
        var ViewFileView = require('views/view_file_view');

        this.files = new Files();

        this.homeView = new HomeView();
        this.viewFileView = new ViewFileView();
        this.newFileView = new NewFileView();

        this.router = new Router();

        if (typeof Object.freeze === 'function')
            Object.freeze(this);
    }
};

module.exports = Application;
