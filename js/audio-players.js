/*global fluid, flock*/

(function () {
    "use strict";

    flock.init({
        bufferSize: 4096,
        chans: 4
    });

    fluid.defaults("colin.falling.audio", {
        gradeNames: "fluid.modelComponent",

        components: {
            bufferLoader: {
                type: "colin.falling.bufferLoader",
                options: {
                    listeners: {
                        afterBuffersLoaded: [
                            "{flock.enviro}.play()"
                        ]
                    }
                }
            },

            band: {
                type: "colin.falling.band"
            },

            motionTarget: {
                type: "windvane.quadraphonicMotionTarget"
            }
        }
    });

    fluid.defaults("colin.falling.audio.singleCamera", {
        gradeNames: "colin.falling.audio",

        components: {
            motionTarget: {
                type: "windvane.stereoToQuadMotionTarget"
            }
        }
    });
}());
