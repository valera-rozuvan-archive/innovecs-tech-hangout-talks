var View, template, application;

View = require('./view');
template = require('./templates/new_file');
application = require('application');

module.exports = View.extend({
    'id': 'new_file-view',

    'template': template,

    'events': {
        'click .new_file': 'createNewFile'
    },

    'afterRender': function () {

    },

    'createNewFile': function () {
        var fileName;

        fileName = $(this.el).find('.file_name').val();

        if (fileName === '') {
            console.log('File name can\'t be empty.');

            return;
        }

        console.log('Creating file named "' + fileName + '".');

        application.files.createFile(fileName);
    }
});
