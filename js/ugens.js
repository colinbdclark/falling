(function () {
    "use strict";

    var fluid = require("infusion"),
        flock = fluid.require("flocking"),
        colin = fluid.registerNamespace("colin");

    fluid.registerNamespace("colin.ugen");

    // Cut and pasted from flocking-ugens.
    colin.ugen.movementPlayer = function (inputs, output, options) {
        var that = flock.ugen(inputs, output, options);

        // Start with a zeroed buffer, since the buffer input may be loaded asynchronously.
        that.buffer = new Float32Array(that.output.length);

        that.gen = function (numSamps) {
            var m = that.model,
                out = that.output,
                trigger = that.inputs.trigger.output[0],
                reset = that.inputs.reset.output[0],
                chan = that.inputs.channel.output[0],
                speedInc = that.inputs.speed.output[0],
                source = that.buffer,
                bufIdx = m.idx,
                bufLen = source.length,
                loop = that.inputs.loop.output[0],
                buffers = that.options.audioSettings.buffers,
                i;

            // If the channel has changed, update the buffer we're reading from.
            if (m.channel !== chan) {
                m.channel = chan;
                if (buffers[m.name]) {
                    that.buffer = source = buffers[m.name][chan];
                }
            }

            if (trigger > 0.0 && m.prevTrig <= 0.0) {
                bufIdx = (that.buffer.length * reset) | 0;
            }
            m.prevTrig = trigger;

            for (i = 0; i < numSamps; i++) {
                if (bufIdx >= bufLen) {
                    if (loop > 0) {
                        bufIdx = 0;
                    } else {
                        out[i] = 0.0;
                        continue;
                    }
                }

                out[i] = source[Math.round(bufIdx)];
                bufIdx += speedInc;
            }

            m.idx = bufIdx;
        };

        that.onBufferReady = function () {
            that.model.idx = 0;
        };

        that.onInputChanged = function (inputName) {
            var m = that.model,
                inputs = that.inputs;

            if (m.bufDef !== that.inputs.buffer || inputName === "buffer") {
                flock.buffer.resolveBuffer(that);
            }

            flock.onMulAddInputChanged(that);
        };

        that.onInputChanged();
        return that;
    };

    flock.ugenDefaults("colin.ugen.movementPlayer", {
        rate: "audio",
        inputs: {
            channel: 0,
            loop: 0.0,
            speed: 1.0,
            reset: 0.0,
            trigger: 0.0
        },
        ugenOptions: {
            model: {
                idx: 0,
                channel: undefined,
                prevTrig: 0.0
            }
        }
    });

}());
