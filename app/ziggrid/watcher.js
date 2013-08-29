import demux from 'appkit/ziggrid/demux';

var unique = 1;
var container;

function Loader(type, entryType, id, opts) {
  var store = container.lookup('store:main');

  this.update = function(body) {
    var players = [];

    for (var i=0;i<body.length;i++) {
      var item = body[i];
      store.load(entryType, item[1], {f1: item[0]});
      players.push(item[1]);
    }

    store.load(type, id, {
      entries: players
    });
  };
}

function Watcher(_namespace) {
  this.namespace = _namespace;
  container = this.container = _namespace.__container__;
}

Watcher.prototype = {
  watch: function(typeName, entryTypeName, opts) {
    var type = this.namespace[typeName]; // ED limitation
    var handle = unique;
    var store = container.lookup('store:main');

    unique++;
    store.load(type, handle, {});

    var model = store.find(type, handle);
    var hash = $.extend({
      watch: typeName,
      unique: handle
    }, opts);

    var entryType = this.namespace[entryTypeName];
    demux[handle] = new Loader(type, entryType, model.get('id'), opts);

    var stringified = JSON.stringify(hash);

    // TODO: Change this to forward to observer.

    var connectionManager = container.lookup('connection_manager:main');
    connectionManager.send(stringified);

    var stubbedPayload = {
      responseBody: '{"deliveryFor":1,"payload":{"id":"leaderboard_average_groupedBy_season-874C43B53873E641E8503936AEB3F104269ED750","ziggridType":"leaderboard_average_groupedBy_season","season":"2006","table":[["1","hairj002"],["1","hattj001"],["0.75","inglj001"],["0.7142857142857143","boona001"],["0.7","willb002"],["0.6666666666666666","widgc001"],["0.6666666666666666","matsh001"],["0.6666666666666666","linda001"],["0.6666666666666666","lugoj001"],["0.6666666666666666","mauej001"]]}}',
      status: 200
    };

    Ember.run.later(connectionManager, 'handleMessage', stubbedPayload, 1500);

    return model;
  },

  unwatch: function(handle) {
    // TODO
    //if (handle)
      //send(JSON.stringify({'unwatch': handle}));
  }
};

export default Watcher;
