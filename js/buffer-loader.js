/*global fluid, colin*/

(function () {
    "use strict";

    fluid.defaults("colin.falling.bufferLoader", {
        gradeNames: "flock.bufferLoader",

        bufferDefs: [
            {
                id: "guitar",
                url: "../../audio/Guitar.wav"
            },
            {
                id: "piano",
                url: "../../audio/Piano.wav"
            },
            {
                id: "uke",
                url: "../../audio/Uke.wav"
            },
            {
                id: "vox",
                url: "../../audio/Vox.wav"
            }
        ],

        listeners: {
            afterBuffersLoaded: [
                // TODO: Remove this when triggerBuffers is fixed.
                {
                    funcName: "colin.falling.bufferLoader.updateBufferUGens",
                    args: ["{band}"]
                }
            ]
        }
    });

    colin.falling.bufferLoader.updateBufferUGens = function (band) {
        fluid.each(band.getSynths(), function (synth) {
            synth.get("player").onInputChanged();
        });
    };
}());
