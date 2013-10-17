(function () {

    "use strict";

    var dgram = require("dgram"),
        net = require("net"),
        fluid = require("infusion"),
        colin = fluid.registerNamespace("colin");


    fluid.defaults("colin.netComponent", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        
        host: "127.0.0.1",
        port: 65534
    });
    
    fluid.defaults("colin.udpSocketComponent", {
        gradeNames: ["colin.netComponent", "autoInit"],

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
    
    fluid.defaults("colin.bufferedMessageSender", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        
        maxMessageLength: 4,
        
        members: {
            msgBuffer: {
                expander: {
                    funcName: "colin.bufferedMessageSender.createMessageBuffer",
                    args: ["{that}.options.maxMessageLength"]
                }
            }
        },
        
        invokers: {
            sendFloat: {
                funcName: "colin.bufferedMessageSender.sendFloat",
                args: ["{arguments}.0", "{that}.msgBuffer", "{that}"]
            }
        }
    });
    
    colin.bufferedMessageSender.createMessageBuffer = function (len) {
        return new Buffer(len);
    };
    
    colin.bufferedMessageSender.sendFloat = function (value, buffer, that) {
        buffer.writeFloatLE(value, 0);
        console.log("Sending value: ", value);
        that.send(buffer);
    };
    
    /**************
     * UDP Client *
     **************/
    
    fluid.defaults("colin.udpClient", {
        gradeNames: ["fluid.eventedComponent", "colin.bufferedMessageSender", "colin.udpSocketComponent", "autoInit"],
    
        invokers: {
            send: {
                funcName: "colin.udpClient.send",
                args: ["{that}", "{arguments}.0"]
            },
            
            close: {
                funcName: "colin.udpClient.close",
                args: ["{that}.socket"]
            }
        },
    
        listeners: {
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

    colin.udpClient.close = function (socket) {
        socket.close();
    };

    colin.udpClient.send = function (that, message) {
        that.socket.send(message, 0, message.length, that.options.port, that.options.host, function (err, bytes) {
            if (err) {
                that.events.onError.fire(err);
                return;
            }
    
            that.events.onResponse.fire(bytes);
        });
    };


    /**************
     * UDP Server *
     **************/
    
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
                args: ["Server listening at", "{arguments}.1", ":", "{arguments}.0"]
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
    
    
    /**************
     * TCP Client *
     **************/
    fluid.defaults("colin.tcpClient", {
        gradeNames: ["fluid.eventedComponent", "colin.bufferedMessageSender", "colin.netComponent", "autoInit"],
        
        socketType: "tcp4",
        
        members: {
            socket: {
                expander: {
                    funcName: "colin.tcpClient.createSocket",
                    args: ["{that}.options.socketType"]
                }
            }
        },
        
        invokers: {
            send: {
                funcName: "colin.tcpClient.send",
                args: ["{arguments}.0", "{that}.socket"]
            }
        },
        
        events: {
            onConnect: null
        },
        
        listeners: {
            onCreate: [
                {
                    "this": "{that}.socket",
                    method: "connect",
                    args: ["{that}.options.port", "{that}.options.host", "{that}.events.onConnect.fire"]
                }
            ]
        }
    });
    
    colin.tcpClient.createSocket = function (type) {
        return new net.Socket({
            type: type
        });
    };
    
    colin.tcpClient.send = function (buffer, socket) {
        socket.write(buffer);
    };
    
    
    /**************
     * TCP Server *
     **************/
    
    fluid.defaults("colin.tcpServer", {
        gradeNames: ["fluid.eventedComponent", "colin.netComponent", "autoInit"],
        
        members: {
            server: {
                expander: {
                    "this": net,
                    method: "createServer"
                }
            }
        },
        
        events: {
            onListening: null,
            onConnection: null,
            onMessage: null,
            onError: null,
            onClose: null
        },
        
        listeners: {
            onCreate: [
                {
                    "this": "{that}.server",
                    method: "on",
                    args: ["connection", "{that}.events.onConnection.fire"]
                },
                {
                    "this": "{that}.server",
                    method: "on",
                    args: ["error", "{that}.events.onError.fire"]
                },
                {
                    "this": "{that}.server",
                    method: "on",
                    args: ["connection", "{that}.events.onClose.fire"]
                },
                {
                    "this": "{that}.server",
                    method: "on",
                    args: ["listening", "{that}.events.onListening.fire"]
                },
                {
                    "this": "{that}.server",
                    method: "listen",
                    args: ["{that}.options.port"]
                }
            ],
            
            onConnection: {
                funcName: "colin.tcpServer.bindConnectionSocket",
                args: ["{that}", "{arguments}.0"]
            },
            
            onError: {
                "this": console,
                method: "log",
                args: ["{arguments}.0"]
            }
        }
    });
    
    colin.tcpServer.bindConnectionSocket = function (that, socket) {
        // TODO: Handle TCP packets properly.
        socket.on("data", that.events.onMessage.fire);
    };

    // Monkey patching to preserve Node Buffer objects during Infusion's expansion/merging process.
    fluid.isPlainObject = function (totest) {
        var string = Object.prototype.toString.call(totest);
        return string === "[object Array]" || 
            (string === "[object Object]" && 
                !(totest instanceof Buffer) && 
                !(totest instanceof dgram.Socket) && 
                !(totest instanceof net.Server) &&
                !(totest instanceof net.Socket));
    };

}());
