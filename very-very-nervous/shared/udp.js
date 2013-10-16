(function () {

    "use strict";

    var dgram = require("dgram"),
        fluid = require("infusion"),
        colin = fluid.registerNamespace("colin");

    fluid.defaults("colin.udpSocketComponent", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        
        host: "127.0.0.1",
        port: 65534,
        
        members: {
            socket: {
                expander: {
                    "this": dgram,
                    method: "createSocket",
                    args: ["udp4"]
                }
            }
        }
    });
    
    
    /**********
     * Client *
     **********/
    
    fluid.defaults("colin.udpClient", {
        gradeNames: ["fluid.eventedComponent", "colin.udpSocketComponent", "autoInit"],
    
        maxMessageLength: 4,
    
        members: {
            msgBuffer: {
                expander: {
                    funcName: "colin.udpClient.createMessageBuffer",
                    args: ["{that}.options.maxMessageLength"]
                }
            }
        },
    
        invokers: {
            close: {
                funcName: "colin.udpClient.close",
                args: ["{that}.socket"]
            }
        },
    
        listeners: {
            onCreate: [
                {
                    funcName: "colin.udpClient.bindMethods",
                    args: ["{that}"]
                }
            ],
            
            onError: {
                "this": console,
                method: "log",
                args: ["{arguments}.0"]
            }
        },
    
        events: {
            onError: null,
            onResponse: null
        }
    });

    colin.udpClient.createMessageBuffer = function (len) {
        return new Buffer(len);
    };

    colin.udpClient.close = function (socket) {
        socket.close();
    };

    colin.udpClient.bindMethods = function (that) {
        that.send = function (message) {
            console.log(that.options.host, ":", that.options.port);
            that.socket.send(message, 0, message.length, that.options.port, that.options.host, function (err, bytes) {
                if (err) {
                    that.events.onError.fire(err);
                    return;
                }
        
                that.events.onResponse.fire(bytes);
            });
        };
    
        that.sendFloat = function (value) {
            var buffer = that.msgBuffer;
            buffer.writeFloatLE(value, 0);
            console.log("sending value: ", value);
            that.send(buffer);
        };
    };


    /**********
     * Server *
     **********/
    
    fluid.defaults("colin.udpServer", {
        gradeNames: ["fluid.eventedComponent", "colin.udpSocketComponent", "autoInit"],

        events: {
            onListening: null,
            onMessage: null,
            onError: null
        },
        
        listeners: {
            onCreate: [
                {
                    funcName: "colin.udpServer.bind",
                    args: ["{that}"]
                }
            ],
            
            onListening: {
                "this": console,
                method: "log",
                args: ["Server listening at", "{arguments}.0", ":", "{arguments.1"]
            },
            
            onMessage: {
                "this": console,
                method: "log",
                args: ["Got message", "{arguments}.0", "{arguments}.1"]
            },
            
            onError: {
                "this": console,
                method: "log",
                args: ["{arguments}.0"]
            }
        }
    });
    
    colin.udpServer.bind = function (that) {
        that.socket.on("error", that.events.onError.fire);
        that.socket.on("listening", function () {
            var address = that.socket.address();
            that.events.onListening.fire(address.port, address.address)
        });
        that.socket.on("message", that.events.onMessage.fire);
        
        that.socket.bind(that.options.port);
    };
    
    
    // Monkey patching to preserve Node Buffer objects during Infusion's expansion/merging process.
    fluid.isPlainObject = function (totest) {
        var string = Object.prototype.toString.call(totest);
        return string === "[object Array]" || 
            (string === "[object Object]" && !(totest instanceof Buffer) && !(totest instanceof dgram.Socket));
    };
}());
