'use strict';

/* Directives */


angular.module('2lemetryApiV2.directives', []).
    directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }]).
    directive('maskedPassword', function ($timeout) {
    	return {
    		restrict: 'A',
    		scope: {
    			pwd: '=pwd'
    		},
    		link: function (scope, element, attrs) {
    			scope.$watch('pwd', function (newValue, oldValue) {
    				var mask = "", ele = element[0];
    				
    				if (newValue === oldValue) {
    					return;
    				} else if (newValue == null) {
    					ele.textContent = "";
    					return;
    				}
    				
    		        for (var i = 0; i < newValue.length - 1; i++) {
    		            mask += "*";
    		        }

    		        ele.textContent = mask + newValue.substr(newValue.length - 1, newValue.length);

    		        scope.promise = $timeout((function () {
    		            var position = newValue.length - 1;

    		            // only call once...
    		            if (scope.promise) {
    		                $timeout.cancel(scope.promise);
    		            }

    		            return function () {

    		                var character = ele.textContent.substring(position, position + 1);

    		                if (character !== "*") {
    		                	ele.textContent = ele.textContent.substr(0, position) + "*" + ele.textContent.substr(position + 1, ele.textContent.length);
    		                }
    		            }

    		        })(), 750);
                });
    		}
    	};
    }).
    directive('topicPermissions', function () {
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
        };
    });
