var fs = require("fs"),
    exec = require("child_process").exec,
    FreeImage = require("node-image").Image
    flock = require("flocking");

var w = 640,
    h = 480,
    numPixels = w * h,
    threshold = Math.round(0.25 * 255),
    filename = "images/very-very-snapshot.pgm",
    cmd = "streamer -s " + w + "x" + h + " -f pgm -o " + filename,
    earlierImg,
    laterImg;

var synth = flock.synth({
    synthDef: {
        id: "carrier",
        ugen: "flock.ugen.sinOsc",
        freq: 220,
        mul: 0.5
    }
});

function snap() {
    exec(cmd, function (error) {
        if (error) {
            console.log("Error capturing snapshot.", error);
        }
        
        laterBuf = fs.readFile(filename, function (err, fileData) {
            if (err) {
                throw err;
            }
            earlierImg = laterImg;
            
            // Schedule the next snapshot while we're reading the current image.
            setTimeout(snap, 500);
            
            laterImg = FreeImage.loadFromMemory(fileData);
            if (earlierImg && laterImg) {
                var whitePixels = trackMovementGrey(earlierImg.buffer, laterImg.buffer, threshold);
                //console.log("Movement factor:", whitePixels / numPixels);
                synth.set("carrier.freq", ((whitePixels / numPixels) * 11025) + 60);
            }
        });
    });
}

function trackMovementColour(earlier, later, threshold) {
    var whitePixels = 0,
        ri, bi, gi,
        r, g, b,
        lum;
    
    for (var i = 0; i < earlier.length; i += 3) {
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
}

function trackMovementGrey(earlier, later, threshold) {
    var whitePixels = 0,
        lum;

    for (var i = 0; i < earlier.length; i++) {
        lum = earlier.readUInt8(i) - later.readUInt8(i);
        if (lum >= threshold) {
            whitePixels++;
        }
    }

    return whitePixels;
}


flock.init({
    bufferSize: 128,
    rates: {
        audio: 22050
    }
});

synth.play();

snap();
