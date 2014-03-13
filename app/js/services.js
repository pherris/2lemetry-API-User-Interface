'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var serviceModule = angular.module('2lemetryApiV2.services', ['ngResource']).
    value('version', '0.1.1').
    value('domain', 'test').
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
 serviceModule.factory('notificationService', ['$interval', '$rootScope', function ($interval, $rootScope) {
    var cleanupInterval;

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
            polling = false, 
            cleanup = function () {
                for (var type in $rootScope.notifications) {
                    for (var i = 0; i < $rootScope.notifications[type].length; i++) {
                        if ($rootScope.notifications[type][i].added < new Date().getTime() - 1000 * 3) {
                            $rootScope.notifications[type].splice(i, 1); 
                        }
                    }
                }
            };

        if (newVal !== oldVal) {
            for (var type in $rootScope.notifications) {
                //if any notifications have a length, start timer
                if ($rootScope.notifications[type].length > 0) {
                    start = true;
                    break;
                }
            }
            if (start && !polling) {
                console.log('start polling');
                polling = false;
                cleanupInterval = $interval(cleanup, 2000);
            } else if (!start && polling) {
                console.log('stop polling');
                $interval.cancel(cleanupInterval);
            }
        }
    }, true);

    //todo - add more addX helper methods
    return {
        addDanger: function (message) {
            this.add('danger', message);
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

serviceModule.factory('m2mSocket', ['$rootScope', '$q', '$timeout', function ($rootScope, $q, $timeout) {
	var MqttClientApp = {
      client : new WebSocketClient('q.m2m.io', 8083, 'webMonitor')
    },  receivedData = [];
	
	return {
	    connected: function () {
	        return socket && socket.conn;
	    },
		connect: function (username, password, domain) {
		    var deferred = $q.defer();
		    
		    if (socket && socket.conn) {
		        console.log("already connected");
		        deferred.resolve('connected');
		        return deferred.promise;
		    }

            this.listeners.addListener('connect', function(host, port, clientId, username, password,
                keepAlive, useSsl, cleanSession, lastWillTopic, lastWillMessage, lastWillQos, lastWillRetain) {
                

                MqttClientApp.client.addLastWillMessage(lastWillTopic, lastWillMessage,
                    lastWillQos, lastWillRetain);

                MqttClientApp.client.connect(username, password, keepAlive, useSsl, cleanSession, {});
            });

              
			
		    socket = new SocketMQ({
				username:       username,
		        md5Password:    md5(password),
		        subscribe: [{
		            topic: [domain + '/$SYS/#'],
		            qos: 0
		        }],
		        ping: true
		    });
			
			socket.on('error', function(error) {
		         console.log('----- error -----');
		         console.log(JSON.stringify(error));
		    });
			socket.on('connected', function() {
		        console.log('----- connected -----');
		    });
		    socket.on('subscribed', function(subscribed) {
		        console.log('----- subscribed -----');
		        console.log(JSON.stringify(subscribed));
		    });
		    socket.on('unsubscribed', function(subscribed) {
		        console.log('----- unsubscribed -----');
		        console.log(JSON.stringify(subscribed));
		    });
		    socket.on('disconnected', function() {
		        console.log('----- disconnected -----');
		    });
		
		    socket.connect();
		    
		    $timeout(function() {
		        deferred.resolve('connected');
		    }, 1000);
		    
		    return deferred.promise;
        },
		on: function (eventName, callback) {
			socket.on(eventName, function () {  
		        var args = arguments;
		        $rootScope.$apply(function () {
		          callback.apply(socket, args);
		        });
			});
	    },
	    emit: function (eventName, data, callback) {
	    	socket.emit(eventName, data, function () {
		        var args = arguments;
		        $rootScope.$apply(function () {
		          if (callback) {
		            callback.apply(socket, args);
		          }
		        });
	    	});
	    }, 
	    /**
         * Keeps data received for page reloads.
         */
	    cache: function (name, value) {
	        return receivedData[name] = value;
	    },
	    getCache: function (name) {
	        return receivedData[name];
	    }
    };
}]);