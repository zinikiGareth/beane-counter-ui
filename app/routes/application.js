import Player from 'appkit/models/player';
import QuadrantPlayer from 'appkit/models/quadrant_player';

var season = 2007;

var ApplicationRoute = Ember.Route.extend({
  setupController: function(controller) {

    var watcher = this.container.lookup('watcher:main');
    this.watcher = watcher;

    var gameDates = watcher.watchGameDate();

    controller.set('season', season);

    this.controllerFor('quadrant').set('gameDates', gameDates);

    this.updateQuadrantPlayers(season);
  },

  updateQuadrantPlayers: function(filter) {

    var filterController = this.controllerFor('filter');
    filterController.set('selectedFilter', filter);

    // TODO: grab this dynamically from leaderboard.

    var allStarPlayerCodes = this.container.lookupFactory('model:player').playerCodes();

    var players = QuadrantPlayer.watchPlayers(this.container, allStarPlayerCodes, season);
    this.controllerFor('quadrant').set('players', players);
  },

  actions: {
    selectFilter: function(filter) {
      this.updateQuadrantPlayers(filter);
    },
    didBeginPlaying: function() {
      this.watcher.keepSendingGameDates = true;
    },
    didEndPlaying: function() {
      this.watcher.keepSendingGameDates = false;
    }
  }
});

export default ApplicationRoute;
