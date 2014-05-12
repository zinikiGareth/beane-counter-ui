var TeamStanding = Ember.Component.extend({
  _applicationController: Ember.computed(function(){
    return this.container.lookup('controller:application');
  }),

  season: Ember.computed.alias('_applicationController.season'),
  team: null,
  handle: null,
  watcher: Ember.computed(function() {
    return this.container.lookup('watcher:main');
  }),

  winLoss: function() {
    var watcher = this.get('watcher');
    var code = this.get('team.watchCode');
    var season = this.get('season');

    var handle = this.get('handle');

    if (handle) {
      // unsubscribe;
      watcher.unwatch(handle);
    }

    var subscription = {
      team: code,
      season: '' + season
    };

//    console.log('watching', subscription);

    var track = watcher.watch('WinLoss', 'WinLoss', subscription);
    this.set('handle', track.hash);

    return track.model;
  }.property('team.code', 'season'),
  wins: Ember.computed.alias('winLoss.wins'),
  losses: Ember.computed.alias('winLoss.losses')
});

export default TeamStanding;
