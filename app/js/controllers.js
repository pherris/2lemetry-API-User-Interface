'use strict';

/* Controllers */

var myApp = angular.module('2lemetryApiV2.controllers', []);

angular.module('2lemetryApiV2.controllers').controller('AuthenticationController', ['$scope', '$rootScope', '$timeout', 'AuthService', 'm2m', 'PersistedData', 'domain', 'notificationService', function ($scope, $rootScope, $timeout, AuthService, m2m, PersistedData, domain, notificationService) {
  // get token to use for duration of session
  $scope.login = function (username, password) {
    if (!username || !password) {
      notificationService.addSuccess('Username and password required.');
      throw new Error('please enter a username and a password');
    }

    PersistedData.setDataSet('username', username);
	PersistedData.setDataSet('password_md5', md5(password));

    var onAuthOK = function (a) {
      PersistedData.setDataSet('BearerToken', a);
      AuthService.addAuthorizationHeader(a.token);
      
      $scope.domain = m2m.Domain.get(function () {
        PersistedData.setDataSet('Domain', $scope.domain);
        domain = $scope.domain;

        $scope.$emit('authenticated');
        notificationService.addSuccess('Authenticated');

      });
    };

    var onAuthKO = function (a) {
      notificationService.addDanger("login failed");
    };

    AuthService.auth(username, password, onAuthOK, onAuthKO);
  };

  $scope.domain   = PersistedData.getDataSet('Domain');
  $scope.username = PersistedData.getDataSet('username');
  $scope.token    = (PersistedData.getDataSet('BearerToken')) ? PersistedData.getDataSet('BearerToken').token : null;
}]);

angular.module('2lemetryApiV2.controllers').controller('ListTopicsController', ['$scope', 'm2m', 'notificationService', function ($scope, m2m, notificationService) {
  $scope.topicObject = m2m.Topics.get();
}]);

angular.module('2lemetryApiV2.controllers').controller('CreateAccountController', ['$scope', '$location', 'm2m', 'notificationService', function ($scope, $location, m2m, notificationService) {
    $scope.createUser = function (email, password) {
        $scope.newAccount = m2m.AccountCreate.create({email: email, password: password }, function (value, responseHeaders) {
            $location.path("/accounts/" + email);
        }, function (httpResponse) {
            notificationService.addDanger(httpResponse.data.message);
        });
    }
}]);

angular.module('2lemetryApiV2.controllers').controller('AccountController', ['$scope', '$stateParams', 'm2m', 'PersistedData', 'notificationService', function ($scope, $stateParams, m2m, PersistedData, notificationService) {
    $scope.changePassword = function (newPassword, updatingRowkey) {
        $scope.pwdChange = m2m.AccountPwd.change({ password: newPassword, rowkey: updatingRowkey }, function (value, responseHeaders) {
            $scope.account = value;
            $scope.newPwd = null;
            $scope.newPwd2 = null;
        }, function (httpResponse) {
            notificationService.addDanger(httpResponse.data.message);
        });
    };

    $scope.findUser = function (email) {
        $scope.account = m2m.Account.get({ 'email': email }, function () {
                $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
            }, function () {
                notificationService.addDanger('account not found');
            }
        );
    };

    $scope.saveUpdatedPermissions = function (newPerm) {

        newPerm.acl = $scope.account.aclid;

        m2m.ACL.save(newPerm, function () {
            $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
        }, function () {
            notificationService.addDanger("failure: could not save new permissions");
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
        }, function () {
            console.log("failure: could not add");
        });
    }

    if ($stateParams.email) {
        $scope.findUser($stateParams.email);
        $scope.email = $stateParams.email;
    }

    //count current permissions for UI
    $scope.permLen = 0;
    $scope.$watch('acl.attributes', function () {
      if ($scope.acl && $scope.acl.attributes) {
        $scope.permLen = 0; //reset
        for (var perm in $scope.acl.attributes) {
            $scope.permLen++;
        }
      }
    });

    $scope.domain = PersistedData.getDataSet('Domain');
}]);

angular.module('2lemetryApiV2.controllers').controller('SysController', ['$scope', 'm2mSYSLog', 'notificationService', function ($scope, m2mSYSLog, notificationService) {
    //m2mSYSLog.connect();
    $scope.log = m2mSYSLog.log;
    $scope.showLog = false;
}]);