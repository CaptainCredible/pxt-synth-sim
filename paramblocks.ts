/**
 * Blocks that set one synth parameter, in three styles to compare (toolbox subcategories):
 *   Parameters A: grouped blocks, one per kind of value (levels, times, pitch, speeds, shapes)
 *   Parameters B: one block per parameter
 *   Parameters C: one block with a parameter dropdown; its slider range and units follow the
 *                 chosen parameter (target field editor "dependentslider",
 *                 pxt-microbit-notam/fieldeditors/field_dependentslider.ts)
 * All three take values in the same units as "set up sound" and convert them with paramToRaw.
 * Generated once by a script, then maintained by hand.
 */

enum SynthLevelParam {
    //% block="oscillator 1 level"
    Osc1Gain = 7,
    //% block="oscillator 2 level"
    Osc2Gain = 8,
    //% block="noise"
    Noise = 27,
    //% block="FM amount"
    OscFm = 9,
    //% block="pulse width 1"
    Osc1Pw = 3,
    //% block="PWM 1"
    Osc1Pwm = 5,
    //% block="pulse width 2"
    Osc2Pw = 4,
    //% block="PWM 2"
    Osc2Pwm = 6,
    //% block="sustain"
    EnvSustainLevel = 18,
    //% block="filter cutoff"
    Cutoff = 10,
    //% block="filter resonance"
    Resonance = 11,
    //% block="filter envelope amount"
    FilterEnvAmount = 13,
    //% block="filter key follow"
    FilterKeyFollow = 12,
    //% block="filter LFO amount"
    FilterLfoAmount = 14,
    //% block="vibrato depth (cents)"
    VibratoAmount = 25,
    //% block="volume"
    Gain = 21,
}

enum SynthTimeParam {
    //% block="attack"
    EnvAttackTime = 16,
    //% block="decay"
    EnvDecayTime = 17,
    //% block="release"
    EnvRelease = 19,
}

enum SynthPitchParam {
    //% block="oscillator 2 transpose"
    Osc2Transpose = 2,
    //% block="tune"
    Tune = 26,
}

enum SynthSpeedParam {
    //% block="LFO speed"
    LFOFreq = 22,
    //% block="vibrato speed"
    VibratoFreq = 24,
}

enum SynthShapeParam {
    //% block="oscillator 1 shape"
    Osc1Shape = 0,
    //% block="oscillator 2 shape"
    Osc2Shape = 1,
    //% block="LFO shape"
    LFOShape = 23,
}

enum SynthAnyParam {
    //% block="oscillator 1 level"
    Osc1Gain = 7,
    //% block="oscillator 2 level"
    Osc2Gain = 8,
    //% block="oscillator 2 transpose"
    Osc2Transpose = 2,
    //% block="tune"
    Tune = 26,
    //% block="noise"
    Noise = 27,
    //% block="FM amount"
    OscFm = 9,
    //% block="pulse width 1"
    Osc1Pw = 3,
    //% block="PWM 1"
    Osc1Pwm = 5,
    //% block="pulse width 2"
    Osc2Pw = 4,
    //% block="PWM 2"
    Osc2Pwm = 6,
    //% block="oscillator 1 shape"
    Osc1Shape = 0,
    //% block="oscillator 2 shape"
    Osc2Shape = 1,
    //% block="attack"
    EnvAttackTime = 16,
    //% block="decay"
    EnvDecayTime = 17,
    //% block="sustain"
    EnvSustainLevel = 18,
    //% block="release"
    EnvRelease = 19,
    //% block="volume envelope"
    AmpGate = 20,
    //% block="filter cutoff"
    Cutoff = 10,
    //% block="filter resonance"
    Resonance = 11,
    //% block="filter envelope amount"
    FilterEnvAmount = 13,
    //% block="filter key follow"
    FilterKeyFollow = 12,
    //% block="filter LFO amount"
    FilterLfoAmount = 14,
    //% block="filter type"
    FilterType = 15,
    //% block="LFO speed"
    LFOFreq = 22,
    //% block="vibrato speed"
    VibratoFreq = 24,
    //% block="vibrato depth"
    VibratoAmount = 25,
    //% block="LFO shape"
    LFOShape = 23,
    //% block="volume"
    Gain = 21,
}

