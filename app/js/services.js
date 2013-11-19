'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var serviceModule = angular.module('2lemetryApiV2.services', ['ngResource']).
    value('version', '0.1.0').
    factory('AuthService',function ($http) {
        // $http is recommended for cases where you have to pass in variables (really) - or maybe I don't know what I'm doing...
        return {
            auth: function (username, password, successCb, errorCb) {
                $http.get('https://api.m2m.io/2/auth', {
                    headers: {
                        Authorization: username + ":" + password
                    }
                }).success(successCb).error(errorCb);
            }
        };
    }).
    // creates a persistent store to use for immutable (really immutable or probably
    // immutable for the duration of the user's session) data to be retained across screens
    factory('PersistedData', function ($rootScope) {
        return {
            setDataSet: function (name, object) {
                // if the object doesnt say when it was created...
                if (!object.created) {
                    object.created = (new Date()).getTime();
                }
                localStorage.setItem(name, JSON.stringify(object));
                return JSON.parse(localStorage.getItem(name));
            },
            getDataSet: function (name) {
                var dataSet = JSON.parse(localStorage.getItem(name));
                // for data in local storage - don't let it be older than 3 hrs
                if (dataSet && dataSet.created < ((new Date()).getTime()) - 1000 * 60 * 60 * 3) {
                    localStorage.removeItem(name);
                }
                return JSON.parse(localStorage.getItem(name));
            }
        }
    });

/**
 * m2m service for 2lemetry api calls
 */
serviceModule.factory('m2m', ['PersistedData', '$resource', '$http', function (PersistedData, $resource, $http) {
    return {
        Topics: $resource('https://api.m2m.io/2/account/domain/:domain/topics', {domain: function () {
            var domain = PersistedData.getDataSet('Domain');
            return (domain && domain.rowkey) ? domain.rowkey : "";
        } }),
        // TODO: pull all these Account interactions together.
        Account: $resource('https://api.m2m.io/2/account/:email', {email: '@email'}),
        AccountPwd: $resource('https://api.m2m.io/2/account/:rowkey', {rowkey: '@rowkey'}, {
        	change: {
        		method: 'PUT',
        		params: {
        			password: '@password'
        		}
        	}
        }),
        AccountCreate: $resource('https://api.m2m.io/2/account/domain/:domain', {}, {
            create: {
                method: 'POST',
                params: {domain: function () {
                    var domain = PersistedData.getDataSet('Domain');
                    return domain.rowkey;
                }, newUserDomain: function () {
                    var domain = PersistedData.getDataSet('Domain');
                    return domain.rowkey;
                }, clearAcl: true, email: '@email', password: '@password' },
                isArray: true, // limits permissions
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            }
        }),
        ACL: $resource('https://api.m2m.io/2/account/domain/:domain/acl/:acl', {acl: '@acl', domain: function () {
            var domain = PersistedData.getDataSet('Domain');
            return domain.rowkey;
        }}, {
            permissions: {method: 'GET', isArray: false},
            save: { method: 'PUT', params: { get: '@get', post: '@post', delete: '@delete', publish: '@pub', subscribe: '@sub', topic: '@topic' }},
            remove: { method: 'PUT', params: { get: false, post: false, delete: false, publish: false, subscribe: false, topic: '@topic' }}
        }),
        Domain: $resource('https://api.m2m.io/2/account/domain/', {})
    };
}]);