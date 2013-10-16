(function () {
    
    "use strict";

    var fluid = require("infusion"),
        colin = fluid.registerNamespace("colin"),
        fs = require("fs"),
        exec = require("child_process").exec,
        FreeImage = require("node-image").Image;

    fluid.defaults("colin.veryVery.snapshotter.cmd", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
    
        imageDef: {
            width: 640,
            height: 480,
            filename: "images/very-very-snapshot.pgm"
        },
    
        cmd: "streamer -q -s %widthx%height -f pgm -o %filename",
    
        members: {
            execCmd: {
                expander: {
                    funcName: "fluid.stringTemplate",
                    args: ["{that}.options.cmd", "{that}.options.imageDef"]
                }
            },
        
            numPixels: {
                expander: {
                    funcName: "colin.veryVery.snapshotter.cmd.getNumPixels",
                    args: ["{that}.options.imageDef.width", "{that}.options.imageDef.height"]
                }
            },
        
            earlierImg: undefined,
            laterImg: undefined
        },

        components: {
            processor: {
                type: "colin.veryVery.movementDetector.grey"
            },
        
            outputter: {
                type: "colin.veryVery.udpOutputter"
            }
        },
    
        listeners: {
            onCreate: [
                {
                    funcName: "colin.veryVery.snapshotter.cmd.bindMethods",
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
            onError: null
        }
    });

    colin.veryVery.snapshotter.cmd.getNumPixels = function (w, h) {
        return w * h;
    };

    colin.veryVery.snapshotter.cmd.bindMethods = function (that) {
        that.snap = function () {
            var filename = that.options.imageDef.filename;
        
            exec(that.execCmd, function (error) {
                if (error) {
                    console.log("Error capturing snapshot.", error);
                }
        
                fs.readFile(filename, function (err, fileData) {
                    if (err) {
                        that.events.onError.fire(err);
                    }
                
                    that.earlierImg = that.laterImg;
            
                    // Schedule the next snapshot while we're reading the current image.
                    setTimeout(that.snap, 500);
            
                    that.laterImg = FreeImage.loadFromMemory(fileData);
                    if (that.earlierImg && that.laterImg) {
                        var result = that.processor.process(that.earlierImg.buffer, that.laterImg.buffer);
                        that.outputter.output(result / that.numPixels);
                    }
                });
            });
        };
    };
    


    fluid.defaults("colin.veryVery.udpOutputter", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
    
        components: {
            udpClient: {
                type: "colin.udpClient",
                options: {
                    maxMessageLength: 4,
                    host: "192.168.1.16",
                    port: 65534
                }
            }
        },
    
        listeners: {
            onCreate: [
                {
                    funcName: "colin.veryVery.udpOutputter.bindMethods",
                    args: ["{that}"]
                }
            ]
        }
    });

    colin.veryVery.udpOutputter.bindMethods = function (that) {
        that.output = function (value) {
            that.udpClient.sendFloat(value);
        };
    };

    fluid.defaults("colin.veryVery.consoleOutputter", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
    
        listeners: {
            onCreate: [
                {
                    funcName: "colin.veryVery.consoleOutputter.bindMethods",
                    args: ["{that}"]
                }
            ]
        }
    });

    colin.veryVery.consoleOutputter.bindMethods = function (that) {
        that.output = function (value) {
            console.log("Movement factor:", value);
        };
    };
    
}());
