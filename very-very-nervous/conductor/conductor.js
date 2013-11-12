(function () {
    "use strict";

    var fluid = require("infusion"),
        loader = fluid.getLoader(__dirname),
        colin = fluid.registerNamespace("colin");    

    loader.require("../shared/net.js");

    fluid.defaults("colin.conductor", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        // TODO: Move this to somewhere shared.
        messageMap: {
            "start": 1.0,
            "stop": 0.0
        },
        
        invokers: {
            signal: {
                funcName: "colin.conductor.signal",
                args: ["{that}.options.messageMap", "{arguments}.0", "{leftClient}", "{rightClient}"]
            }
        },
        
        components: {
            leftClient: {
                type: "colin.conductor.client",
                options: {
                    host: "192.168.0.22",
                    listeners: {
                        onError: "{conductor}.events.onError"
                    }
                }
            },

            rightClient: {
                type: "colin.udpClient",
                options: {
                    host: "192.168.0.44",
                    listeners: {
                        onError: "{conductor}.events.onError"
                    }
                }
            }
        },
        
        events: {
            onSignal: null,
            onError: null,
            onResponse: {
                events: {
                    leftResponse: "{leftClient}.events.onResponse",
                    rightResponse: "{rightClient}.events.onResponse",
                },
                args: ["{arguments}.leftResponse.0", "{arguments}.rightResponse.0"]
            }
        },
        
        listeners: {
            onResponse: [
                {
                    "this": console,
                    method: "log",
                    args: ["Recieved responses from all performers. ", "{arguments}.0", "{arguments}.1"]
                },
                {
                    "this": process,
                    method: "exit",
                    args: [0]
                }
            ],
            
            onError: [
                {
                    "this": console,
                    method: "log",
                    args: ["Recieved an error from a performer: ", "{arguments}.0"]
                },
                {
                    "this": process,
                    method: "exit",
                    args: [1]
                }
            ]
        }
    });
    
    // TODO: This should be an event and registered declaratively.
    colin.conductor.signal = function (messageMap, message, leftClient, rightClient) {
        var val = messageMap[message];
        
        if (val === undefined) {
            throw new Error("The specified message is unrecognized and could not be sent.");
        }
        
        leftClient.sendFloat(val);
        rightClient.sendFloat(val);
    };
    
    fluid.defaults("colin.conductor.client", {
        gradeNames: ["colin.udpClient", "autoInit"],

        maxMessageLength: 4,
        port: 65533
    });
    
    
    var message = process.argv[2],
        conductor = colin.conductor();
    
    if (message) {
        conductor.signal(message);
    } else {
        console.error("Please specify a message to send to the performer instances.");
    }

}());
