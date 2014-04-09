import demux from 'appkit/ziggrid/demux';
import flags from 'appkit/flags';

function Observer(mgr, addr, callback) {

  var url = addr + 'observer';

  if (flags.LOG_WEBSOCKETS) {
    console.log('Observer connecting at ' + url);
  }

  var open = {
    url: url,

    transport: 'websocket',
    fallbackTransport: 'long-polling',

    onOpen: function(response) {
      if (flags.LOG_WEBSOCKETS) {
        console.log('opened observer connection with response', response);
      }
      callback(conn);
    },

    onMessage: function(msg) {
      if (msg.status === 200) {
        if (flags.LOG_WEBSOCKETS) {
          console.log('Received message ' + msg.responseBody);
        }
        var body = JSON.parse(msg.responseBody);
        if (body['deliveryFor']) {
          var h = demux[body['deliveryFor']];
          if (h && h.update)
            h.update(body['payload']);
        } else if (body['error']) {
          console.error("Server Error: ", body['error']);
        } else {
          console.error('unknown message type', body);
        }
      } else {
        console.error('HTTP error');
      }
    },
    
    onClose: function() {
      if (conn != null) {
        mgr.deregisterObserver(addr);
        var myConn = conn;
        conn = null;
        myConn.close();
      }
    }
  };
  var conn = this.conn = jQuery.atmosphere.subscribe(open);
}

Observer.create = function(mgr, url, callback) {
  return new Observer(mgr, url, callback);
};

export default Observer;
