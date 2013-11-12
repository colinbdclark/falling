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
                funcName: "{that}.events.onSignal.fire",
                args: ["{arguments}.0"]
            }
        },
        
        component: {
            leftClient: {
                type: "colin.conductor.client",
                options: {
                    host: "192.168.0.22"
                }
            },

            rightClient: {
                type: "colin.udpClient",
                options: {
                    host: "192.168.0.44"
                }
            }
        },
        
        events: {
            onResponse: {
                events: {
                    leftResponse: "{leftClient}.events.onResponse",
                    rightResponse: "{rightClient}.events.onReponse",
                    args: ["{arguments}.leftResponse.0", "{arguments}.rightResponse.0"]
                }
            }
        },
        
        listeners: {
            onResponse: {
                "this": process,
                method: "exit",
                args: [0]
            },
            
            onError: {
                "this": process,
                method: "exit",
                args: [1]
            }
        }
    });
    
    fluid.defaults("colin.conductor.client", {
        gradeNames: ["colin.udpClient", "autoInit"],

        maxMessageLength: 4,
        port: 65533,
        
        listeners: {
            "{conductor}.events.onSignal": {
                funcName: "{that}.sendFloat",
                args: ["{arguments}.0"]
            }
        }
    });
    
    
    var message = process.argv[2],
        conductor = colin.conductor();
        
    conductor.signal(message);

}());
