(function () {
    "use strict";
    
    fluid.registerNamespace("colin");
    
    fluid.defaults("colin.veryVery", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        
        members: {
            snapshots: [undefined, undefined]
        },
        
        trackingInterval: 1.25,
        
        binarizeThreshold: 0.25,
        
        filterSpecs: [
            {
                funcName: "colin.veryVery.subtract"
            },
            {
                funcName: "colin.veryVery.grayscale"
            },
            {
                funcName: "colin.veryVery.binarize",
                parameters: {
                    threshold: 0.25
                }
            }
        ],
        
        components: {
            webcam: {
                type: "colin.webcam",
                container: "{that}.dom.webcam"
            },
            
            scheduler: {
                type: "flock.scheduler.async"
            }
        },
        
        listeners: {
            onCreate: [
                {
                    funcName: "colin.veryVery.scheduleMovementLogger",
                    args: [
                        "{that}.options.trackingInterval",
                        "{that}.scheduler",
                        "{that}.webcam",
                        "{that}.snapshots",
                        "{that}.dom.canvas.0",
                        "{that}.options.binarizeThreshold"
                    ]
                }
            ]
        },
        
        selectors: {
            canvas: "canvas",
            webcam: "#webcam"
        }
    });
    
    colin.veryVery.createOpaqueImageData = function (ctx, w, h) {
        var imageData = ctx.createImageData(w, h),
            data = imageData.data,
            i;
            
        for (i = 0; i < data.length; i += 4) {
            data[i + 3] = 255;
        }
        
        return imageData;
    };
    
    colin.veryVery.dataForImages = function (ctx, w, h, images) {
        var data = [],
            i,
            image;
            
        for (var i = 0; i < images.length; i++) {
            image = images[i];
            ctx.drawImage(image, 0, 0);
            data[i] = ctx.getImageData(0, 0, w, h);
        }
        
        return data;
    };
    
    colin.veryVery.subtract = function (ctx, workingData, imageData) {
        var outData = workingData.data,
            oneData = imageData[0].data,
            twoData = imageData[1].data;
        
        for (var i = 0; i < outData.length; i += 4) {
            for (var j = i; j < i + 3; j++) {
                outData[j] = oneData[j] - twoData[j];
            }
        }
        
        return workingData;
    };
    
    colin.veryVery.grayscale = function (ctx, workingData, imageData, parameters) {
        var outData = workingData.data,
            i,
            r, g, b,
            luminance,
            j;
        
        for (i = 0; i < outData.length; i += 4) {
            r = outData[i];
            g = outData[i + 1];
            b = outData[i + 2];
            luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722);
            
            for (j = i; j < i + 3; j++) {
                outData[j] = luminance;
            }
        }
        
        return workingData;
    };
    
    colin.veryVery.binarize = function (ctx, workingData, imageData, parameters) {
        var outData = workingData.data,
            threshold = Math.round(parameters.threshold * 255), // Scale to an eight bit value.
            i,
            j,
            pixelSum,
            val;
        
        for (i = 0; i < outData.length; i += 4) {
            pixelSum = 0;
            for (j = i; j < i + 3; j++) {
                pixelSum += outData[j];
                outData[j] = 0;
            }
            val = pixelSum / 3;
            val = val >= threshold ? 255 : 0;
            
            for (j = i; j < i + 3; j++) {
                outData[j] = val;
            }
        }
        
        return workingData;
    };
    
    colin.veryVery.differenceFactor = function (workingData) {
        var outData = workingData.data,
            numPixels = (workingData.width * workingData.height) / 4, // rgba
            sum = 0,
            i,
            j;
            
        for (i = 0; i < outData.length; i += 4) {
            sum += outData[i] / 255;
        }
        
        return sum / numPixels;
    };
    
    colin.veryVery.process = function (ctx, w, h, imageData, filterSpecs) {
        var workingData = imageData[0],
            parameters,
            i,
            filterSpec;
                    
        for (i = 0; i < filterSpecs.length; i++) {
            filterSpec = filterSpecs[i];
            fluid.invokeGlobalFunction(filterSpec.funcName, [ctx, workingData, imageData, filterSpec.parameters]);
            ctx.clearRect(0, 0, w, h);
            ctx.putImageData(workingData, 0, 0);
        }
        
        return workingData;
    };

    // Note: this was cut and pasted from the above functions for performance reasons.
    colin.veryVery.subtractAndBinarize = function (earlier, later, working, threshold) {
        var oneData = earlier.data,
            twoData = later.data,
            outData = working.data,
            i,
            ri, gi, bi,
            r, g, b,
            luminance,
            binarized,
            j;

        for (i = 0; i < outData.length; i += 4) {
            ri = i;
            gi = i + 1;
            bi = i + 2;
            
            // Subtract.
            r = oneData[ri] - twoData[ri];
            g = oneData[gi] - twoData[gi];
            b = oneData[bi] - twoData[bi];
        
            // Convert to grayscale.
            luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722);
            
            // Binarize.
            binarized = luminance >= threshold ? 255 : 0;
            
            // Output the binarized value for each channel.
            outData[ri] = binarized;
            outData[gi] = binarized;
            outData[bi] = binarized;
        }
        
        return working;
    };
    
    colin.veryVery.scheduleMovementLogger = function (interval, scheduler, webcam, snapshots, canvas, binarizeThreshold) {
        var secs = 1 / interval,
            ctx = canvas.getContext("2d"),
            w = canvas.width,
            h = canvas.height,
            scaledThreshold = Math.round(binarizeThreshold * 255);
        
        scheduler.repeat(secs, function () {
            colin.veryVery.logWebcamMovement(webcam, snapshots, ctx, w, h, scaledThreshold);
        });
    };
    
    colin.veryVery.logWebcamMovement = function (webcam, snapshots, ctx, w, h, threshold) {
        var earlier = snapshots[0] = snapshots[1],
            later = snapshots[1] = webcam.snapshot(ctx, w, h),
            workingData;
        
        if (earlier && later) {
            workingData = colin.veryVery.subtractAndBinarize(earlier, later, earlier, threshold);
            ctx.clearRect(0, 0, w, h);
            ctx.putImageData(workingData, 0, 0);
            console.log(colin.veryVery.differenceFactor(workingData));
        }
    };
    
}());
