'use strict';

/* Controllers */

var myApp = angular.module('2lemetryApiV2.controllers', []);

angular.module('2lemetryApiV2.controllers').controller('AuthenticationController', ['$scope', '$rootScope', '$http', '$timeout', 'AuthService', 'm2m', 'PersistedData', 'domain', function ($scope, $rootScope, $http, $timeout, AuthService, m2m, PersistedData, domain) {
    // get token to use for duration of session
    $scope.login = function (username, password) {
        if (!username || !password) {
            throw new Error('please enter a username and a password');
        }

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
                domain = $scope.domain;

                $scope.$emit('authenticated');
            });
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

angular.module('2lemetryApiV2.controllers').controller('AccountController', ['$scope', '$stateParams', 'm2m', 'PersistedData', 'errorService', function ($scope, $stateParams, m2m, PersistedData, errorService) {
    $scope.changePassword = function (newPassword, updatingRowkey) {
        $scope.pwdChange = m2m.AccountPwd.change({ password: newPassword, rowkey: updatingRowkey }, function (value, responseHeaders) {
            $scope.account = value;
            $scope.newPwd = null;
            $scope.newPwd2 = null;
        }, function (httpResponse) {
            errorService.add(httpResponse.data.message);
        });
    };

    $scope.errors = errorService.get();
	
    $scope.findUser = function (email) {
        $scope.account = m2m.Account.get({ 'email': email }, function () {
                $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
            }, function () {
                errorService.add('account not found');
            }
        );
    };

    $scope.saveUpdatedPermissions = function (newPerm) {

        newPerm.acl = $scope.account.aclid;

        m2m.ACL.save(newPerm, function () {
            $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
        }, function () {
            errorService.add("failure: could not save new permissions");
        });
    };

    $scope.removeTopicPermissions = function (topic) {
        var confirmRemove = confirm("Are you sure you want to delete this entire topic?\n\n" + topic);

        if (confirmRemove) {
            m2m.ACL.remove({ topic: topic, acl: $scope.account.aclid }, function () {
                // update list.
                console.log("removing topic: " + topic);
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
        return topic.toLowerCase();
        // electing not to validate on domain here since someone may want a topic like /domain/domain/topic
    }

    $scope.saveNewPermissions = function (topic) {
        topic = $scope.validateTopic(topic);
        m2m.ACL.save({ get: true, post: false, delete: false, pub: false, sub: false, topic: topic, acl: $scope.account.aclid }, function () {
            $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
            $scope.acl.then(function () {
                $scope.permLen = 0;
                for (perm in $scope.acl.attributes) {
                    $scope.permLen++;
                }
            });
        }, function () {
            console.log("failure: could not add");
        });
    }

    if ($stateParams.email) {
        $scope.findUser($stateParams.email);
    }

    //count current permissions for UI
    $scope.permLen = 0;
    $scope.$watch('acl.attributes', function () {
      if ($scope.acl && $scope.acl.attributes) {
        for (var perm in $scope.acl.attributes) {
            $scope.permLen++;
        }
      }
    });

    $scope.domain = PersistedData.getDataSet('Domain');
}]);

angular.module('2lemetryApiV2.controllers').controller('SysController', ['$rootScope', '$scope', 'm2mSocket', 'PersistedData', function ($rootScope, $scope, m2mSocket, PersistedData) {
    var flattenSubscriptions = function (clientId, subscriptions) { 
		var subscription = new Array();
        for (var i = 0; i < subscriptions.length; i++) {
        	var sub = subscriptions[i];
        	sub["clientId"] = clientId;
        	subscription.push(sub);
        }
        return subscription;
    }, subscribe = function () {
	    m2mSocket.on('data', function (data) {
            // console.log(JSON.stringify(data));
            if (!data) {
                return;
            }
            // assign different types of data to different models
            if (data.topic.indexOf('subscriptions') > 0) {
                if (m2mSocket.getCache('subscriptionsRaw') !== data.message) {
                    var subscriptions = new Array();
                    
                    for (var clientId in data.message) { 
                        subscriptions = subscriptions.concat(flattenSubscriptions(clientId, data.message[clientId]));
                    } 
                    m2mSocket.cache('subscriptions', subscriptions);
                    m2mSocket.cache('subscriptionsRaw', data.message);
                }
            } else if (data.topic.indexOf('connect') > 0 ||
                    data.topic.indexOf('lostconnect') > 0 || 
                    data.topic.indexOf('disconnect') > 0) {
                data.message.type = data.topic.substr(data.topic.lastIndexOf("/") + 1, data.topic.length);
                m2mSocket.cache('connectLog', [data.message].concat(m2mSocket.getCache('connectLog')));
            } else if (data.topic.indexOf('subscribe-errors') > 0) {
                $scope.errorLog = [data.message].concat($scope.errorLog);
            } else {
                console.log("data: " + JSON.stringify(data));
            }
            
            $scope.subscriptions = m2mSocket.getCache('subscriptions');
            $scope.connectLog = m2mSocket.getCache('connectLog');
        });
	}, authenticate = function () { 
        m2mSocket.connect(PersistedData.getDataSet('username'), 
                PersistedData.getDataSet('password'), 
                PersistedData.getDataSet('Domain').rowkey).then(subscribe); 
    };
    		
	if (PersistedData.getDataSet('Domain') && PersistedData.getDataSet('username') && PersistedData.getDataSet('password')) {
		authenticate();
	} else {
		$scope.$on('authenticated', authenticate);
	}
	
	// TODO cleaner association between model and data cached in service
	$scope.subscriptions = m2mSocket.getCache('subscriptions');
	$scope.connectLog = m2mSocket.getCache('connectLog');
	
	$scope.connectGridOptions = { 
	        data: 'connectLog',
	        showFilter: true,
            enableColumnResize: true,
            columnDefs: [{ field: 'time', displayName: 'Time', width: 100, resizable: true },
                         { field: 'clientid', displayName: 'Client Id', resizable: true },
                         { field: 'type', displayName: 'Event', width: 100, resizable: true }] 
	};
	$scope.errorGridOptions = { 
	        data: 'errorLog',
	        showFilter: true,
	        enableColumnResize: true
	};
	$scope.subscriptionGridOptions = { 
	        data: 'subscriptions',
	        showFilter: true,
            enableColumnResize: true,
	        columnDefs: [{ field: 'qos', displayName: 'QOS', width: 50, resizable: true },
                         { field: 'topic', displayName: 'Topic', resizable: true },
                         { field: 'cleanSession', displayName: 'Clean Session?', width: 150, resizable: true },
                         { field: 'clientId', displayName: 'Client Id', width: 250, resizable: true }]
    };
}]);