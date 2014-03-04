var WebSocketClient = function(host, port, clientId) {
    var that = this;

    this.host = host;
    this.port = port;
    this.clientId = clientId;
    this.emitter = MqttClientApp.listeners;

    this.clientOptions = {
        timeout: 10
    };

    this.onSuccess = function() {
        that.emitter.emit('connected', that);
    };

    this.onFailure = function(responseObject) {
        that.emitter.emit('failed', that, responseObject.errorMessage);
    };

    this.onConnectionLost = function(responseObject) {
        that.emitter.emit('connectionLost', that, responseObject);
    };

    this.onMessageArrived = function(message) {
        that.emitter.emit('messageArrived', that, message);
    };
};

WebSocketClient.prototype.addLastWillMessage = function(topic, payload, qos, retain) {
    if (topic != "") {
        var message = new Messaging.Message(payload);
        message.qos = Number(qos);
        message.destinationName = topic;
        message.retained = retain;

        this.clientOptions.willMessage = message;
    }
};

WebSocketClient.prototype.connect = function(username, password, keepAlive, useSsl, cleanSession, callbacks) {
    this.client = new Messaging.Client(this.host, Number(this.port), this.clientId);
    this.client.onConnectionLost = (callbacks.onConnectionLost) ? (callbacks.onConnectionLost) : this.onConnectionLost;
    this.client.onMessageArrived = (callbacks.onMessageArrived) ? (callbacks.onMessageArrived) : this.onMessageArrived;

    if(username != "" && password != "") {
        this.clientOptions.userName = username;
        this.clientOptions.password = password;
    }
    this.clientOptions.keepAliveInterval =  Number(keepAlive);
    this.clientOptions.cleanSession = cleanSession;
    this.clientOptions.useSSL = useSsl;
    this.clientOptions.onSuccess = (callbacks.onSuccess) ? (callbacks.onSuccess) : this.onSuccess;
    this.clientOptions.onFailure = (callbacks.onFailure) ? (callbacks.onFailure) : this.onFailure;

    this.client.connect(this.clientOptions);
};

WebSocketClient.prototype.disconnect = function() {
    try {
        this.client.disconnect();
    } catch(e) {
        console.log("Error on disconnect: " + e);
    }
};

WebSocketClient.prototype.subscribe = function(topic, qos) {
    this.client.subscribe(topic, { qos: Number(qos) });
};

WebSocketClient.prototype.unsubscribe = function(topic) {
    this.client.unsubscribe(topic);
};

WebSocketClient.prototype.publish = function(topic, payload, qos, retain) {
    var message = new Messaging.Message(payload);
    message.destinationName = topic;
    message.qos = Number(qos);
    message.retained = retain;

    this.client.send(message);
};