import Player from 'appkit/models/player';
import flags from 'appkit/flags';

var App = window.App;

var QuadrantPlayer = Ember.Object.extend({
  init: function(){
    this._super();
    QuadrantPlayer.all.pushObject(this);
    QuadrantPlayer.allByCode[this.get('code')] = this;
  },

  code: Ember.computed.alias('data.code'),
  profileData: null,
  profile: null,

  realized: false,
  hotness: 0,
  goodness: 0,
  imageUrl: function(){
    return '/players/' + this.get('code') + '.png';
  }.property('data.name').readOnly(),

  // the actual player data resides on the Player mode,
  // this merely decorates. It is possible for us to have
  // inconsitent data, has this extra abstractoin
  data: function() {
    var name = this.get('name');
    var data = Player.allStars[name] || {};
    var playerData = Player.dataByName[name] || {};
    Ember.merge(data, playerData);
    return data;
  }.property('name'),

  hasSeason: function(season) {
    var seasons = this.get('data.seasons');

    return !!(seasons && seasons[season]);
  },

  humanizedName: Ember.computed.oneWay('profileData.fullname'),

  watchProfile: function() {
    this.set('profile', this.get('profileData'));
  },

  unwatchProfile: function() {
    this.set('profile', null);
  }
});

QuadrantPlayer.reopenClass({
  all: [],
  allByCode: {},
  findOrCreateByName: function(playerName) {
    var player = QuadrantPlayer.all.findProperty('name', playerName);

    if (!player) {
      player = QuadrantPlayer.create({
        name: playerName
      });
    }

    return player;
  },
  watchPlayers: function(container, playerNames, season, dayOfYear) {
    var watcher = container.lookup('watcher:main');
    playerNames.forEach(function(playerName, i) {
      watchPlayer(watcher, playerName, season);
      QuadrantPlayer.findOrCreateByName(playerName);
    });

    return QuadrantPlayer.all; // TODO: some record array.
  }
});

function updateQuadrantPlayer(data) {
  if (flags.LOG_WEBSOCKETS) {
    console.log('updateQuadrantPlayer', data);
  }

  if (!data.player) return;

  var player = QuadrantPlayer.allByCode[data.player];
  if (!player)
    player = QuadrantPlayer.create({ name: data.player });

  player.set('realized', true);
  player.set('profileData', data);
  player.set('goodness', normalizedQuadrantValue(data['clutchness']));
  player.set('hotness', normalizedQuadrantValue(data['hotness']));
}

function normalizedQuadrantValue(value) {
  if (typeof value === undefined) return 0.5;
  if (value <= 0) return 0.0;
  if (value > 1) return 1.0;
  return value;
}

function watchPlayer(watcher, playerName, season) {
  watcher.watchProfile(playerName, season, updateQuadrantPlayer);
}

// TODO: inject
function getConnectionManager() {
  return App.__container__.lookup('connection_manager:main');
}

export default QuadrantPlayer;
