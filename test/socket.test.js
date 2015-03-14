describe('socket', function () {
  'use strict';

  var assume = require('assume')
    , sio = require('socket.io')
    , http = require('http')
    , ioc = require('..')
    , port = 1024
    , server
    , io;

  beforeEach(function (next) {
    server = http.createServer();
    io = new sio.Manager(server, {
      log: false
    });
    server.listen(++port, next);
  });

  afterEach(function (next) {
    server.close(next);
  });

  it('test connecting the socket and disconnecting', function (next) {
    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('connect', function () {
      socket.disconnect();
      next();
    });
  });

  it('test receiving messages', function (next) {
    io.sockets.on('connection', function (socket) {
      var messages = 0;
      var interval = setInterval(function () {
        socket.send(++messages);

        if (messages === 3) {
          clearInterval(interval);
          setTimeout(function () {
            socket.disconnect();
          }, 500);
        }
      }, 50);
    });

    var socket = ioc.connect('http://localhost:'+ port)
      , connected = false
      , messages = 0;

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('connect', function () {
      connected = true;
    });

    socket.on('message', function (i) {
      assume(String(++messages)).equal(i);
    });

    socket.on('disconnect', function (reason) {
      assume(connected).true();
      assume(messages).equal(3);
      assume(reason).equal('booted');
      next();
    });
  });

  it('test sending messages', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.on('message', function (msg) {
        socket.send(msg);
      });
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('connect', function () {
      socket.send('echo');

      socket.on('message', function (msg) {
        assume(msg).equal('echo');
        socket.disconnect();
        next();
      });
    });
  });

  it('test manual buffer flushing', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.on('message', function (msg) {
        socket.send(msg);
      });
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.socket.options.manualFlush = true;

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('connect', function () {
      socket.socket.connected = false;
      socket.send('buffered');
      socket.socket.onConnect();
      socket.socket.flushBuffer();

      socket.on('message', function (msg) {
        assume(msg).equal('buffered');
        socket.disconnect();
        next();
      });
    });
  });

  it('test automatic buffer flushing', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.on('message', function (msg) {
        socket.send(msg);
      });
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('connect', function () {
      socket.socket.connected = false;
      socket.send('buffered');
      socket.socket.onConnect();

      socket.on('message', function (msg) {
        assume(msg).equal('buffered');
        socket.disconnect();
        next();
      });
    });
  });

  it('test acks sent from client', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.send('tobi', function () {
        socket.send('tobi 2');
      });
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('connect', function () {
      socket.on('message', function (msg) {
        if ('tobi 2' === msg) {
          socket.disconnect();
          next();
        }
      });
    });
  });

  it('test acks sent from server', function (next) {
    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('connect', function () {
      socket.send('ooo', function () {
        socket.disconnect();
        next();
      });
    });
  });

  it('test connecting to namespaces', function (next) {
    io.of('/woot').on('connection', function (socket) {
      socket.send('connected to woot');
    });

    io.of('/chat').on('connection', function (socket) {
      socket.send('connected to chat');
    });

    var socket = ioc.connect('http://localhost:'+ port).socket
      , namespaces = 2
      , connect = 0;

    function finish () {
      socket.of('').disconnect();
      assume(connect).equal(3);
      next();
    }

    socket.on('connect', function(){
      connect++;
    });

    socket.of('/woot').on('connect', function () {
      connect++;
    }).on('message', function (msg) {
      assume(msg).equal('connected to woot');
      return --namespaces || finish();
    }).on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.of('/chat').on('connect', function () {
      connect++;
    }).on('message', function (msg) {
      assume(msg).equal('connected to chat');
      return --namespaces || finish();
    }).on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });
  });

  it('test disconnecting from namespaces', function (next) {
    io.of('/a').on('connection', function () {});
    io.of('/b').on('connection', function () {});

    var socket = ioc.connect('http://localhost:'+ port).socket
      , namespaces = 2;

    function finish () {
      socket.of('').disconnect();
      next();
    }

    socket.of('/a').on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.of('/a').on('connect', function () {
      socket.of('/a').disconnect();
    });

    socket.of('/a').on('disconnect', function () {
      return --namespaces || finish();
    });

    socket.of('/b').on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.of('/b').on('connect', function () {
      socket.of('/b').disconnect();
    });

    socket.of('/b').on('disconnect', function () {
      return --namespaces || finish();
    });
  });

  it('test authorizing for namespaces', function (next) {
    io.of('/a')
      .authorization(function (data, fn) {
        fn(null, false);
      })
      .on('connection', function () {});

    var socket = ioc.connect('http://localhost:'+ port).socket;

    function finish () {
      socket.of('').disconnect();
      next();
    }

    socket.of('/a')
      .on('connect_failed', function () {
        finish();
      })
      .on('error', function (msg) {
        throw new Error(msg || 'Received an error');
      });
  });

  it('test sending json from server', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.json.send(3141592);
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('message', function (msg) {
      assume(msg).equal(3141592);
      socket.disconnect();
      next();
    });
  });

  it('test sending json from client', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.on('message', function (arr) {
        if (Array.isArray(arr) && arr.length === 3) {
          socket.send('echo');
        }
      });
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.json.send([1, 2, 3]);
    socket.on('message', function (msg) {
      assume(msg).equal('echo');
      socket.disconnect();
      next();
    });
  });

  it('test emitting an event from server', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.emit('woot');
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('woot', function () {
      socket.disconnect();
      next();
    });
  });

  it('test emitting an event to server', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.on('woot', function () {
        socket.emit('echo');
      });
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.emit('woot');
    socket.on('echo', function () {
      socket.disconnect();
      next();
    });
  });

  it('test emitting multiple events at once to the server', function (next) {
    io.sockets.on('connection', function (socket) {
      var messages = [];

      socket.on('print', function (msg) {
        if (messages.indexOf(msg) >= 0) {
          console.error('duplicate message');
        }

        messages.push(msg);
        if (messages.length === 2) {
          socket.emit('done');
        }
      });
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('connect', function () {
      socket.emit('print', 'foo');
      socket.emit('print', 'bar');
    });

    socket.on('done', function () {
      socket.disconnect();
      next();
    });
  });

  it('test emitting an event from server and sending back data', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.emit('woot', 1, function (a) {
        if (a === 'test') {
          socket.emit('done');
        }
      });
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('woot', function (a, fn) {
      assume(a).equal(1);
      fn('test');

      socket.on('done', function () {
        socket.disconnect();
        next();
      });
    });
  });

  it('test emitting an event to server and sending back data', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.on('tobi', function (a, b, fn) {
        if (a === 1 && b === 2) {
          fn({ hello: 'world' });
        }
      });
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.emit('tobi', 1, 2, function (a) {
      assume(a).eql({ hello: 'world' });
      socket.disconnect();
      next();
    });
  });

  it('test encoding a payload', function (next) {
    io.of('/woot').on('connection', function (socket) {
      var count = 0;

      socket.on('message', function (a) {
        if (a === 'ñ') {
          if (++count === 4) {
            socket.emit('done');
          }
        }
      });
    });

    var socket = ioc.connect('http://localhost:'+ port +'/woot');

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('connect', function () {
      socket.socket.setBuffer(true);
      socket.send('ñ');
      socket.send('ñ');
      socket.send('ñ');
      socket.send('ñ');
      socket.socket.setBuffer(false);
    });

    socket.on('done', function () {
      socket.of('').disconnect();
      next();
    });
  });

  it('test sending query strings to the server', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.json.send(socket.handshake);
    });

    var socket = ioc.connect('http://localhost:'+ port +'?foo=bar');

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.on('message', function (data) {
      assume(data.query.foo).equal('bar');

      socket.disconnect();
      next();
    });
  });

  it('test sending newline', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.on('message', function (msg) {
        if (msg === '\n') {
          socket.emit('done');
        }
      });
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.send('\n');

    socket.on('done', function () {
      socket.disconnect();
      next();
    });
  });

  it('test sending unicode', function (next) {
    io.sockets.on('connection', function (socket) {
      socket.on('message', function (msg) {
        if (msg.test === '☃') {
          socket.emit('done');
        }
      });
    });

    var socket = ioc.connect('http://localhost:'+ port);

    socket.on('error', function (msg) {
      throw new Error(msg || 'Received an error');
    });

    socket.json.send({ test: '☃' });

    socket.on('done', function () {
      socket.disconnect();
      next();
    });
  });
});
