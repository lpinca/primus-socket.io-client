describe('util', function () {
  'use strict';

  var assume = require('assume')
    , io = require('..');

  it('parse uri', function () {
    var http = io.util.parseUri('http://google.com')
      , https = io.util.parseUri('https://www.google.com:80')
      , query = io.util.parseUri('google.com:8080/foo/bar?foo=bar');

    assume(http.protocol).equal('http');
    assume(http.port).equal('');
    assume(http.host).equal('google.com');
    assume(https.protocol).equal('https');
    assume(https.port).equal('80');
    assume(https.host).equal('www.google.com');
    assume(query.port).equal('8080');
    assume(query.query).equal('foo=bar');
    assume(query.path).equal('/foo/bar');
    assume(query.relative).equal('/foo/bar?foo=bar');
  });

  it('unique uri', function () {
    var protocol = io.util.parseUri('http://google.com')
      , noprotocol = io.util.parseUri('google.com')
      , https = io.util.parseUri('https://google.com')
      , path = io.util.parseUri('https://google.com/google.com/com/?foo=bar');


    assume(io.util.uniqueUri(protocol)).equal('http://google.com:80');
    assume(io.util.uniqueUri(noprotocol)).equal('http://google.com:80');

    assume(io.util.uniqueUri(https)).equal('https://google.com:443');
    assume(io.util.uniqueUri(path)).equal('https://google.com:443');
  });

  it('chunk query string', function () {
    assume(io.util.chunkQuery('foo=bar')).is.a('object');
    assume(io.util.chunkQuery('foo=bar').foo).equal('bar');
  });

  it('merge query strings', function () {
    var base = io.util.query('foo=bar', 'foo=baz')
      , add = io.util.query('foo=bar', 'bar=foo');

    assume(base).equal('?foo=baz');
    assume(add).equal('?foo=bar&bar=foo');

    assume(io.util.query('','')).equal('');
    assume(io.util.query('foo=bar', '')).equal('?foo=bar');
    assume(io.util.query('', 'foo=bar')).equal('?foo=bar');
  });

  it('request', function () {
    assume(io.util.request()).is.a('object');
  });

  it('is array', function () {
    assume(io.util.isArray([])).true();
    assume(io.util.isArray({})).false();
    assume(io.util.isArray('str')).false();
    assume(io.util.isArray(new Date())).false();
    assume(io.util.isArray(true)).false();
    assume(io.util.isArray(arguments)).false();
  });

  it('merge, deep merge', function () {
    var start = {
          foo: 'bar'
        , bar: 'baz'
        }
      , duplicate = {
          foo: 'foo'
        , bar: 'bar'
        }
      , extra = {
          ping: 'pong'
        }
      , deep = {
          level1:{
            foo: 'bar'
          , level2: {
              foo: 'bar'
            ,  level3:{
                foo: 'bar'
              , rescursive: deep
              }
            }
          }
        }
        // same structure, but changed names
      , deeper = {
          foo: 'bar'
        , level1:{
            foo: 'baz'
          , level2: {
              foo: 'foo'
            ,  level3:{
                foo: 'pewpew'
              , rescursive: deep
              }
            }
          }
        };

    io.util.merge(start, duplicate);

    assume(start.foo).equal('foo');
    assume(start.bar).equal('bar');

    io.util.merge(start, extra);
    assume(start.ping).equal('pong');
    assume(start.foo).equal('foo');

    io.util.merge(deep, deeper);

    assume(deep.foo).equal('bar');
    assume(deep.level1.foo).equal('baz');
    assume(deep.level1.level2.foo).equal('foo');
    assume(deep.level1.level2.level3.foo).equal('pewpew');
  });

  it('defer', function (next) {
    var now = +new Date();

    io.util.defer(function () {
      assume((+new Date() - now) >= ( io.util.webkit ? 100 : 0 )).true();
      next();
    });
  });

  it('indexOf', function () {
    var data = ['socket', 2, 3, 4, 'socket', 5, 6, 7, 'io'];
    assume(io.util.indexOf(data, 'socket', 1)).equal(4);
    assume(io.util.indexOf(data, 'socket')).equal(0);
    assume(io.util.indexOf(data, 'waffles')).equal(-1);
  });
});
