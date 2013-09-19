'use strict';

/* Directives */


angular.module('myApp.directives', []).
    directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }]).
    directive('fundooRating', function () {
        return {
            restrict: 'A',
            template: '<ul>' +
                '<li>MQTT</li>' +
                '<ul>' +
                '<li><input type="checkbox" ng-model="perms.pub" ng-click="toggle(\'pub\', perms.pub)"> PUBLISH</li>' +
                '<li><input type="checkbox" ng-model="perms.sub" ng-click="toggle(\'sub\', perms.sub)"> SUBSCRIBE</li>' +
                '</ul>' +
                '<li>REST</li>' +
                '<ul>' +
                '<li><input type="checkbox" ng-model="perms.get" ng-click="toggle(\'get\', perms.get)"> GET</li>' +
                '<li><input type="checkbox" ng-model="perms.post" ng-click="toggle(\'post\', perms.post)"> POST/PUT</li>' +
                '<li><input type="checkbox" ng-model="perms.delete" ng-click="toggle(\'delete\', perms.delete)"> DELETE</li>' +
                '</ul>' +
                '</ul>',
            scope: {
                permissions: '=',
                topic: '=',
                readonly: '@',
                onPermissionChange: '&'
            },
            link: function (scope, elem, attrs) {
                var getPermissionVal = function (perm) {
                    return scope.permissions && scope.permissions.indexOf(perm) > -1;
                };

                scope.perms = {};

                if (!scope.topic) {
                    scope.topic = "";
                }

                //map array from 2lemetry to object
                scope.perms['pub'] = getPermissionVal('pub');
                scope.perms['sub'] = getPermissionVal('sub');
                scope.perms['get'] = getPermissionVal('get');
                scope.perms['post'] = getPermissionVal('post');
                scope.perms['delete'] = getPermissionVal('delete');
                scope.perms['topic'] = scope.topic.substr(scope.topic.indexOf("/") + 1, scope.topic.length); //remove "{domain}/"

                scope.toggle = function (perm, state) {
                    if (scope.readonly && scope.readonly === 'true') {
                        return;
                    }

                    //hand off to callback
                    scope.onPermissionChange({ 'permissions': scope.perms });
                };
            }
        }
    });