namespace synthBlocks {
    /**
     * Converts a parameter value in block units (0-100 levels, ms, semitones, Hz, cents, or a choice)
     * to the value the synth engine expects. Same scaling as "set up sound".
     */
    export function paramToRaw(param: SynthParameter, value: number): number {
        const pct = Math.max(0, Math.min(100, value)) / 100;
        switch (param) {
            case SynthParameter.Osc1Shape:
            case SynthParameter.Osc2Shape:
            case SynthParameter.LFOShape:
            case SynthParameter.FilterType:
            case SynthParameter.AmpGate:
            case SynthParameter.Osc2Transpose:
            case SynthParameter.Tune:
                return value;
            case SynthParameter.Osc1Pw:
            case SynthParameter.Osc2Pw:
                return pct * 2 - 1;
            case SynthParameter.EnvAttackTime:
            case SynthParameter.EnvDecayTime:
            case SynthParameter.EnvRelease:
                return Math.max(0, value) / 1000;
            case SynthParameter.LFOFreq:
            case SynthParameter.VibratoFreq:
                return Math.max(0, value);
            case SynthParameter.VibratoAmount:
                return Math.max(0, value) / 100;
            default:
                return pct;
        }
    }

    /** Sets a parameter from a value in block units (see paramToRaw). */
    export function setParam(preset: SynthPreset, param: SynthParameter, value: number): void {
        orchestra.setParameter(preset, param, paramToRaw(param, value));
    }

    /**
     * Set a level-type parameter of a sound, 0-100 (pulse width: 50 = square; vibrato depth in cents).
     */
    //% blockId=synth_param_level
    //% block="set $preset $param to $value"
    //% param.defl=SynthLevelParam.Cutoff
    //% value.min=0 value.max=100 value.defl=80
    //% subcategory="Parameters A" weight=100
    export function setLevelParameter(preset: SynthPreset, param: SynthLevelParam, value: number): void {
        setParam(preset, <number>param, value);
    }

    /**
     * Set an envelope time of a sound, in milliseconds.
     */
    //% blockId=synth_param_time
    //% block="set $preset $param to $value ms"
    //% param.defl=SynthTimeParam.EnvAttackTime
    //% value.min=0 value.max=3000 value.defl=5
    //% subcategory="Parameters A" weight=90
    export function setTimeParameter(preset: SynthPreset, param: SynthTimeParam, value: number): void {
        setParam(preset, <number>param, value);
    }

    /**
     * Set the tuning of a sound, in semitones.
     */
    //% blockId=synth_param_pitch
    //% block="set $preset $param to $value semitones"
    //% param.defl=SynthPitchParam.Tune
    //% value.min=-24 value.max=24 value.defl=0
    //% subcategory="Parameters A" weight=80
    export function setPitchParameter(preset: SynthPreset, param: SynthPitchParam, value: number): void {
        setParam(preset, <number>param, value);
    }

    /**
     * Set the LFO or vibrato speed of a sound, in Hz.
     */
    //% blockId=synth_param_speed
    //% block="set $preset $param to $value Hz"
    //% param.defl=SynthSpeedParam.LFOFreq
    //% value.min=0 value.max=20 value.defl=2
    //% subcategory="Parameters A" weight=70
    export function setSpeedParameter(preset: SynthPreset, param: SynthSpeedParam, value: number): void {
        setParam(preset, <number>param, value);
    }

    /**
     * Set an oscillator or LFO waveform of a sound.
     */
    //% blockId=synth_param_shape
    //% block="set $preset $param to $shape"
    //% param.defl=SynthShapeParam.Osc1Shape
    //% subcategory="Parameters A" weight=60
    export function setShapeParameter(preset: SynthPreset, param: SynthShapeParam, shape: oscShapes): void {
        setParam(preset, <number>param, shape);
    }

    /**
     * Set the filter type of a sound.
     */
    //% blockId=synth_param_filtermode
    //% block="set $preset filter type to $type"
    //% subcategory="Parameters A" weight=50
    export function setFilterMode(preset: SynthPreset, type: SynthFilterType): void {
        setParam(preset, SynthParameter.FilterType, type);
    }

    /**
     * Choose whether a sound's volume follows the envelope or switches fully on/off (gate).
     */
    //% blockId=synth_param_envmode
    //% block="set $preset volume $mode"
    //% subcategory="Parameters A" weight=40
    export function setVolumeMode(preset: SynthPreset, mode: gateOrEnv): void {
        setParam(preset, SynthParameter.AmpGate, mode);
    }

