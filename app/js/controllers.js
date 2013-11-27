'use strict';

/* Controllers */

var myApp = angular.module('2lemetryApiV2.controllers', []);

angular.module('2lemetryApiV2.controllers').controller('AuthenticationController', ['$scope', '$rootScope', '$http', '$timeout', 'AuthService', 'm2m', 'PersistedData', function ($scope, $rootScope, $http, $timeout, AuthService, m2m, PersistedData) {
    // get token to use for duration of session
    $scope.login = function (username, password) {
    	// TODO: 2lemetry to implement change to allow authentication to broker via websockets with api key
    	PersistedData.setDataSet('username', username);
    	PersistedData.setDataSet('password', password);
        var onAuthOK = function (a) {
            PersistedData.setDataSet('BearerToken', a);
            $scope.token = a.token;
            // set global $http stuff
            $http.defaults.headers.common['Authorization'] = 'Bearer ' + a.token;
            $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";

            $scope.domain = m2m.Domain.get(function () {
                PersistedData.setDataSet('Domain', $scope.domain);
            });
            
            $rootScope.$emit('authenticated');
        };

        var onAuthKO = function (a) {
            console.log("login failed");
        };

        AuthService.auth(username, password, onAuthOK, onAuthKO);
    };

    var authInfo = PersistedData.getDataSet('BearerToken');
    if (authInfo) {
        $scope.token = authInfo.token;
        // not loving doing this twice
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + authInfo.token;
    }
    var domain = PersistedData.getDataSet('Domain');
    if (authInfo) {
        $scope.domain = domain;
    }
}]);

angular.module('2lemetryApiV2.controllers').controller('ListTopicsController', ['$scope', 'm2m', function ($scope, m2m) {
    $scope.topicObject = m2m.Topics.get();
}]);

angular.module('2lemetryApiV2.controllers').controller('CreateAccountController', ['$scope', '$location', 'm2m', function ($scope, $location, m2m) {
    $scope.createUser = function (email, password) {
        $scope.newAccount = m2m.AccountCreate.create({email: email, password: password }, function (value, responseHeaders) {
            $location.path("/accounts/" + email);
        }, function (httpResponse) {
            $scope.error = httpResponse.data.message;
        });
    }
}]);

angular.module('2lemetryApiV2.controllers').controller('AccountController', ['$scope', '$routeParams', 'm2m', 'PersistedData', function ($scope, $routeParams, m2m, PersistedData) {
    // $scope.account = m2m.Account.get();
	$scope.changePassword = function (newPassword, updatingRowkey) {
        $scope.pwdChange = m2m.AccountPwd.change({ password: newPassword, rowkey: updatingRowkey }, function (value, responseHeaders) {
            $scope.account = value;
            $scope.newPwd = null;
            $scope.newPwd2 = null;
        }, function (httpResponse) {
            $scope.error = httpResponse.data.message;
        });
    }
	
    $scope.findUser = function (email) {
        $scope.account = m2m.Account.get({ 'email': email }, function () {
                $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
            }
        );
    }

    $scope.saveUpdatedPermissions = function (newPerm) {

        newPerm.acl = $scope.account.aclid;

        m2m.ACL.save(newPerm, function () {
            $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
        }, function () {
            console.log("failure: could not save new permissions");
        });
    };

    $scope.removeTopicPermissions = function (topic) {
        var confirmRemove = confirm("Are you sure you want to delete this entire topic?\n\n" + topic);

        if (confirmRemove) {
            m2m.ACL.remove({ topic: topic, acl: $scope.account.aclid }, function () {
                // update list.
                $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
            }, function () {
                console.log("failed removing topic permission");
            });
        }
    }

    $scope.validateTopic = function (topic) {
        if (topic.charAt(0) == "/") {
            topic = topic.substr(1, topic.length);
        }
        return topic.toUpperCase();
        // electing not to validate on domain here since someone may want a topic like /domain/domain/topic
    }

    $scope.saveNewPermissions = function (topic) {
        topic = $scope.validateTopic(topic);
        m2m.ACL.save({ get: true, post: false, delete: false, pub: false, sub: false, topic: topic, acl: $scope.account.aclid }, function () {
            $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
        }, function () {
            console.log("failure: could not add");
        });
    }

    if ($routeParams.email) {
        $scope.findUser($routeParams.email);
    }

    $scope.domain = PersistedData.getDataSet('Domain');
}]);

angular.module('2lemetryApiV2.controllers').controller('SysController', ['$rootScope', '$scope', 'm2mSocket', function ($rootScope, $scope, m2mSocket) {
	$rootScope.$on('sysConnected', function () {
		m2mSocket.on('data', function (data) {
			console.log(JSON.stringify(data));
			if (!data) {
				return;
			}
			// assign different types of data to different models
			if (data.topic.indexOf('subscriptions') > 0) {
				if ($scope.subscriptions !== data.message) {
					$scope.subscriptions = data.message;
				}
			} else if (data.topic.indexOf('connect') > 0 ||
					data.topic.indexOf('lostconnect') > 0 || 
					data.topic.indexOf('disconnect') > 0) {
				data.message.type = data.topic.substr(data.topic.lastIndexOf("/") + 1, data.topic.length);
				$scope.connectLog = [data.message].concat($scope.connectLog);
			} else if (data.topic.indexOf('subscribe-errors') > 0) {
				$scope.errorLog = [data.message].concat($scope.errorLog);
			} else {
				console.log("data: " + JSON.stringify(data));
			}
		});
	});
}]);