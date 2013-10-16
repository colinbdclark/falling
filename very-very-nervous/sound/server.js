"use strict";

var flock = require("flocking");

flock.init({
    bufferSize: 128,
    rates: {
        audio: 22050
    }
});

var synth = flock.synth({
    synthDef: {
        id: "carrier",
        ugen: "flock.ugen.sinOsc",
        freq: 220,
        mul: 0.5
    }
});

synth.play();

function listen (whitePixels) {
    synth.set("carrier.freq", ((whitePixels / numPixels) * 11025) + 60);
}
