(function () {
    
    "use strict";

    var fluid = require("infusion"),
        colin = fluid.registerNamespace("colin"),
        fs = require("fs"),
        proc = require("child_process"),
        FreeImage = require("node-image").Image;

    fluid.defaults("colin.veryVery.snapshotter.cmd", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
    
        imageDef: {
            width: 640,
            height: 480,
            device: "/dev/video0",
            filename: "images/very-very-snapshot.pgm"
        },
    
        //cmd: "/usr/bin/streamer",
        //argString: "-c %device -q -s %widthx%height -f pgm -o %filename",

        cmd: "/usr/bin/fswebcam",
        argString: "-q -d %device -r %widthx%height --greyscale %filename",

        members: {
            execArgs: {
                expander: {
                    funcName: "fluid.stringTemplate",
                    args: ["{that}.options.argString", "{that}.options.imageDef"]
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
                type: "colin.veryVery.netOutputter"
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
        that.halfPixels = that.numPixels / 2;
        that.args = that.execArgs.split(" ");

        that.snap = function () {
            var filename = that.options.imageDef.filename;
            var capture = proc.spawn(that.options.cmd, that.args);
 
            capture.on("close", function (code) {
                if (code != 0) {
                    console.log("Error capturing snapshot.", error);
                }
        
                fs.readFile(filename, function (err, fileData) {
                    if (err) {
                        that.events.onError.fire(err);
                    }
                
                    that.earlierImg = that.laterImg;
            
                    // Schedule the next snapshot while we're reading the current image.
                    setTimeout(that.snap, 200);
            
                    that.laterImg = FreeImage.loadFromMemory(fileData);
                    if (that.earlierImg && that.laterImg) {
                        var result = that.processor.processStereo(that.earlierImg.buffer, that.laterImg.buffer);
                        result[0] = result[0] / that.halfPixels;
                        result[1] = result[1] / that.halfPixels;
                        that.outputter.output(result);
                    }
                });
            });
        };
    };
    


    fluid.defaults("colin.veryVery.netOutputter", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
    
        components: {
            client: {
                type: "colin.udpClient",
                options: {
                    maxMessageLength: 8,
                    host: "127.0.0.1",
                    port: 65534
                }
            }
        },
    
        listeners: {
            onCreate: [
                {
                    funcName: "colin.veryVery.netOutputter.bindMethods",
                    args: ["{that}"]
                }
            ]
        }
    });

    colin.veryVery.netOutputter.bindMethods = function (that) {
        that.output = function (value) {
            that.client.sendFloats(value);
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
