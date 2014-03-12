'use strict';

/* Directives */


angular.module('2lemetryApiV2.directives', []).
    directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }]).
    directive('appDomain', ['domain', function (domain) {
        return function (scope, elm, attrs) {
            elm.text(domain);
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
    directive('topicPermissions', [function () {
        return {
            restrict: 'E',
            //require: 'ngModel',
            templateUrl: 'partials/topicPermissions.html',
            scope: {
                permissions: '=',
                topic: '=',
                onPermissionChange: '&'
            },
            link: function (scope, elem, attrs) {
                var getPermissionVal = function (perm) {
                    return scope.permissions && scope.permissions.indexOf(perm) > -1;
                };

                scope.perms = {};

                //map array from 2lemetry to object
                scope.perms['pub'] = getPermissionVal('pub');
                scope.perms['sub'] = getPermissionVal('sub');
                scope.perms['get'] = getPermissionVal('get');
                scope.perms['post'] = getPermissionVal('post');
                scope.perms['delete'] = getPermissionVal('delete');

                //for topic post back to 2lemetry - don't like this dependency
                if (!scope.topic) {
                    scope.topic = "";
                }
                scope.perms['topic'] = scope.topic.substr(scope.topic.indexOf("/") + 1, scope.topic.length); //remove "{domain}/"


                scope.toggle = function (perm, state) {
                    if (scope.readonly && scope.readonly === 'true') {
                        return;
                    }
                    scope.perms[perm] = !scope.perms[perm]; //shouldnt be necessary if the html was binding to the model but thats not happening for some reason.
                    console.log(JSON.stringify(scope.perms));
                    //hand off to callback
                    scope.onPermissionChange({ 'permissions': scope.perms });
                };
            }
        };
    }]);
