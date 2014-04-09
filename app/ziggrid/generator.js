import flags from 'appkit/flags';

function Generator(mgr, addr, callback) {
  var self = this;
  var open = {
    url: addr + 'generator',
    transport: 'websocket',
    fallbackTransport: 'long-polling',

    onOpen: function(response) {
      if (flags.LOG_WEBSOCKETS) {
        console.log('opened generator connection with response', response);
      }
      callback(self, conn);
    },

    // and then handle each incoming message
    onMessage: function(msg) {
      if (msg.status === 200) {
        if (flags.LOG_WEBSOCKETS) {
          console.log(msg.responseBody);
        }
        var body = JSON.parse(msg.responseBody);
      } else {
        console.log('Generator HTTP Error:', msg.status);
      }
    },
     
    onClose: function() {
      if (conn != null) {
        mgr.deregisterGenerator(addr);
        var myConn = conn;
        conn = null;
        myConn.close();
      }
    }
  };

  var conn = this.conn = jQuery.atmosphere.subscribe(open);
}

Generator.prototype = {

  hasSetDelay: false,

  send: function(msg) {
    if (flags.LOG_WEBSOCKETS) {
      console.log('Sending generator message', msg);
    }
    this.conn.push(msg);
  },

  start: function() {
    if (!this.hasSetDelay) {
      // Don't overload the generator; give it a moderate delay the first time.
      // This is only needed if the system can't keep up; don't use it everywhere
      // this.setDelay(20);
      this.hasSetDelay = true;
    }

    this.send(JSON.stringify({'action':'start'}));
  },

  stop: function() {
    this.send(JSON.stringify({'action':'stop'}));
  },

  setDelay: function(ms) {
    this.send(JSON.stringify({'action':'delay','size':ms}));
  }
};

Generator.create = function(mgr, url, callback) {
  return new Generator(mgr, url, callback);
};

export default Generator;

