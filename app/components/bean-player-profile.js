import demux from 'appkit/ziggrid/demux';

var PlayerProfile = Ember.Component.extend({
  player: null,
  seasonHolder: null,
  init: function () {
    var self = this;
    this.watcher = this.container.lookup('watcher:main'); // inject
    this.seasonHolder = this.container.lookup('controller:application');
    this.seasonHolder.addObserver('season', function() { self.playerWillChange(); self.playerChanged(); });
    this._super();
  },
  players: function() {
    var Player = this.container.lookupFactory('model:player');
    var allStars = Ember.get(Player, 'allStars');

    // just build for real Players the first time
    // this list doesn't change so we don't care
    // also the CP caches.
    return Ember.keys(allStars).map(function(entry) {
      return allStars[entry];
    }).map(function(entry) {
      return Player.create(entry);
    });
  }.property(),

  playerWillChange: function() {
    var oldPlayer = this.get('player');
    if (oldPlayer) {
      this.unwatchProfile();
    }
  }.observesBefore('player'),

  playerChanged: function() {
    var newPlayer = this.get('player');
    if (newPlayer) {
      var self = this;
      var watching = this.watcher.watchProfile(this.get('player.code'), this.seasonHolder.get('season'), function(data) {
        self.set('profile', data);
      });
      this.set('watchHandle', watching.handle);
      
    }
    this.set('imageFailedToLoad', false);
  }.observes('player').on('init'),

  watchHandle: null,
  profile: null,

  unwatchProfile: function() {
    var watchHandle = this.get('watchHandle');

    if (!watchHandle) {
      throw new Error('No handle to unwatch');
    }
    
    this.watcher.unwatch(watchHandle);
  },

  // TODO: combine the various player car
  imageFailedToLoad: false,
  imageUrl: function() {

    if (this.get('imageFailedToLoad')) {
      return '/players/404.png';
    }

    var code = this.get('player.code');
    if (!code) { return; }
    return '/players/' + code + '.png';
  }.property('player.code', 'imageFailedToLoad').readOnly(),

  listenForImageLoadingErrors: function() {
    var component = this;

    this.$('img').error(function() {
      Ember.run(component, 'set', 'imageFailedToLoad', true);
    });
  }.on('didInsertElement')
});

export default PlayerProfile;
