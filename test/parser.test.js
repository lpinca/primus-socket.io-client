describe('parser', function () {
  'use strict';

  var assume = require('assume')
    , io = require('..')
    , parser = io.parser;

  it('decoding error packet', function () {
    assume(parser.decodePacket('7:::')).eql({
        type: 'error'
      , reason: ''
      , advice: ''
      , endpoint: ''
    });
  });

  it('decoding error packet with reason', function () {
    assume(parser.decodePacket('7:::0')).eql({
        type: 'error'
      , reason: 'transport not supported'
      , advice: ''
      , endpoint: ''
    });
  });

  it('decoding error packet with reason and advice', function () {
    assume(parser.decodePacket('7:::2+0')).eql({
        type: 'error'
      , reason: 'unauthorized'
      , advice: 'reconnect'
      , endpoint: ''
    });
  });

  it('decoding error packet with endpoint', function () {
    assume(parser.decodePacket('7::/woot')).eql({
        type: 'error'
      , reason: ''
      , advice: ''
      , endpoint: '/woot'
    });
  });

  it('decoding ack packet', function () {
    assume(parser.decodePacket('6:::140')).eql({
        type: 'ack'
      , ackId: '140'
      , endpoint: ''
      , args: []
    });
  });

  it('decoding ack packet with args', function () {
    assume(parser.decodePacket('6:::12+["woot","wa"]')).eql({
        type: 'ack'
      , ackId: '12'
      , endpoint: ''
      , args: ['woot', 'wa']
    });
  });

  it('decoding ack packet with bad json', function () {
    var thrown = false;

    try {
      assume(parser.decodePacket('6:::1+{"++]')).eql({
          type: 'ack'
        , ackId: '1'
        , endpoint: ''
        , args: []
      });
    } catch (e) {
      thrown = true;
    }

    assume(thrown).false();
  });

  it('decoding json packet', function () {
    assume(parser.decodePacket('4:::"2"')).eql({
        type: 'json'
      , endpoint: ''
      , data: '2'
    });
  });

  it('decoding json packet with message id and ack data', function () {
    assume(parser.decodePacket('4:1+::{"a":"b"}')).eql({
        type: 'json'
      , id: '1'
      , ack: 'data'
      , endpoint: ''
      , data: { a: 'b' }
    });
  });

  it('decoding an event packet', function () {
    assume(parser.decodePacket('5:::{"name":"woot"}')).eql({
        type: 'event'
      , name: 'woot'
      , endpoint: ''
      , args: []
    });
  });

  it('decoding an event packet with message id and ack', function () {
    assume(parser.decodePacket('5:1+::{"name":"tobi"}')).eql({
        type: 'event'
      , id: '1'
      , ack: 'data'
      , endpoint: ''
      , name: 'tobi'
      , args: []
    });
  });

  it('decoding an event packet with data', function () {
    assume(parser.decodePacket('5:::{"name":"edwald","args":[{"a": "b"},2,"3"]}'))
    .eql({
        type: 'event'
      , name: 'edwald'
      , endpoint: ''
      , args: [{a: 'b'}, 2, '3']
    });
  });

  it('decoding a message packet', function () {
    assume(parser.decodePacket('3:::woot')).eql({
        type: 'message'
      , endpoint: ''
      , data: 'woot'
    });
  });

  it('decoding a message packet with id and endpoint', function () {
    assume(parser.decodePacket('3:5:/tobi')).eql({
        type: 'message'
      , id: '5'
      , ack: true
      , endpoint: '/tobi'
      , data: ''
    });
  });

  it('decoding a heartbeat packet', function () {
    assume(parser.decodePacket('2:::')).eql({
        type: 'heartbeat'
      , endpoint: ''
    });
  });

  it('decoding a connection packet', function () {
    assume(parser.decodePacket('1::/tobi')).eql({
        type: 'connect'
      , endpoint: '/tobi'
      , qs: ''
    });
  });

  it('decoding a connection packet with query string', function () {
    assume(parser.decodePacket('1::/test:?test=1')).eql({
        type: 'connect'
      , endpoint: '/test'
      , qs: '?test=1'
    });
  });

  it('decoding a disconnection packet', function () {
    assume(parser.decodePacket('0::/woot')).eql({
        type: 'disconnect'
      , endpoint: '/woot'
    });
  });

  it('encoding error packet', function () {
    assume(parser.encodePacket({
        type: 'error'
      , reason: ''
      , advice: ''
      , endpoint: ''
    })).equal('7::');
  });

  it('encoding error packet with reason', function () {
    assume(parser.encodePacket({
        type: 'error'
      , reason: 'transport not supported'
      , advice: ''
      , endpoint: ''
    })).equal('7:::0');
  });

  it('encoding error packet with reason and advice', function () {
    assume(parser.encodePacket({
        type: 'error'
      , reason: 'unauthorized'
      , advice: 'reconnect'
      , endpoint: ''
    })).equal('7:::2+0');
  });

  it('encoding error packet with endpoint', function () {
    assume(parser.encodePacket({
        type: 'error'
      , reason: ''
      , advice: ''
      , endpoint: '/woot'
    })).equal('7::/woot');
  });

  it('encoding ack packet', function () {
    assume(parser.encodePacket({
        type: 'ack'
      , ackId: '140'
      , endpoint: ''
      , args: []
    })).equal('6:::140');
  });

  it('encoding ack packet with args', function () {
    assume(parser.encodePacket({
        type: 'ack'
      , ackId: '12'
      , endpoint: ''
      , args: ['woot', 'wa']
    })).equal('6:::12+["woot","wa"]');
  });

  it('encoding json packet', function () {
    assume(parser.encodePacket({
        type: 'json'
      , endpoint: ''
      , data: '2'
    })).equal('4:::"2"');
  });

  it('encoding json packet with message id and ack data', function () {
    assume(parser.encodePacket({
        type: 'json'
      , id: 1
      , ack: 'data'
      , endpoint: ''
      , data: { a: 'b' }
    })).equal('4:1+::{"a":"b"}');
  });

  it('encoding an event packet', function () {
    assume(parser.encodePacket({
        type: 'event'
      , name: 'woot'
      , endpoint: ''
      , args: []
    })).equal('5:::{"name":"woot"}');
  });

  it('encoding an event packet with message id and ack', function () {
    assume(parser.encodePacket({
        type: 'event'
      , id: 1
      , ack: 'data'
      , endpoint: ''
      , name: 'tobi'
      , args: []
    })).equal('5:1+::{"name":"tobi"}');
  });

  it('encoding an event packet with data', function () {
    assume(parser.encodePacket({
        type: 'event'
      , name: 'edwald'
      , endpoint: ''
      , args: [{a: 'b'}, 2, '3']
    })).equal('5:::{"name":"edwald","args":[{"a":"b"},2,"3"]}');
  });

  it('encoding a message packet', function () {
    assume(parser.encodePacket({
        type: 'message'
      , endpoint: ''
      , data: 'woot'
    })).equal('3:::woot');
  });

  it('encoding a message packet with id and endpoint', function () {
    assume(parser.encodePacket({
        type: 'message'
      , id: 5
      , ack: true
      , endpoint: '/tobi'
      , data: ''
    })).equal('3:5:/tobi');
  });

  it('encoding a heartbeat packet', function () {
    assume(parser.encodePacket({
        type: 'heartbeat'
      , endpoint: ''
    })).equal('2::');
  });

  it('encoding a connection packet', function () {
    assume(parser.encodePacket({
        type: 'connect'
      , endpoint: '/tobi'
      , qs: ''
    })).equal('1::/tobi');
  });

  it('encoding a connection packet with query string', function () {
    assume(parser.encodePacket({
        type: 'connect'
      , endpoint: '/test'
      , qs: '?test=1'
    })).equal('1::/test:?test=1');
  });

  it('encoding a disconnection packet', function () {
    assume(parser.encodePacket({
        type: 'disconnect'
      , endpoint: '/woot'
    })).equal('0::/woot');
  });

  it('test decoding a payload', function () {
    assume(parser.decodePayload('\ufffd5\ufffd3:::5\ufffd7\ufffd3:::53d'
      + '\ufffd3\ufffd0::')).eql([
        { type: 'message', data: '5', endpoint: '' }
      , { type: 'message', data: '53d', endpoint: '' }
      , { type: 'disconnect', endpoint: '' }
    ]);
  });

  it('test encoding a payload', function () {
    assume(parser.encodePayload([
        parser.encodePacket({ type: 'message', data: '5', endpoint: '' })
      , parser.encodePacket({ type: 'message', data: '53d', endpoint: '' })
    ])).equal('\ufffd5\ufffd3:::5\ufffd7\ufffd3:::53d');
  });

  it('test decoding newline', function () {
    assume(parser.decodePacket('3:::\n')).eql({
        type: 'message'
      , endpoint: ''
      , data: '\n'
    });
  });
});
