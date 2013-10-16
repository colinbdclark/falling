"use strict";

var fs = require("fs"),
    exec = require("child_process").exec,
    dgram = require("dgram"),
    FreeImage = require("node-image").Image,
    fluid = require("infusion");

fluid.defaults("colin.udpClient", {
    gradeNames: ["fluid.eventedComponent", "autoInit"],
    
    host: "",
    port: 65534,
    maxMessageLength: 4,
    
    members: {
        socket: {
            expander: {
                "this": dgram,
                method: "createSocket",
                args: ["udp4"]
            }
        },
        
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
        ]
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
        socket.send(message, 0, message.length, that.options.host, that.options.port, function (err, bytes) {
            if (err) {
                that.events.onError.fire(err);
                return;
            }
        
            that.events.onResponse.fire(bytes);
        });
    };
    
    that.sendFloat = function (value) {
        that.buffer.writeFloatLE(value, 0);
        that.send(that.buffer);
    };
};

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
            expander: "colin.veryVery.snapshotter.getNumPixels",
            args: ["{that}.options.imageDef.width", "{that}.options.imageDef.height"]
        },
        
        earlierImg: undefined,
        laterImg: undefined
    },

    components: {
        processor: {
            type: "colin.veryVery.movementProcessor"
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
            {
                "this": console,
                method: "log",
                args: ["{arguments}.0"]
            }
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
                    // TODO: Better parameterization of 
                    var result = that.processor.processGreyscale(earlierImg.buffer, laterImg.buffer);
                    that.outputter.output(whitePixels / that.numPixels);
                }
            });
        });
    };
    
};


fluid.defaults("colin.veryVery.movementDetector", {
    gradeNames: ["fluid.eventedComponent", "autoInit"],
    
    threshold: Math.round(0.1 * 255)
});

fluid.defaults("colin.veryVery.movementDetector.grey", {
    gradeNames: ["colin.veryVery.movementDetector", "autoInit"],
        
    listeners: {
        onCreate: [
            {
                funcName: "colin.veryVery.movementDetector.grey.bindMethods",
                args: ["{that}"]
            }
        ]
    }
});

colin.veryVery.movementDetector.grey.bindMethods = function (that) {
    that.process = function (earlier, later) {
        var threshold = that.options.threshold,
            whitePixels = 0,
            lum;

        for (var i = 0; i < earlier.length; i++) {
            lum = earlier.readUInt8(i) - later.readUInt8(i);
            if (lum >= threshold) {
                whitePixels++;
            }
        }

        return whitePixels;
    };
};


fluid.defaults("colin.veryVery.movementDetector.colour", {
    gradeNames: ["colin.veryVery.movementDetector", "autoInit"],
    
    channelOffset: 3,
    
    listeners: {
        onCreate: [
            {
                funcName: "colin.veryVery.movementDetector.colour.bindMethods",
                args: ["{that}"]
            }
        ]
    }
};

colin.veryVery.movementDetector.colour.bindMethods = function (that) {
    that.process = function (earlier, later) {
        var offset = that.options.channelOffset,
            threshold = that.options.threshold,
            whitePixels = 0,
            ri, bi, gi,
            r, g, b,
            lum;
    
        for (var i = 0; i < earlier.length; i += offset) {
            ri = i;
            gi = i + 1;
            bi = i + 2;
    
            r = earlier.readUInt8(ri) - later.readUInt8(ri);
            g = earlier.readUInt8(gi) - later.readUInt8(gi);
            b = earlier.readUInt8(bi) - later.readUInt8(bi);

            // Convert to grayscale.
            lum = (r * 0.2126 + g * 0.7152 + b * 0.0722);
 
            // Binarize.
            if (lum >= threshold) {
                whitePixels++;
            }
        }
    
        return whilePixels;
    };
};

fluid.defaults("colin.veryVery.udpOutputter", {
    gradeNames: ["fluid.eventedComponent", "autoInit"],
    
    components: {
        udpClient: {
            type: "colin.udpClient",
            options: {
                maxMessageLength: 4,
                host: "192.168.1.11",
                port: 65534
            }
        }
    }
    
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
        that.udpClient.setFloat(value);
    };
};

var snapshotter = colin.veryVery.snapshotter.cmd();
snapshotter.snap();
