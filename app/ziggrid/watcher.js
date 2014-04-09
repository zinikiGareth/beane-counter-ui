import demux from 'appkit/ziggrid/demux';
import flags from 'appkit/flags';

var container;

function Loader(type, entryType, id) {
  var store = container.lookup('store:main');

  this.update = type === entryType ? updateIndividualThing : updateTabularData;

  function updateTabularData(body) {
    var table = body['table'];
    var rows = [];

    for (var i = 0; i < table.length; i++) {
      var item = table[i];

      var attrs = {};
      attrs[Ember.keys(entryType.model)[0]] = item[0];

      store.load(entryType, item[1], attrs);
      rows.push(item[1]);
    }

    store.load(type, id, {
      table: rows
    });
  }

  function updateIndividualThing(body) {
    body.handle_id = id;
    store.load(type, id, body);
  }
}

function Watcher(_namespace) {
  this.namespace = _namespace;
  container = this.container = _namespace.__container__;
}

var gameDates = [];

Watcher.prototype = {
  observers: {},
  watching: {},
  newObserver: function(addr, obsr) {
    this.observers[addr] = obsr;
    for (var u in this.watching) {
      if (this.watching.hasOwnProperty(u)) {
        obsr.push(this.watching[u]);
      }
    }
  },
  deadObserver: function(addr) {
    delete this.observers[addr];
  },
  watchGameDate: function() {
    var handle = ++demux.lastId;

    demux[handle] = {
      update: function(a) {
        gameDates.pushObject(a);
      }
    };

    var query = {
      watch: 'GameDate',
      unique: handle
    };

    var stringified = JSON.stringify(query);

    this.sendToCurrentObservers(stringified);
    this.watching[handle] = stringified;

    //this.sendFakeGameDates();

    return gameDates;
  },

  keepSendingGameDates: false,
  sendFakeGameDates: function() {

    if (this.keepSendingGameDates) {
      gameDates.pushObject({
        day: gameDates.length
      });
    }

    Ember.run.later(this, 'sendFakeGameDates', 400);
  },

  watchProfile: function(player, season, callback) {
    var opts = {
      player: player,
      season: season
    };
  
    return this.watch('Profile', 'Profile', opts, callback);
  },

  watch: function(typeName, entryTypeName, opts, updateHandler) {
    var type = this.namespace[typeName]; // ED limitation
    var handle = ++demux.lastId;
    var store = container.lookup('store:main');

    store.load(type, handle, {});

    var model = store.find(type, handle);
    var hash = $.extend({
      watch: typeName,
      unique: handle
    }, opts);

    var entryType = this.namespace[entryTypeName];

    demux[handle] = updateHandler ? { update: updateHandler } :
                    new Loader(type, entryType, model.get('id'), opts);

    var stringified = JSON.stringify(hash);

    // TODO: Change this to forward to ZiggridObserver.

    // Send the JSON message to the server to begin observing.
    this.sendToCurrentObservers(stringified);
    this.watching[handle] = stringified;

    return {"model": model, "handle": handle};
  },

  unwatch: function(handle) {
    console.log("unwatching " + handle);
    delete this.watching[handle];
    this.sendToCurrentObservers(JSON.stringify({ unwatch: handle }));
  },
  
  sendToCurrentObservers: function(msg) {
    if (flags.LOG_WEBSOCKETS) {
      console.log('sending ', msg, 'to', this.observers);
    }

    for (var u in this.observers) {
      if (this.observers.hasOwnProperty(u)) {
        this.observers[u].push(msg);
      }
    }
  }
};

export default Watcher;
