var Model = require('./model');

module.exports = Model.extend({
    'defaults': {
        'fs': undefined,
        'errorHandler': undefined,
        'isChrome': undefined
    },

    'initialize': function () {
        self = this;
        self.attributes.errorHandler = errorHandler;

        if ((/chrom(e|ium)/.test(navigator.userAgent.toLowerCase())) && (typeof window.chrome === 'object')) {
            self.attributes.isChrome = true;
        } else {
            self.attributes.isChrome = false;

            self.attributes.errorHandler({'code': 'NOT_CHROME'});

            return;
        }

        // A web app can request access to a sandboxed file system by
        // calling window.requestFileSystem() function.
        //
        // Note: The file system has been prefixed as of Google Chrome 12.
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

        window.webkitStorageInfo.requestQuota(
            PERSISTENT,
            1024 * 1024,
            function (grantedBytes) {
                window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
            },
            function (e) {
                console.log('Error', e);
            }
        );

        function errorHandler(e) {
            var msg;

            msg = '';

            switch (e.code) {
                case 'NOT_CHROME':
                    msg = 'You are not using Google\'s Chrome browser. This demo will not work properly.';
                    break;
                case FileError.QUOTA_EXCEEDED_ERR:
                    msg = 'QUOTA_EXCEEDED_ERR';
                    break;
                case FileError.NOT_FOUND_ERR:
                    msg = 'NOT_FOUND_ERR';
                    break;
                case FileError.SECURITY_ERR:
                    msg = 'SECURITY_ERR';
                    break;
                case FileError.INVALID_MODIFICATION_ERR:
                    msg = 'INVALID_MODIFICATION_ERR';
                    break;
                case FileError.INVALID_STATE_ERR:
                    msg = 'INVALID_STATE_ERR';
                    break;
                default:
                    msg = 'Unknown Error';
                    break;
            };

            console.log('Error: "' + msg + '".');
        }

        function onInitFs(newFs) {
            console.log('Opened file system: "' + newFs.name + '".');

            self.attributes.fs = newFs;
        }
    },

    'createFile': function (fileName) {
        var self;

        self = this;

        if (self.attributes.isChrome !== true) {
            self.attributes.errorHandler({'code': 'NOT_CHROME'});

            return;
        }

        self.attributes.fs.root.getFile(
            fileName,
            {
                // Indicate that we want to create a file if it was not
                // previously there.
                'create': true,

                // Cause getFile and getDirectory to fail if the target path
                // already exists.
                'exclusive': true
            },
            function (fileEntry) {
                console.log('File named "' + fileName + '" was successfully created.');
            },
            self.attributes.errorHandler
        );
    },

    'getFile': function (fileName, returnResults) {
        var self;

        self = this;

        if (self.attributes.isChrome !== true) {
            self.attributes.errorHandler({'code': 'NOT_CHROME'});

            return;
        }

        self.attributes.fs.root.getFile(
            fileName,
            {},
            function (fileEntry) {
                // Get a File object representing the file, then use FileReader
                // to read its contents.
                fileEntry.file(
                    function (file) {
                        var reader;

                        reader = new FileReader();

                        reader.onloadend = function (e) {
                            returnResults(this.result);
                        };

                        reader.readAsText(file);
                    },
                    self.attributes.errorHandler
                );
            },
            self.attributes.errorHandler
        );
    },

    'saveFile': function (fileName, fileData) {
        var self;

        self = this;

        if (self.attributes.isChrome !== true) {
            self.attributes.errorHandler({'code': 'NOT_CHROME'});

            return;
        }

        self.attributes.fs.root.getFile(
            fileName,
            {
                'create': true
            },
            function (fileEntry) {
                // Create a FileWriter object for our FileEntry.
                fileEntry.createWriter(
                    function (fileWriter) {
                        var blob;

                        fileWriter.onwriteend = function(e) {
                            console.log('Write completed.');
                        };

                        fileWriter.onerror = function (e) {
                            console.log('Write failed: ' + e.toString());
                        };

                        // Create a new Blob and write it to log.txt.
                        blob = new Blob(
                            [fileData],
                            {
                                'type': 'text/plain'
                            }
                        );

                        fileWriter.write(blob);
                    },
                    self.attributes.errorHandler
                );
            },
            self.attributes.errorHandler
        );
    }
});
