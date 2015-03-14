describe('io', function () {
  'use strict';

  var assume = require('assume')
    , io = require('..');

  it('client version number', function () {
      assume(io.version).match(/([0-9]+)\.([0-9]+)\.([0-9]+)/);
  });

  it('socket.io protocol version', function () {
    assume(io.protocol).is.a('number');
    assume(io.protocol.toString()).match(/^\d+$/);
  });

  it('socket.io available transports', function () {
    assume(io.transports.length > 0).true();
  });
});
