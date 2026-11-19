/**
 * "set up sound" block: edits one synth preset. The oscillators are always shown;
 * the "+" button reveals, one step at a time: envelope, filter, LFO & vibrato,
 * then FM and pulse width. Hidden sections still apply their default values.
 *
 * The shape/mode dropdowns use the "synthgraph" field editor (pxt core patch,
 * pxtblocks/fields/field_synth_graph.ts): click to change, and it draws a live
 * picture from the number inputs named in fieldOptions.inputs.
 *
 * The preset field has "low"/"high" preview buttons: they send the block's current values to the
 * simulator, which applies them (pxt-microbit-notam sim/state/orchestra.ts, previewSound) and plays C3/C4.
 * previewSound duplicates the scaling and defaults below - keep them in sync.
 */

enum SynthFilterType {
    //% block="low-pass"
    Lowpass = 0,
    //% block="high-pass"
    Highpass = 1,
    //% block="band-pass"
    Bandpass = 2
}

namespace synthBlocks {
    /**
     * Set up a synth sound. Press + to show the envelope, filter, LFO and FM settings.
     * @param preset the sound to change
     * @param soundPreset a ready-made sound; choosing one in the editor fills in the block (it has no effect when the program runs)
     * @param osc1Level oscillator 1 level, 0-100
     * @param tune tuning of the whole sound in semitones
     * @param osc2Level oscillator 2 level, 0-100
     * @param osc2Transpose oscillator 2 tuning relative to oscillator 1, in semitones
     * @param noise noise level, 0-100
     * @param volume overall volume, 0-100
     * @param gateEnv "envelope" shapes the volume with attack/decay/sustain/release, "gate" switches it fully on/off
     * @param attack attack time in milliseconds
     * @param decay decay time in milliseconds
     * @param sustain sustain level in percent
     * @param release release time in milliseconds
     * @param cutoff filter cutoff, 0-100
     * @param resonance filter resonance, 0-100
     * @param filterEnv how much the envelope opens the filter, 0-100
     * @param filterKey how much higher notes open the filter, 0-100
     * @param filterLfo how much the LFO moves the filter, 0-100
     * @param lfoFreq LFO speed in Hz
     * @param vibFreq vibrato speed in Hz
     * @param vibDepth vibrato depth in cents (100 cents = 1 semitone)
     * @param fm how much oscillator 1 modulates oscillator 2, 0-100
     * @param pw1 oscillator 1 pulse width, 50 = square
     * @param pwm1 how much the LFO changes oscillator 1's pulse width, 0-100
     * @param pw2 oscillator 2 pulse width, 50 = square
     * @param pwm2 how much the LFO changes oscillator 2's pulse width, 0-100
     */
    //% blockId=synth_setup_sound
    //% block="set up $preset|preset $soundPreset|oscillator 1 $osc1Shape level $osc1Level tune $tune|oscillator 2 $osc2Shape level $osc2Level transpose $osc2Transpose|noise $noise volume $volume||volume envelope $gateEnv|attack $attack decay $decay sustain $sustain release $release|filter $filterType cutoff $cutoff resonance $resonance|envelope amount $filterEnv key follow $filterKey LFO amount $filterLfo|LFO $lfoShape speed Hz $lfoFreq|vibrato speed Hz $vibFreq depth cents $vibDepth|FM amount $fm|pulse width 1 $pw1 PWM 1 $pwm1|pulse width 2 $pw2 PWM 2 $pwm2"
    //% expandableArgumentBreaks="5,11,15,20"
    //% compileHiddenArguments=true
    //% inlineInputMode=inline inlineRowBreaks=true expandableArgumentSeparators=true
    //% group="Sound" weight=100
    //%
    //% soundPreset.fieldEditor="presetvalues" soundPreset.defl=SynthSoundPreset.Custom
    //% preset.fieldEditor="synthpreview"
    //% preset.fieldOptions.message="synth-preview" preset.fieldOptions.notes="48,60"
    //% osc1Shape.fieldEditor="synthgraph" osc1Shape.fieldOptions.graph="wave"
    //% osc1Shape.fieldOptions.inputs="pw1" osc1Shape.fieldOptions.defaults="50"
    //% osc1Shape.defl=oscShapes.saw
    //% osc1Level.min=0 osc1Level.max=100 osc1Level.defl=80
    //% tune.min=-12 tune.max=12 tune.defl=0
    //% osc2Shape.fieldEditor="synthgraph" osc2Shape.fieldOptions.graph="wave"
    //% osc2Shape.fieldOptions.inputs="pw2" osc2Shape.fieldOptions.defaults="50"
    //% osc2Shape.defl=oscShapes.pulse
    //% osc2Level.min=0 osc2Level.max=100 osc2Level.defl=0
    //% osc2Transpose.min=-24 osc2Transpose.max=24 osc2Transpose.defl=0
    //% noise.min=0 noise.max=100 noise.defl=0
    //% volume.min=0 volume.max=100 volume.defl=80
    //%
    //% gateEnv.fieldEditor="synthgraph" gateEnv.fieldOptions.graph="envelope"
    //% gateEnv.fieldOptions.inputs="attack,decay,sustain,release"
    //% gateEnv.fieldOptions.defaults="5,200,50,600"
    //% gateEnv.defl=gateOrEnv.ebvelope
    //% attack.min=0 attack.max=2000 attack.defl=5
    //% decay.min=0 decay.max=2000 decay.defl=200
    //% sustain.min=0 sustain.max=100 sustain.defl=50
    //% release.min=0 release.max=3000 release.defl=600
    //%
    //% filterType.fieldEditor="synthgraph" filterType.fieldOptions.graph="filter"
    //% filterType.fieldOptions.inputs="cutoff,resonance"
    //% filterType.fieldOptions.defaults="80,0"
    //% filterType.defl=SynthFilterType.Lowpass
    //% cutoff.min=0 cutoff.max=100 cutoff.defl=80
    //% resonance.min=0 resonance.max=100 resonance.defl=0
    //% filterEnv.min=0 filterEnv.max=100 filterEnv.defl=20
    //% filterKey.min=0 filterKey.max=100 filterKey.defl=0
    //% filterLfo.min=0 filterLfo.max=100 filterLfo.defl=0
    //%
    //% lfoShape.fieldEditor="synthgraph" lfoShape.fieldOptions.graph="lfo"
    //% lfoShape.fieldOptions.inputs="lfoFreq" lfoShape.fieldOptions.defaults="2"
    //% lfoShape.defl=oscShapes.triangle
    //% lfoFreq.min=0 lfoFreq.max=20 lfoFreq.defl=2
    //% vibFreq.min=0 vibFreq.max=20 vibFreq.defl=5
    //% vibDepth.min=0 vibDepth.max=100 vibDepth.defl=0
    //%
    //% fm.min=0 fm.max=100 fm.defl=0
    //% pw1.min=0 pw1.max=100 pw1.defl=50
    //% pwm1.min=0 pwm1.max=100 pwm1.defl=0
    //% pw2.min=0 pw2.max=100 pw2.defl=50
    //% pwm2.min=0 pwm2.max=100 pwm2.defl=0
    export function setUpSound(preset: SynthPreset, soundPreset: SynthSoundPreset,
        osc1Shape: oscShapes, osc1Level: number, tune: number,
        osc2Shape: oscShapes, osc2Level: number, osc2Transpose: number,
        noise: number, volume: number,
        gateEnv?: gateOrEnv, attack?: number, decay?: number, sustain?: number, release?: number,
        filterType?: SynthFilterType, cutoff?: number, resonance?: number, filterEnv?: number, filterKey?: number, filterLfo?: number,
        lfoShape?: oscShapes, lfoFreq?: number, vibFreq?: number, vibDepth?: number,
        fm?: number, pw1?: number, pwm1?: number, pw2?: number, pwm2?: number): void {

        // defaults for hidden/omitted arguments (also used when called from TypeScript)
        if (gateEnv === undefined) gateEnv = gateOrEnv.ebvelope;
        if (attack === undefined) attack = 5;
        if (decay === undefined) decay = 200;
        if (sustain === undefined) sustain = 50;
        if (release === undefined) release = 600;
        if (filterType === undefined) filterType = SynthFilterType.Lowpass;
        if (cutoff === undefined) cutoff = 80;
        if (resonance === undefined) resonance = 0;
        if (filterEnv === undefined) filterEnv = 20;
        if (filterKey === undefined) filterKey = 0;
        if (filterLfo === undefined) filterLfo = 0;
        if (lfoShape === undefined) lfoShape = oscShapes.triangle;
        if (lfoFreq === undefined) lfoFreq = 2;
        if (vibFreq === undefined) vibFreq = 5;
        if (vibDepth === undefined) vibDepth = 0;
        if (fm === undefined) fm = 0;
        if (pw1 === undefined) pw1 = 50;
        if (pwm1 === undefined) pwm1 = 0;
        if (pw2 === undefined) pw2 = 50;
        if (pwm2 === undefined) pwm2 = 0;

        const pct = (v: number) => Math.max(0, Math.min(100, v)) / 100;

        orchestra.setParameter(preset, SynthParameter.Osc1Shape, osc1Shape);
        orchestra.setParameter(preset, SynthParameter.Osc1Gain, pct(osc1Level));
        orchestra.setParameter(preset, SynthParameter.Tune, tune);
        orchestra.setParameter(preset, SynthParameter.Osc2Shape, osc2Shape);
        orchestra.setParameter(preset, SynthParameter.Osc2Gain, pct(osc2Level));
        orchestra.setParameter(preset, SynthParameter.Osc2Transpose, osc2Transpose);
        orchestra.setParameter(preset, SynthParameter.Noise, pct(noise));
        orchestra.setParameter(preset, SynthParameter.Gain, pct(volume));

        orchestra.setParameter(preset, SynthParameter.AmpGate, gateEnv);
        orchestra.setParameter(preset, SynthParameter.EnvAttackTime, Math.max(0, attack) / 1000);
        orchestra.setParameter(preset, SynthParameter.EnvDecayTime, Math.max(0, decay) / 1000);
        orchestra.setParameter(preset, SynthParameter.EnvSustainLevel, pct(sustain));
        orchestra.setParameter(preset, SynthParameter.EnvRelease, Math.max(0, release) / 1000);

        orchestra.setParameter(preset, SynthParameter.FilterType, filterType);
        orchestra.setParameter(preset, SynthParameter.Cutoff, pct(cutoff));
        orchestra.setParameter(preset, SynthParameter.Resonance, pct(resonance));
        orchestra.setParameter(preset, SynthParameter.FilterEnvAmount, pct(filterEnv));
        orchestra.setParameter(preset, SynthParameter.FilterKeyFollow, pct(filterKey));
        orchestra.setParameter(preset, SynthParameter.FilterLfoAmount, pct(filterLfo));

        orchestra.setParameter(preset, SynthParameter.LFOShape, lfoShape);
        orchestra.setParameter(preset, SynthParameter.LFOFreq, Math.max(0, lfoFreq));
        orchestra.setParameter(preset, SynthParameter.VibratoFreq, Math.max(0, vibFreq));
        orchestra.setParameter(preset, SynthParameter.VibratoAmount, Math.max(0, vibDepth) / 100);

        // 100 maps to an FM amount of 1 (the shared presets use up to about 0.9)
        orchestra.setParameter(preset, SynthParameter.OscFm, pct(fm));
        orchestra.setParameter(preset, SynthParameter.Osc1Pw, pct(pw1) * 2 - 1);
        orchestra.setParameter(preset, SynthParameter.Osc1Pwm, pct(pwm1));
        orchestra.setParameter(preset, SynthParameter.Osc2Pw, pct(pw2) * 2 - 1);
        orchestra.setParameter(preset, SynthParameter.Osc2Pwm, pct(pwm2));
    }
}
