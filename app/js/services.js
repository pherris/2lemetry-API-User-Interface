'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var serviceModule = angular.module('2lemetryApiV2.services', ['ngResource']).
    value('version', '0.1.1').
    value('domain', 'test').
    factory('AuthService', ['$http', '$rootScope', 'PersistedData', 'notificationService', function ($http, $rootScope, PersistedData, notificationService) {
        // $http is recommended for cases where you have to modify headers (really) - or maybe I don't know what I'm doing...
        return {
            auth: function (username, password, successCb, errorCb) {
              $http.get('https://api.m2m.io/2/auth', {
                headers: {
                  Authorization: username + ":" + password
                }
              }).success(successCb).error(errorCb);
            },
            addAuthorizationHeader: function (token) {
              $http.defaults.headers.common['Authorization'] = 'Bearer ' + token;
              $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
            }, 
            authFromLocalStorage: function () {
              var success = false;
              try {
                var bearerToken = PersistedData.getDataSet('BearerToken');
                if (bearerToken.created > (new Date()).getTime() - 1000 * 60 * 60 * 2.75) {
                  this.addAuthorizationHeader(bearerToken.token);
                  success = true;
                }
              } catch (e) {
                success = false;
              }

              if (!success) {
                notificationService.addDanger('not authenticated');
              }

              $rootScope.$emit('authenticated', success); 

              return success;
            }
        };
    }]).
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
                //isArray: true, // limits permissions
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            }
        }),
        ACL: $resource('https://api.m2m.io/2/account/domain/:domain/acl/:acl/:remove', {acl: '@acl', domain: function () {
            var domain = PersistedData.getDataSet('Domain');
            return domain.rowkey;
        }}, {
            permissions: {method: 'GET', isArray: false},
            save: { method: 'PUT', params: { get: '@get', post: '@post', delete: '@delete', publish: '@pub', subscribe: '@sub', topic: '@topic' }},
            remove: { method: 'PUT', params: { topic: '@topic', remove: 'remove', api: true, m2m: true }} //url: 'https://api.m2m.io/2/account/domain/:domain/acl/:acl/remove?api=true&m2m=true'
        }),
        Domain: $resource('https://api.m2m.io/2/account/domain/', {})
    };
}]);

/**
 * service to manage error messages
 **/
 serviceModule.factory('notificationService', ['$interval', '$rootScope', '$timeout', function ($interval, $rootScope, $timeout) {
    var cleanupInterval, polling = false;

    $rootScope.notifications = { //mapped to bootstrap's css
        'default': [],
        'primary': [],
        'success': [],
        'info': [],
        'warning': [],
        'danger': []
    };

    //a little too clever for my own good here, watch how much we recurse....
    $rootScope.$watch(function() { return $rootScope.notifications; }, function (newVal, oldVal) {
      var start = false, 
          cleanup = function () {
              for (var type in $rootScope.notifications) {
                  for (var i = 0; i < $rootScope.notifications[type].length; i++) {
                      if ($rootScope.notifications[type][i].added < new Date().getTime() - 1000 * 3) {
                          $rootScope.notifications[type].splice(i, 1); 
                      }
                  }
              }
          };

      for (var type in $rootScope.notifications) {
        //if any notifications have a length, start timer
        if ($rootScope.notifications[type].length > 0) {
          start = true;
          break;
        }
      }
      if (start && !polling) {
        polling = true;
        cleanupInterval = $interval(cleanup, 2000);
      } else if (!start && polling) {
        polling = false;
        $interval.cancel(cleanupInterval);
      }
    }, true);

    //todo - add more addX helper methods
    return {
        addDanger: function (message) {
            this.add('danger', message);
        }, 
        addSuccess: function (message) {
            this.add('success', message);
        }, 
        add: function (type, message) {
            $rootScope.notifications[type].push({ 
                added: (new Date()).getTime(), 
                msg: message, 
                type: type 
            });
        },
        get: function () {
            return $rootScope.notifications;
        }
    };
}]);

serviceModule.factory('m2mSYSLog', ['$rootScope', '$q', '$timeout', 'config', 'notificationService', 'PersistedData', function ($rootScope, $q, $timeout, config, notificationService, PersistedData) {

  var _log = {
        'events': [],
        'subscriptions': {}
    },
    maxLogEntries = 200,
    client = new Messaging.Client(config.broker.host, Number(config.broker.port), "WS:" + new Date().getTime()),
    keepAlive = 60,
    useSsl = false,
    WEBSOCKET_EVENT_PREFIX = 'Websocket',
    cleanSession = true, 
    addLogEvent = function (subject, message) {
      if (subject.indexOf('/$SYS/subscriptions') <= 0) {
        var formattedMessage = '';
        if (subject.indexOf('/') === 1) {
            formattedMessage = subject.slice(subject.indexOf('/$SYS') + 6, subject.length) + " : " + message
        } else {
            formattedMessage = subject + " : " + message;
        }

        _log.events.splice(0, 0, {
          'type': 'info',
          'msg': formattedMessage,
          'received': new Date()
        });

        //trim up by removing first element(s)
        if (_log.events.length > maxLogEntries) {
          _log.events = _log.events.slice(0, maxLogEntries);
        }
      } else {
         _log.subscriptions = JSON.parse(message);
      }
      $rootScope.$digest();
    },
    websocketListeners = {
      'onConnect': function onConnect() {
        notificationService.addSuccess('websocket connection established.');
        addLogEvent(WEBSOCKET_EVENT_PREFIX, 'connection established');
        var domain = PersistedData.getDataSet('Domain').rowkey
        client.subscribe(domain + "/$SYS/#");
        notificationService.addSuccess('subscribing to ' + domain + "/$SYS/#");
      },
      'onConnectionLost': function (responseObject) {
        //if (responseObject.errorCode !== 0) {
          notificationService.addDanger('Lost websocket connection : ' + responseObject.errorMessage);
          addLogEvent(WEBSOCKET_EVENT_PREFIX, 'connection lost');
        //}
      },
      'onMessageArrived': function (message) {
        console.log("onMessageArrived:" + message.destinationName);
        //client.disconnect(); 
        addLogEvent(message.destinationName, message.payloadString);
      }
    };

  //client.startTrace();
  client.onConnectionLost = websocketListeners.onConnectionLost;
  client.onMessageArrived = websocketListeners.onMessageArrived;
  //console.log(client.getTraceLog());
  

  return {
    'connect': function () {
      client.connect({
        'userName': PersistedData.getDataSet('username'), 
        'password': PersistedData.getDataSet('password_md5'), 
        'keepAliveInterval': keepAlive, 
        'useSSL': useSsl, 
        'cleanSession': cleanSession,
        'onSuccess': websocketListeners.onConnect 
      });  
      return client;
    }, 
    'log': _log
  };

}]);