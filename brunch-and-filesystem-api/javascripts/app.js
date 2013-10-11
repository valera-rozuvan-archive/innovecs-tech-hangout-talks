(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    definition(module.exports, localRequire(name), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var require = function(name) {
    var path = expand(name, '.');

    if (has(cache, path)) return cache[path];
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex];
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '"');
  };

  var define = function(bundle) {
    for (var key in bundle) {
      if (has(bundle, key)) {
        modules[key] = bundle[key];
      }
    }
  }

  globals.require = require;
  globals.require.define = define;
  globals.require.brunch = true;
})();

window.require.define({"application": function(exports, require, module) {
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
  
}});

window.require.define({"initialize": function(exports, require, module) {
  var application;

  application = require('application');

  $(function () {
      application.initialize();
      Backbone.history.start();
  });
  
}});

window.require.define({"lib/router": function(exports, require, module) {
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
  
}});

window.require.define({"lib/view_helper": function(exports, require, module) {
  // Put your handlebars.js helpers here.
  
}});

window.require.define({"models/collection": function(exports, require, module) {
  // Base class for all collections.
  module.exports = Backbone.Collection.extend({
    
  });
  
}});

window.require.define({"models/files": function(exports, require, module) {
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
  
}});

window.require.define({"models/model": function(exports, require, module) {
  // Base class for all models.
  module.exports = Backbone.Model.extend({
    
  });
  
}});

window.require.define({"views/home_view": function(exports, require, module) {
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
  
}});

window.require.define({"views/new_file_view": function(exports, require, module) {
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
  
}});

window.require.define({"views/templates/home": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "<div id=\"content\">\n    <h1>brunch</h1>\n    <h2>Brunch example: File System API</h2>\n    <ul>\n        <li class=\"goto\" data-goto=\"new_file-view\">Try it out</li>\n        <li class=\"goto\" data-goto=\"get-source\">Get the source</li>\n        <li class=\"goto\" data-goto=\"instructions\">Read the instructions</li>\n        <li class=\"goto\" data-goto=\"links\">Visit places</li>\n    </ul>\n\n    <div id=\"get-source\">\n        <h2>Source</h2>\n        <ul>\n            <li>Get the source from <a href=\"https://github.com/valera-rozuvan/Tech-Hangout/tree/master/brunch-and-filesystem-api/\">GitHub repository</a>.</li>\n        </ul>\n    </div>\n    <div id=\"instructions\">\n        <h2>Instructions</h2>\n        <ul>\n            <li>For now (November 29, 2012), only Chrome supports File System API.</li>\n            <li>If you are testing this locally, make sure you are running chrome with the --allow-file-access-from-files option specified.</li>\n            <li>Check JavaScript Console (Ctrl + Shift + j) for debug information output.</li>\n            <li>Use the first text box to create a new file (input a name, and press \"New file\").</li>\n            <li>Use the second text box to load a file's contents into the textarea (input a file name, and press \"View file\").</li>\n            <li>After loading a file, you can modify it's contents in the textarea, and save it (press \"Save file\").</li>\n        </ul>\n    </div>\n    <div id=\"links\">\n        <h2>Links</h2>\n        <ul>\n            <li>This site has been assembled with <a href=\"http://brunch.io/\">Brunch</a>.</li>\n            <li>Official <a href=\"http://dev.w3.org/2009/dap/file-system/pub/FileSystem/\">File System API</a> reference is a must read.</li>\n            <li>A good tutorial: <a href=\"http://www.html5rocks.com/en/tutorials/file/filesystem/\">Exploring the FileSystem APIs</a>.</li>\n        </ul>\n    </div>\n\n    <h2>Try it out</h2>\n</div>\n";});
}});

window.require.define({"views/templates/new_file": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "<input placeholder=\"file name\" type=\"text\" class=\"file_name\" /> <button class=\"new_file\" type=\"button\">New file</button>\n<br />\n<br />\n";});
}});

window.require.define({"views/templates/view_file": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "<input placeholder=\"file name\" type=\"text\" class=\"file_name\" /> <button class=\"view_file\" type=\"button\">View file</button>\n<br />\n<textarea placeholder=\"file contents\" cols=\"40\" rows=\"5\" class=\"file_contents\"></textarea>\n<br />\n<button type=\"button\" class=\"save_file\">Save file</button>\n";});
}});

window.require.define({"views/view": function(exports, require, module) {
  require('lib/view_helper');

  // Base class for all views.
  module.exports = Backbone.View.extend({
      'initialize': function () {
          this.render = _.bind(this.render, this);
      },

      'template': function () {},
      'getRenderData': function () {},

      'render': function() {
          this.$el.html(this.template(this.getRenderData()));
          this.afterRender();
          return this;
      },

      'afterRender': function () {}
  });
  
}});

window.require.define({"views/view_file_view": function(exports, require, module) {
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
  
}});

