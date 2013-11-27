'use strict';


// Declare app level module which depends on filters, and services
angular.module('2lemetryApiV2', ['2lemetryApiV2.filters', '2lemetryApiV2.services', '2lemetryApiV2.directives', '2lemetryApiV2.controllers', 'ngGrid']).
  config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/authenticate', {templateUrl: 'partials/login.html', controller: 'AuthenticationController'});
        $routeProvider.when('/listTopics', {templateUrl: 'partials/listTopics.html', controller: 'ListTopicsController'});
        $routeProvider.when('/accounts/:email', {templateUrl: 'partials/accounts.html', controller: 'AccountController'});
        $routeProvider.when('/accounts', {templateUrl: 'partials/accounts.html', controller: 'AccountController'});
        $routeProvider.when('/createAccount', {templateUrl: 'partials/createAccount.html', controller: 'CreateAccountController'});
        $routeProvider.when('/sys', {templateUrl: 'partials/sysMonitor.html', controller: 'SysController'});
        $routeProvider.otherwise({redirectTo: '/authenticate'});
  }]);
