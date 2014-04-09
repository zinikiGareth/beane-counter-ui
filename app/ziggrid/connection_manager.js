import Generator from 'appkit/ziggrid/generator';
import Observer from 'appkit/ziggrid/observer';
import demux from 'appkit/ziggrid/demux';
import watcher from 'appkit/ziggrid/watcher';
import flags from 'appkit/flags';

var ConnectionManager = Ember.Object.extend({
  url: null,

  // Reference to the global app namespace where we'll be installing
  // dynamically generated DS.Model classes
  namespace: null,

  establishConnection: function() {

    var self = this;

    this.generators = {};
    this.observers = {};

    var messages = [];

    var conn = this.conn = jQuery.atmosphere.subscribe({
      url: this.url + 'connmgr',
      transport: 'websocket',
      fallbackTransport: 'long-polling',

      // handle the 'open' message
      onOpen: function(response) {
        conn.push(JSON.stringify({ action: 'models' }));
        conn.push(JSON.stringify({ action: 'servers' }));
      },

      // and then handle each incoming message
      onMessage: function(msg) {
        // Have to clone because jQuery atmosphere reuses response objects.
        messages.push({
          status: msg.status,
          responseBody: msg.responseBody
        });
        Ember.run.throttle(self, 'flushMessages', messages, 150);
      },
      
      onReconnect: function(request, response) {
        conn.push(JSON.stringify({ action: 'models' }));
        conn.push(JSON.stringify({ action: 'servers' }));
      }
    });
  }.on('init'),

  flushMessages: function(messages) {
    while (messages.length) {
      var message = messages.shift();
      this.handleMessage(message);
    }
  },

  handleMessage: function(msg) {
    if (msg.status === 200) {

      if (flags.LOG_WEBSOCKETS) {
        console.log('Received message ' + msg.responseBody);
      }

      var body = JSON.parse(msg.responseBody);

      if (body['error']) {
        console.error(body['error']);
      } else if (body['modelName']) {
        this.registerModel(body.modelName, body.model);
      } else if (body['server']) {
        var endpoint = body.endpoint,
        addr = 'http://' + endpoint + '/ziggrid/',
        server = body.server;

        if (flags.LOG_WEBSOCKETS) {
          console.log('Have new ' + server + ' server at ' + endpoint);
        }
          console.log('Have new ' + server + ' server at ' + endpoint);
        this.registerServer(server, addr);

      } else if (body['status']) {
        var stat = body['status'];
        if (stat === 'modelsSent') {
          this.modelsRead();
        } else {
          console.log('Do not recognize ' + stat);
        }
      } else
        console.log('could not understand ' + msg.responseBody);
    } else {
      console.log('HTTP Error:', msg.status);
      //if (callback && callback.error)
      //callback.error('HTTP Error: ' + msg.status);
    }
  },

  registerModel: function(name, model) {
    var attrs = {};
    for (var p in model) {
      if (!model.hasOwnProperty(p)) { continue; }

      var type = model[p];
      if (type.rel === 'attr') {
        attrs[p] = DS.attr(type.name);
      } else if (type.rel === 'hasMany') {
        attrs[p] = DS.hasMany('App.' + type.name.capitalize());
      } else {
        console.log('Unknown type:', type);
      }
    }

    var newClass = DS.Model.extend(attrs);
    newClass.reopenClass({
      model: model
    });

    this.namespace[name] = newClass;
  },

  registerServer: function(server, addr) {
    var self = this;
    if (server === 'generator') {
      if (!this.generators[addr]) {
        this.generators[addr] = Generator.create(this, addr, function(gen, newConn) {
          var player = self.container.lookup('bean-player:main');
          if (player.get('isPlaying')) {
            gen.start();
          } else {
            gen.stop();
          }
        });
      }
    } else if (server === 'ziggrid') {
      if (!this.observers[addr]) {
        var obsr = this.observers[addr] = Observer.create(this, addr, function(newConn) {
          self.observers[addr] = newConn;
          var watcher = self.container.lookup('watcher:main');
          watcher.newObserver(addr, newConn); 
        });
      }
    }
  },
  
  deregisterGenerator: function(addr) {
    console.log("Removing ", addr, " from generators: ", this.generators);
    delete this.generators[addr];
    console.log("Remaining generators: ", this.generators);
  },

  deregisterObserver: function(addr) {
    console.log("Removing ", addr, " from observers: ", this.observers);
    var watcher = this.container.lookup('watcher:main');
    watcher.deadObserver(addr); 
    delete this.observers[addr];
    console.log("Remaining observers: ", this.observers);
  },

  modelsRead: function() {
    window.App.advanceReadiness();
  }
});

export default ConnectionManager;
