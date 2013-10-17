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
            sendFloat: "colin.bufferedMessageSender.sendFloat",
            args: ["{arguments}.0", "{that}"]
        }
    });
    
    colin.bufferedMessageSender.createMessageBuffer = function (len) {
        return new Buffer(len);
    };
    
    colin.bufferedMessageSender.sendFloat = function (value, that) {
        var buffer = that.msgBuffer;
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
    
    
    /*
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
    */
    
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
                    funcName: "colin.tcpServer.bind",
                    args: ["{that}"]
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
    
    colin.tcpServer.bind = function (that) {
        that.server.on("connection", that.events.onConnection.fire);
        that.server.on("error", that.events.onError.fire);
        that.server.on("close", that.events.onClose.fire);
        
        that.server.listen(that.options.port, that.events.onListening.fire);
    };
    
    colin.tcpServer.bindConnectionSocket = function (that, socket) {
        socket.on("data", function (buffer) {
            console.log(buffer);
        });
    };
    
    
    
    /*
var net = require('net');
var server = net.createServer(function(c) { //'connection' listener
  console.log('server connected');
  c.on('end', function() {
    console.log('server disconnected');
  });
  c.write('hello\r\n');
  c.pipe(c);
});
server.listen(8124, function() { //'listening' listener
  console.log('server bound');
});
    */
    /*
var net = require('net');
var client = net.connect({port: 8124},
    function() { //'connect' listener
  console.log('client connected');
  client.write('world!\r\n');
});
client.on('data', function(data) {
  console.log(data.toString());
  client.end();
});
client.on('end', function() {
  console.log('client disconnected');
});
    */
    

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
