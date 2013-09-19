'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers']).
  config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/authenticate', {templateUrl: 'partials/login.html', controller: 'AuthenticationController'});
        $routeProvider.when('/listTopics', {templateUrl: 'partials/listTopics.html', controller: 'ListTopicsController'});
        $routeProvider.when('/accounts', {templateUrl: 'partials/accounts.html', controller: 'AccountController'});
        $routeProvider.otherwise({redirectTo: '/authenticate'});
  }]);
