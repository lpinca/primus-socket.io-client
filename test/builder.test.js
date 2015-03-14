describe('builder', function () {
  'use strict';

  var builder = require('../bin/builder')
    , common = require('./builder.common')
    , assume = require('assume');

  it('version number', function () {
    assume(builder.version).match(/([0-9]+)\.([0-9]+)\.([0-9]+)/);
    assume(builder.version).equal(require('../lib/io').version);
  });

  it('production build LOC', function () {
    builder(function (err, result) {
      assume(err).equal(null);

      var lines = result.split('\n');
      assume(lines.length).be.below(5);
      assume(lines[0]).match(/production/gi);
      assume(Buffer.byteLength(result)).be.below(43000);
    });
  });

  it('development build LOC', function () {
    builder({ minify: false }, function (err, result) {
      assume(err).equal(null);

      var lines = result.split('\n');
      assume(lines.length).be.above(5);
      assume(lines[0]).match(/development/gi);
      assume(Buffer.byteLength(result)).be.above(35000);
    });
  });

  it('default builds', function () {
    builder(function (err, result) {
      assume(err).equal(null);

      var io = common.execute(result).io
        , transports = Object.keys(io.Transport)
        , defaults = Object.keys(builder.transports);

      /* XHR transport is private, but still available */
      assume(transports.length).be.equal(defaults.length + 1);

      defaults.forEach(function (transport) {
        assume(transports.indexOf(transport)).be.above(-1);
      });
    });
  });

  it('custom build', function () {
    builder(['websocket'], function (err, result) {
      assume(err).equal(null);

      var io = common.execute(result).io
        , transports = Object.keys(io.Transport);

      assume(transports).have.length(1);
      assume(transports[0]).eql('websocket');
    });
  });

  it('custom code', function () {
    var custom = 'var hello = "world";';
    builder({ custom: [custom], minify: false }, function (err, result) {
      assume(err).equal(null);

      assume(result).include.string(custom);
    });
  });

  it('node if', function () {
    var custom = '// if node \nvar hello = "world";\n'
      + '// end node\nvar pew = "pew";';

    builder({ custom: [custom], minify: false }, function (err, result) {
      assume(err).equal(null);

      assume(result).not.include.string(custom);
      assume(result).not.include.string('// if node');
      assume(result).not.include.string('// end node');
      assume(result).not.include.string('"world"');

      assume(result).include.string('var pew = "pew"');
    });
  });

  it('preserve the encoding during minification', function () {
    builder(function (err, result) {
      assume(err).equal(null);

      assume(result).match(/(\\ufffd)/g);
    });
  });

  it('globals', function () {
    builder(function (err, result) {
      assume(err).equal(null);

      var io = common.execute(result)
        , env = common.env()
        , allowed = ['io', 'swfobject', 'WEB_SOCKET_DISABLE_AUTO_INITIALIZATION'];

      Array.prototype.push.apply(allowed, Object.keys(env));

      Object.keys(io).forEach(function (global) {
        var index = allowed.indexOf(global);

        // the global is not allowed!
        if (!~index) {
          throw new Error('Global leak: ' + global);
        }
      });
    });
  });
});
