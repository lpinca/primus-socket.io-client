describe('events', function () {
  'use strict';

  var assume = require('assume')
    , io = require('..');

  it('add listeners', function () {
    var event = new io.EventEmitter()
      , calls = 0;

    event.on('test', function (a, b) {
      ++calls;
      assume(a).equal('a');
      assume(b).equal('b');
    });

    event.emit('test', 'a', 'b');
    assume(calls).equal(1);
    assume(event.on).equal(event.addListener);
  });

  it('remove listener', function () {
    var event = new io.EventEmitter();
    function empty () { }

    event.on('test', empty);
    event.on('test:more', empty);
    event.removeAllListeners('test');

    assume(event.listeners('test')).eql([]);
    assume(event.listeners('test:more')).eql([empty]);
  });

  it('remove all listeners with no arguments', function () {
    var event = new io.EventEmitter();
    function empty () { }

    event.on('test', empty);
    event.on('test:more', empty);
    event.removeAllListeners();

    assume(event.listeners('test')).eql([]);
    assume(event.listeners('test:more')).eql([]);
  });

  it('remove listeners functions', function () {
    var event = new io.EventEmitter()
      , calls = 0;

    function one () { ++calls; }
    function two () { ++calls; }
    function three () { ++calls; }

    event.on('one', one);
    event.removeListener('one', one);
    assume(event.listeners('one')).eql([]);

    event.on('two', two);
    event.removeListener('two', one);
    assume(event.listeners('two')).eql([two]);

    event.on('three', three);
    event.on('three', two);
    event.removeListener('three', three);
    assume(event.listeners('three')).eql([two]);
  });

  it('number of arguments', function () {
    var event = new io.EventEmitter()
      , number = [];

    event.on('test', function () {
      number.push(arguments.length);
    });

    event.emit('test');
    event.emit('test', null);
    event.emit('test', null, null);
    event.emit('test', null, null, null);
    event.emit('test', null, null, null, null);
    event.emit('test', null, null, null, null, null);

    assume([0, 1, 2, 3, 4, 5]).eql(number);
  });

  it('once', function () {
    var event = new io.EventEmitter()
      , calls = 0;

    event.once('test', function () {
      ++calls;
    });

    event.emit('test', 'a', 'b');
    event.emit('test', 'a', 'b');
    event.emit('test', 'a', 'b');

    function removed () {
      throw new Error('not removed');
    }

    event.once('test:removed', removed);
    event.removeListener('test:removed', removed);
    event.emit('test:removed');

    assume(calls).equal(1);
  });
});
