'use strict';

angular.module('2lemetryApiV2', ['ui.router', '2lemetryApiV2.filters', '2lemetryApiV2.services', '2lemetryApiV2.directives', '2lemetryApiV2.controllers', 'ngGrid'])
  .config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /authenticate
  $urlRouterProvider.otherwise("/authenticate");
  //
  // Now set up the states
  $stateProvider
    .state('authenticate', {
      url: '/authenticate',
      controller: 'AuthenticationController', 
      templateUrl: 'partials/login.html'
    })
    .state('listTopics', {
      url: '/listTopics',
      controller: 'ListTopicsController',
      templateUrl: 'partials/listTopics.html'
    })
    .state('accounts', {
      url: '/accounts/:email',
      templateUrl: 'partials/accounts.html',
      controller: 'AccountController'
    })
    .state('createAccount', {
      url: '/createAccount',
      templateUrl: 'partials/createAccount.html',
      controller: 'CreateAccountController'
    })
    .state('monitor', {
      url: '/sys',
      templateUrl: 'partials/sysMonitor.html',
      controller: 'SysController'
    });
  });

angular.module('2lemetryApiV2').run(['$rootScope', 'AuthService', 'm2mSYSLog', 'notificationService', function ($rootScope, AuthService, m2mSYSLog, notificationService) {
  //websocket connection established once http authentication is completed.
  $rootScope.$on('authenticated', function (event, authenticated) {
    if (authenticated) {
      m2mSYSLog.connect();
    }
  });

  if (AuthService.authFromLocalStorage()) { //adds authorization from local storage if present
    notificationService.addSuccess('Loaded from local storage.');
  } else {
    //notificationService.addDanger('not auth');
  }
}]);

angular.module('2lemetryApiV2').value("config", {
  'broker': {
    'host': 'q.m2m.io',
    'port': '8083'
  }
});
