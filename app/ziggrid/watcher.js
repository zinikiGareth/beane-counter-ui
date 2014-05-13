import flags from 'appkit/flags';

var container;

function Loader(type, entryType, id) {
  var store = container.lookup('store:main');

  this.update = type === entryType ? updateIndividualThing : updateTabularData;

  function updateTabularData(body) {
    for (var p in body) {
      if (body.hasOwnProperty(p) && typeof(body[p]) === 'object') {
        body = body[p][0];
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
        return;
      }
    }
  }

  function updateIndividualThing(body) {
    for (var p in body) {
      if (body.hasOwnProperty(p) && typeof(body[p]) === 'object') {
        body = body[p][0];
        body.handle_id = id;
        store.load(type, id, body);
        return;
      }
    }
  }
}

function subscribe(observer, hash) {
  var req = observer.subscribe("watch/"+hash.watch, hash.callback);
  if (hash.opts) {
    for (var opt in hash.opts) {
      if (hash.opts.hasOwnProperty(opt))
        req.setOption(opt, hash.opts[opt]);
    }
  }
  req.send();
  if (!hash.subscriptions)
    hash.subscriptions = [];
  hash.subscriptions.push(req);
}
 
function Watcher(_namespace) {
  this.namespace = _namespace;
  container = this.container = _namespace.__container__;
}

var gameDates = [];
var randomId = 1;

Watcher.prototype = {
  observers: {},
  watching: [],
  newObserver: function(addr, obsr) {
    this.observers[addr] = obsr;
    for (var u=0;u<this.watching.length;u++) {
      var hash = this.watching[u];
      subscribe(obsr, hash);
    }
  },
  deadObserver: function(addr) {
    delete this.observers[addr];
  },
  watchGameDate: function() {
    var query = {
      watch: 'GameDate',
      callback: function(o) { gameDates.pushObject(o.gameDates[0]); }
    };

    this.sendToCurrentObservers(query);
    this.watching.push(query);

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
      season: "" + season
    };
  
    return this.watch('Profile', 'Profile', opts, function(ja) { callback(ja['profiles'][0]); });
  },

  watch: function(typeName, entryTypeName, opts, updateHandler) {
    var type = this.namespace[typeName]; // ED limitation
    var entryType = this.namespace[entryTypeName];
    var store = container.lookup('store:main');

// The use of "handle" here is left over from before
// I think we should want this passed in, possibly with the whole model
    var handle = ++randomId;
    store.load(type, handle, {});
    var model = store.find(type, handle);

    var hash = {
      watch: typeName,
      opts: opts,
      callback: updateHandler ? updateHandler :
                new Loader(type, entryType, model.get('id'), opts).update
    };

    // Send the JSON message to the server to begin observing.
    this.sendToCurrentObservers(hash);
    this.watching.push(hash);

    return {"model": model, "handle": handle, "hash": hash};
  },

  unwatch: function(hash) {
    for (var i=0;i<hash.subscriptions.length;i++)
      hash.subscriptions[i].unsubscribe();
    var idx = this.watching.indexOf(hash);
    this.watching.splice(idx, 1); 
  },
  
  sendToCurrentObservers: function(hash) {
    if (flags.LOG_WEBSOCKETS) {
      console.log('watching', hash.watch, 'from', this.observers);
    }

    for (var u in this.observers) {
      if (this.observers.hasOwnProperty(u)) {
        subscribe(this.observers[u], hash);
      }
    }
  }
};

export default Watcher;