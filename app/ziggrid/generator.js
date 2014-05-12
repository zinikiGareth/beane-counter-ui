import flags from 'appkit/flags';
import zinc from 'zinc';

function Generator(mgr, addr, callback) {
  var self = this;
  zinc.newRequestor(addr).then(function(req) {
    self.requestor = req;
  });
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

    this.requestor.invoke("generator/start").send();
  },

  stop: function() {
    this.requestor.invoke("generator/stop").send();
  },

  setDelay: function(ms) {
    this.requestor.invoke("generator/setDelay").setOption("delay", ms).send();
  }
};

Generator.create = function(mgr, url, callback) {
  return new Generator(mgr, url, callback);
};

export default Generator;