    /**
     * Set the oscillator 1 level of a sound, 0-100.
     */
    //% blockId=synth_param_osc1gain
    //% block="set $preset oscillator 1 level to $value"
    //% value.min=0 value.max=100 value.defl=80
    //% subcategory="Parameters B" group="Oscillators" weight=200
    export function setOsc1Gain(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Osc1Gain, value);
    }

    /**
     * Set the oscillator 2 level of a sound, 0-100.
     */
    //% blockId=synth_param_osc2gain
    //% block="set $preset oscillator 2 level to $value"
    //% value.min=0 value.max=100 value.defl=0
    //% subcategory="Parameters B" group="Oscillators" weight=199
    export function setOsc2Gain(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Osc2Gain, value);
    }

    /**
     * Set the oscillator 2 transpose of a sound, in semitones.
     */
    //% blockId=synth_param_osc2transpose
    //% block="set $preset oscillator 2 transpose to $value semitones"
    //% value.min=-24 value.max=24 value.defl=0
    //% subcategory="Parameters B" group="Oscillators" weight=198
    export function setOsc2Transpose(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Osc2Transpose, value);
    }

    /**
     * Set the tune of a sound, in semitones.
     */
    //% blockId=synth_param_tune
    //% block="set $preset tune to $value semitones"
    //% value.min=-12 value.max=12 value.defl=0
    //% subcategory="Parameters B" group="Oscillators" weight=197
    export function setTune(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Tune, value);
    }

    /**
     * Set the noise of a sound, 0-100.
     */
    //% blockId=synth_param_noise
    //% block="set $preset noise to $value"
    //% value.min=0 value.max=100 value.defl=0
    //% subcategory="Parameters B" group="Oscillators" weight=196
    export function setNoise(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Noise, value);
    }

    /**
     * Set the FM amount of a sound, 0-100.
     */
    //% blockId=synth_param_oscfm
    //% block="set $preset FM amount to $value"
    //% value.min=0 value.max=100 value.defl=0
    //% subcategory="Parameters B" group="Oscillators" weight=195
    export function setOscFm(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.OscFm, value);
    }

    /**
     * Set the pulse width 1 of a sound, 0-100.
     */
    //% blockId=synth_param_osc1pw
    //% block="set $preset pulse width 1 to $value"
    //% value.min=0 value.max=100 value.defl=50
    //% subcategory="Parameters B" group="Oscillators" weight=194
    export function setOsc1Pw(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Osc1Pw, value);
    }

    /**
     * Set the PWM 1 of a sound, 0-100.
     */
    //% blockId=synth_param_osc1pwm
    //% block="set $preset PWM 1 to $value"
    //% value.min=0 value.max=100 value.defl=0
    //% subcategory="Parameters B" group="Oscillators" weight=193
    export function setOsc1Pwm(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Osc1Pwm, value);
    }

    /**
     * Set the pulse width 2 of a sound, 0-100.
     */
    //% blockId=synth_param_osc2pw
    //% block="set $preset pulse width 2 to $value"
    //% value.min=0 value.max=100 value.defl=50
    //% subcategory="Parameters B" group="Oscillators" weight=192
    export function setOsc2Pw(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Osc2Pw, value);
    }

    /**
     * Set the PWM 2 of a sound, 0-100.
     */
    //% blockId=synth_param_osc2pwm
    //% block="set $preset PWM 2 to $value"
    //% value.min=0 value.max=100 value.defl=0
    //% subcategory="Parameters B" group="Oscillators" weight=191
    export function setOsc2Pwm(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Osc2Pwm, value);
    }

    /**
     * Set the oscillator 1 shape of a sound.
     */
    //% blockId=synth_param_osc1shape
    //% block="set $preset oscillator 1 shape to $choice"
    //% choice.defl=oscShapes.saw
    //% subcategory="Parameters B" group="Oscillators" weight=190
    export function setOsc1Shape(preset: SynthPreset, choice: oscShapes): void {
        setParam(preset, SynthParameter.Osc1Shape, choice);
    }

    /**
     * Set the oscillator 2 shape of a sound.
     */
    //% blockId=synth_param_osc2shape
    //% block="set $preset oscillator 2 shape to $choice"
    //% choice.defl=oscShapes.pulse
    //% subcategory="Parameters B" group="Oscillators" weight=189
    export function setOsc2Shape(preset: SynthPreset, choice: oscShapes): void {
        setParam(preset, SynthParameter.Osc2Shape, choice);
    }

    /**
     * Set the attack of a sound, in milliseconds.
     */
    //% blockId=synth_param_envattacktime
    //% block="set $preset attack to $value ms"
    //% value.min=0 value.max=2000 value.defl=5
    //% subcategory="Parameters B" group="Envelope" weight=188
    export function setEnvAttackTime(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.EnvAttackTime, value);
    }

    /**
     * Set the decay of a sound, in milliseconds.
     */
    //% blockId=synth_param_envdecaytime
    //% block="set $preset decay to $value ms"
    //% value.min=0 value.max=2000 value.defl=200
    //% subcategory="Parameters B" group="Envelope" weight=187
    export function setEnvDecayTime(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.EnvDecayTime, value);
    }

    /**
     * Set the sustain of a sound, 0-100.
     */
    //% blockId=synth_param_envsustainlevel
    //% block="set $preset sustain to $value"
    //% value.min=0 value.max=100 value.defl=50
    //% subcategory="Parameters B" group="Envelope" weight=186
    export function setEnvSustainLevel(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.EnvSustainLevel, value);
    }

    /**
     * Set the release of a sound, in milliseconds.
     */
    //% blockId=synth_param_envrelease
    //% block="set $preset release to $value ms"
    //% value.min=0 value.max=3000 value.defl=600
    //% subcategory="Parameters B" group="Envelope" weight=185
    export function setEnvRelease(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.EnvRelease, value);
    }

    /**
     * Set the volume envelope of a sound.
     */
    //% blockId=synth_param_ampgate
    //% block="set $preset volume envelope to $choice"
    //% choice.defl=gateOrEnv.ebvelope
    //% subcategory="Parameters B" group="Envelope" weight=184
    export function setAmpGate(preset: SynthPreset, choice: gateOrEnv): void {
        setParam(preset, SynthParameter.AmpGate, choice);
    }

    /**
     * Set the filter cutoff of a sound, 0-100.
     */
    //% blockId=synth_param_cutoff
    //% block="set $preset filter cutoff to $value"
    //% value.min=0 value.max=100 value.defl=80
    //% subcategory="Parameters B" group="Filter" weight=183
    export function setCutoff(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Cutoff, value);
    }

    /**
     * Set the filter resonance of a sound, 0-100.
     */
    //% blockId=synth_param_resonance
    //% block="set $preset filter resonance to $value"
    //% value.min=0 value.max=100 value.defl=0
    //% subcategory="Parameters B" group="Filter" weight=182
    export function setResonance(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Resonance, value);
    }

    /**
     * Set the filter envelope amount of a sound, 0-100.
     */
    //% blockId=synth_param_filterenvamount
    //% block="set $preset filter envelope amount to $value"
    //% value.min=0 value.max=100 value.defl=20
    //% subcategory="Parameters B" group="Filter" weight=181
    export function setFilterEnvAmount(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.FilterEnvAmount, value);
    }

    /**
     * Set the filter key follow of a sound, 0-100.
     */
    //% blockId=synth_param_filterkeyfollow
    //% block="set $preset filter key follow to $value"
    //% value.min=0 value.max=100 value.defl=0
    //% subcategory="Parameters B" group="Filter" weight=180
    export function setFilterKeyFollow(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.FilterKeyFollow, value);
    }

    /**
     * Set the filter LFO amount of a sound, 0-100.
     */
    //% blockId=synth_param_filterlfoamount
    //% block="set $preset filter LFO amount to $value"
    //% value.min=0 value.max=100 value.defl=0
    //% subcategory="Parameters B" group="Filter" weight=179
    export function setFilterLfoAmount(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.FilterLfoAmount, value);
    }

    /**
     * Set the filter type of a sound.
     */
    //% blockId=synth_param_filtertype
    //% block="set $preset filter type to $choice"
    //% choice.defl=SynthFilterType.Lowpass
    //% subcategory="Parameters B" group="Filter" weight=178
    export function setFilterType(preset: SynthPreset, choice: SynthFilterType): void {
        setParam(preset, SynthParameter.FilterType, choice);
    }

    /**
     * Set the LFO speed of a sound, in Hz.
     */
    //% blockId=synth_param_lfofreq
    //% block="set $preset LFO speed to $value Hz"
    //% value.min=0 value.max=20 value.defl=2
    //% subcategory="Parameters B" group="LFO and vibrato" weight=177
    export function setLFOFreq(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.LFOFreq, value);
    }

    /**
     * Set the vibrato speed of a sound, in Hz.
     */
    //% blockId=synth_param_vibratofreq
    //% block="set $preset vibrato speed to $value Hz"
    //% value.min=0 value.max=20 value.defl=5
    //% subcategory="Parameters B" group="LFO and vibrato" weight=176
    export function setVibratoFreq(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.VibratoFreq, value);
    }

    /**
     * Set the vibrato depth of a sound, in cents (100 = 1 semitone).
     */
    //% blockId=synth_param_vibratoamount
    //% block="set $preset vibrato depth to $value cents"
    //% value.min=0 value.max=100 value.defl=0
    //% subcategory="Parameters B" group="LFO and vibrato" weight=175
    export function setVibratoAmount(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.VibratoAmount, value);
    }

    /**
     * Set the LFO shape of a sound.
     */
    //% blockId=synth_param_lfoshape
    //% block="set $preset LFO shape to $choice"
    //% choice.defl=oscShapes.triangle
    //% subcategory="Parameters B" group="LFO and vibrato" weight=174
    export function setLFOShape(preset: SynthPreset, choice: oscShapes): void {
        setParam(preset, SynthParameter.LFOShape, choice);
    }

    /**
     * Set the volume of a sound, 0-100.
     */
    //% blockId=synth_param_gain
    //% block="set $preset volume to $value"
    //% value.min=0 value.max=100 value.defl=80
    //% subcategory="Parameters B" group="Output" weight=173
    export function setGain(preset: SynthPreset, value: number): void {
        setParam(preset, SynthParameter.Gain, value);
    }

    /**
     * Set any parameter of a sound. Click the value for a slider with the right range for the chosen parameter.
     * Values use the same units as "set up sound": levels 0-100, times in ms, tuning in semitones,
     * speeds in Hz, vibrato depth in cents; shapes and modes are numbered in dropdown order (0, 1, 2).
     */
    //% blockId=synth_param_any
    //% block="set $preset $param to $value"
    //% param.defl=SynthAnyParam.Cutoff
    //% value.shadow=synth_param_value
    //% subcategory="Parameters C" weight=100
    export function setAnyParameter(preset: SynthPreset, param: SynthAnyParam, value: number): void {
        setParam(preset, <number>param, value);
    }

    /**
     * A parameter value. Its slider follows the parameter chosen in the block it is plugged into.
     */
    //% blockId=synth_param_value block="$value" shadow=true blockHidden=true shim=TD_ID
    //% value.fieldEditor="dependentslider" value.defl=80
    //% value.fieldOptions.source="param" value.fieldOptions.decompileLiterals=true
    //% value.fieldOptions.ranges="Osc1Gain:0:100:80:%;Osc2Gain:0:100:0:%;Osc2Transpose:-24:24:0:st;Tune:-12:12:0:st;Noise:0:100:0:%;OscFm:0:100:0:%;Osc1Pw:0:100:50:%;Osc1Pwm:0:100:0:%;Osc2Pw:0:100:50:%;Osc2Pwm:0:100:0:%;EnvAttackTime:0:2000:5:ms;EnvDecayTime:0:2000:200:ms;EnvSustainLevel:0:100:50:%;EnvRelease:0:3000:600:ms;Cutoff:0:100:80:%;Resonance:0:100:0:%;FilterEnvAmount:0:100:20:%;FilterKeyFollow:0:100:0:%;FilterLfoAmount:0:100:0:%;LFOFreq:0:20:2:Hz;VibratoFreq:0:20:5:Hz;VibratoAmount:0:100:0:cents;Gain:0:100:80:%;Osc1Shape:0:2:0:saw|pulse|triangle;Osc2Shape:0:2:1:saw|pulse|triangle;LFOShape:0:2:2:saw|pulse|triangle;FilterType:0:2:0:low-pass|high-pass|band-pass;AmpGate:0:1:0:envelope|gate"
    export function _paramValue(value: number): number {
        return value;
    }
}
