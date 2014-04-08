var url = '/ziggrid/';

import ConnectionManager from 'appkit/ziggrid/connection_manager';

var initializer = {
  name: 'connection-manager',
  before: 'registerComponents',
  initialize: function(container, application) {
    var connectionManager = ConnectionManager.create({
      url: url,
      namespace: application,
      container: container
    });

    application.register('connection_manager:main', connectionManager, {
      instantiate: false
    });

    application.inject('component:bean-player',
               'connectionManager',
               'connection_manager:main');
  }
};

export default initializer;
