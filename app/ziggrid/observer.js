import flags from 'appkit/flags';
import zinc from 'zinc';

function Observer(mgr, addr, callback) {
  var url = addr + 'ziggrid';

  if (flags.LOG_WEBSOCKETS) {
    console.log('Observer connecting at ' + url);
  }

  var self = this;
  zinc.newRequestor(url).then(function(req) {
    self.requestor = req;
    callback(req);
  });
}

Observer.create = function(mgr, url, callback) {
  return new Observer(mgr, url, callback);
};

export default Observer;
