(function () {
    
    "use strict";

    var fluid = require("infusion"),
        colin = fluid.registerNamespace("colin");

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
        
        // TODO: Horrendous cut and pastage.
        that.processStereo = function (earlier, later) {
            var threshold = that.options.threshold,
                leftWhitePixels = 0,
                rightWhitePixels = 0,
                // TODO: Hardcoded.
                w = 640,
                halfWidth = 320,
                h = 480,
                // ---------------
                leftStart,
                rightStart,
                rightEnd,
                lum;

            for (var rowIdx = 0; rowIdx < h; rowIdx++) {
                leftStart = rowIdx * w;
                rightStart = leftStart + halfWidth;
                rightEnd = rightStart + halfWidth;
                
                for (var leftIdx = leftStart; leftIdx < rightStart; leftIdx++) {
                    lum = earlier.readUInt8(leftIdx) - later.readUInt8(leftIdx);
                    if (lum >= threshold) {
                        leftWhitePixels++;
                    }
                }
                
                for (var rightIdx = rightStart; rightIdx < rightEnd; rightIdx++) {
                    lum = earlier.readUInt8(rightIdx) - later.readUInt8(rightIdx);
                    if (lum >= threshold) {
                        rightWhitePixels++;
                    }
                    
                }
            }
            
            return [leftWhitePixels, rightWhitePixels];
        }
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
    });

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
}());
