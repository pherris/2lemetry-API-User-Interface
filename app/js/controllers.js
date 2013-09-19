'use strict';

/* Controllers */

var myApp = angular.module('myApp.controllers', []);

angular.module('myApp.controllers').controller('AuthenticationController', ['$scope', '$http', 'AuthService', 'm2m', 'PersistedData', function ($scope, $http, AuthService, m2m, PersistedData) {
    $scope.maskPassword = function (password) {
        var mask = "";
        for (var i = 0; i < password.length - 1; i++) {
            mask += "*";
        }
        $scope.maskedPassword = mask + password.substr(password.length - 1, password.length);
    }

    //get token to use for duration of session
    $scope.login = function (username, password) {
        var onAuthOK = function (a) {
            PersistedData.setDataSet('BearerToken', a);
            $scope.token = a.token;
            $http.defaults.headers.common['Authorization'] = 'Bearer ' + a.token;

            $scope.domain = m2m.Domain.get(function () {
                console.log("on success");
                PersistedData.setDataSet('Domain', $scope.domain);
            });
        }

        var onAuthKO = function (a) {
            console.log($scope.status);
        }

        AuthService.auth(username, password, onAuthOK, onAuthKO);
    }

    var authInfo = PersistedData.getDataSet('BearerToken');
    if (authInfo) {
        $scope.token = authInfo.token;
        //not loving doing this twice
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + authInfo.token;
    }
    var domain = PersistedData.getDataSet('Domain');
    if (authInfo) {
        $scope.domain = domain;
    }
}]);

angular.module('myApp.controllers').controller('ListTopicsController', ['$scope', 'm2m', function ($scope, m2m) {
    $scope.topicObject = m2m.Topics.get();
}]);

angular.module('myApp.controllers').controller('AccountController', ['$scope', 'm2m', 'PersistedData', function ($scope, m2m, PersistedData) {
    //$scope.account = m2m.Account.get();

    $scope.findUser = function (email) {
        $scope.account = m2m.Account.get({ 'email': email }, function () {
                console.log($scope.account);
                $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
            }
        );

    }

    $scope.saveUpdatedPermissions = function (newPerm) {

        newPerm.acl = $scope.account.aclid;

        m2m.ACL.save(newPerm, function () {
            console.log("success!");
            $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
        }, function () {
            console.log("failure");
        });
    };

    $scope.removeTopicPermissions = function (topic) {
        var confirmRemove = confirm("Are you sure you want to delete this entire topic?\n\n" + topic);

        if (confirmRemove) {
            m2m.ACL.remove({ topic: topic, acl: $scope.account.aclid }, function () {
                //update list.
                $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
                console.log("success!");
            }, function () {
                console.log("failure");
            });
        }
    }

    $scope.saveNewPermissions = function (topic) {
        if (topic.charAt(0) == "/") {
            topic = topic.substr(1, topic.length);
        }

        m2m.ACL.save({ get: true, post: false, delete: false, pub: false, sub: false, topic: topic, acl: $scope.account.aclid }, function () {
            console.log("added!");
            $scope.acl = m2m.ACL.permissions({acl: $scope.account.aclid});
        }, function () {
            console.log("failure: could not add");
        });
    }

    $scope.domain = PersistedData.getDataSet('Domain');
}]);