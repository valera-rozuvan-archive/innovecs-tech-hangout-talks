var View, template, application;

View = require('./view');
template = require('./templates/view_file');
application = require('application');

module.exports = View.extend({
    'id': 'view_file-view',

    'template': template,

    'events': {
        'click .view_file': 'viewFile',
        'click .save_file': 'saveFile'
    },

    'viewFile': function () {
        var self, fileName;

        self = this;
        fileName = $(this.el).find('.file_name').val();

        console.log('Trying to read file named "' + fileName + '"');

        application.files.getFile(fileName, getResults);

        $(self.el).find('.file_contents').val('');

        function getResults(results) {
            console.log('We got the requested file. Will output to textarea.');

            $(self.el).find('.file_contents').val(results);
        }
    },

    'saveFile': function () {
        var fileName, fileData;

        fileName = $(this.el).find('.file_name').val();
        fileData = $(this.el).find('.file_contents').val();

        application.files.saveFile(fileName, fileData);
    }
});
