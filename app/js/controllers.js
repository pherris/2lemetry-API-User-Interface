'use strict';

/* Controllers */

var myApp = angular.module('2lemetryApiV2.controllers', []);

angular.module('2lemetryApiV2.controllers').controller('AuthenticationController', ['$scope', '$http', '$timeout', 'AuthService', 'm2m', 'PersistedData', function ($scope, $http, $timeout, AuthService, m2m, PersistedData) {
    $scope.maskPassword = function (password) {
        var mask = "";
        for (var i = 0; i < password.length - 1; i++) {
            mask += "*";
        }

        $scope.maskedPassword = mask + password.substr(password.length - 1, password.length);

        $scope.promise = $timeout((function () {
            var position = password.length - 1;

            //only call once...
            if ($scope.promise) {
                $timeout.cancel($scope.promise);
            }

            return function () {

                var character = $scope.maskedPassword.substring(position, position + 1);

                if (character !== "*") {
                    $scope.maskedPassword = $scope.maskedPassword.substr(0, position) + "*" + $scope.maskedPassword.substr(position + 1, $scope.maskedPassword.length);
                }
            }

            //$scope.maskedPassword = $scope.maskedPassword.
        })(), 750);
    }

    //get token to use for duration of session
    $scope.login = function (username, password) {
        var onAuthOK = function (a) {
            PersistedData.setDataSet('BearerToken', a);
            $scope.token = a.token;
            //set global $http stuff
            $http.defaults.headers.common['Authorization'] = 'Bearer ' + a.token;
            $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";

            $scope.domain = m2m.Domain.get(function () {
                PersistedData.setDataSet('Domain', $scope.domain);
            });
        }

        var onAuthKO = function (a) {
            console.log("login failed");
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
    //$scope.account = m2m.Account.get();

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
                //update list.
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
        //electing not to validate on domain here since someone may want a topic like /domain/domain/topic
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