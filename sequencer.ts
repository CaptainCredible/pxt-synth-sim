/**
 * Step sequencer blocks for SynthBlocks.
 *
 * A sequence is drawn in MakeCode's piano-roll editor. The editor stores it as a
 * song buffer (hex literal); we decode that once into a Sequence object whose
 * notes are plain MIDI note numbers (60 = middle C), so transposing is just
 * adding semitones.
 */

enum SequenceScale {
    //% block="chromatic"
    Chromatic = 0,
    //% block="major"
    Major = 1,
    //% block="minor"
    Minor = 2,
    //% block="pentatonic"
    Pentatonic = 3,
    //% block="blues"
    Blues = 4
}

enum ScaleRoot {
    //% block="C"
    C = 0,
    //% block="C#"
    CSharp = 1,
    //% block="D"
    D = 2,
    //% block="D#"
    DSharp = 3,
    //% block="E"
    E = 4,
    //% block="F"
    F = 5,
    //% block="F#"
    FSharp = 6,
    //% block="G"
    G = 7,
    //% block="G#"
    GSharp = 8,
    //% block="A"
    A = 9,
    //% block="A#"
    ASharp = 10,
    //% block="B"
    B = 11
}

enum SequencePlayMode {
    //% block="until done"
    UntilDone = 0,
    //% block="in background"
    InBackground = 1,
    //% block="in sync in background"
    InSync = 2
}

namespace synthBlocks {
    /**
     * A polyphonic step sequence. Each note has a start step, a length in steps,
     * a MIDI note number, a velocity (0-127) and the synth preset (sound) it plays with.
     *
     * drawnNotes are the notes as placed in the piano roll and never change. The notes
     * that play are worked out from them: snapped to the sequence's scale and root, then
     * moved by its transpose amount. So changing the scale (even to pentatonic and back to
     * chromatic) never loses the original melody.
     */
    export class Sequence {
        /** number of 16th-note steps in the sequence (16 for one 4/4 bar) */
        public length: number;
        public steps: number[];
        public lengths: number[];
        /** MIDI notes as drawn in the piano roll */
        public drawnNotes: number[];
        /** MIDI notes that play: drawnNotes snapped to the scale, plus transpose */
        public notes: number[];
        public velocities: number[];
        public presets: SynthPreset[];
        public scale: SequenceScale;
        public root: ScaleRoot;
        /** semitones added after snapping */
        public transpose: number;

        constructor() {
            this.length = 16;
            this.steps = [];
            this.lengths = [];
            this.drawnNotes = [];
            this.notes = [];
            this.velocities = [];
            this.presets = [];
            this.scale = SequenceScale.Chromatic;
            this.root = ScaleRoot.C;
            this.transpose = 0;
        }

        /** recompute the playing notes from the drawn notes */
        _update() {
            this.notes = [];
            for (let i = 0; i < this.drawnNotes.length; i++) {
                this.notes.push(snapToScale(this.drawnNotes[i], this.scale, this.root) + this.transpose);
            }
        }

        /** fire every note that starts on step `step` */
        _trigger(step: number, msPerStep: number) {
            for (let i = 0; i < this.steps.length; i++) {
                if (this.steps[i] == step) {
                    let note = this.notes[i] + globalTranspose;
                    if (note < 0 || note > 127) continue;
                    let duration = Math.max(10, this.lengths[i] * msPerStep - 5);
                    orchestra.note(note, Math.min(10000, duration), this.velocities[i], this.presets[i]);
                }
            }
        }
    }

    // ---------- decoding the piano-roll song buffer ----------
    // Format: pxt/pxtlib/music.ts (encodeSong). Song note n -> MIDI n + 23
    // (song note 1 = C1 = MIDI 24, so middle C = song note 37 = MIDI 60).
    // The piano roll's "simInstruments" option stores the chosen sound of a track
    // as instrument waveform 200 + preset index (see pxt core pianoRoll/simOutput.ts).
    const SIM_INSTRUMENT_BASE = 200;

    function u16(buf: Buffer, offset: number): number {
        return buf.getNumber(NumberFormat.UInt16LE, offset);
    }

    function decodeSequence(buf: Buffer): Sequence {
        let seq = new Sequence();
        if (!buf || buf.length < 7) return seq;

        let beatsPerMeasure = buf[3];
        let ticksPerBeat = buf[4];
        let measures = buf[5];
        let numTracks = buf[6];
        // a step is a 16th note = a quarter of a beat
        let ticksPerStep = Math.max(1, ticksPerBeat / 4);
        seq.length = Math.max(1, Math.floor(measures * beatsPerMeasure * ticksPerBeat / ticksPerStep));

        // per-note index of the note event it came from (for velocities)
        let noteEvent: number[] = [];
        let trackIds: number[] = [];
        let trackFirstEvent: number[] = [];
        let trackEventCount: number[] = [];
        let eventIndex = 0;

        let offset = 7;
        for (let t = 0; t < numTracks && offset + 4 <= buf.length; t++) {
            let id = buf[offset];
            let isDrum = buf[offset + 1] != 0;
            let headerLength = u16(buf, offset + 2); // instrument (or drum) bytes
            let octave = isDrum ? 0 : buf[offset + 4 + 27];
            let preset = isDrum ? 0 : buf[offset + 4] - SIM_INSTRUMENT_BASE;
            if (preset < 0 || preset > 2) preset = 0;
            let noteStart = offset + 4 + headerLength;
            let noteBytes = u16(buf, noteStart);
            let p = noteStart + 2;
            let end = p + noteBytes;

            trackIds.push(id);
            trackFirstEvent.push(eventIndex);
            let count = 0;

            while (p < end && p + 5 <= buf.length) {
                let startTick = u16(buf, p);
                let endTick = u16(buf, p + 2);
                let polyphony = buf[p + 4];
                if (!isDrum) {
                    for (let i = 0; i < polyphony; i++) {
                        let songNote = (buf[p + 5 + i] & 0x3f) + (octave - 2) * 12;
                        seq.steps.push(Math.floor(startTick / ticksPerStep));
                        seq.lengths.push(Math.max(1, Math.round((endTick - startTick) / ticksPerStep)));
                        seq.drawnNotes.push(songNote + 23);
                        seq.velocities.push(127);
                        seq.presets.push(preset);
                        noteEvent.push(eventIndex);
                    }
                }
                p += 5 + polyphony;
                eventIndex++;
                count++;
            }
            trackEventCount.push(count);
            offset = end;
        }

        // optional per-event velocities: [track id, velocity per event...]
        while (offset < buf.length) {
            let id = buf[offset];
            let ti = trackIds.indexOf(id);
            if (ti < 0) break;
            let first = trackFirstEvent[ti];
            let count = trackEventCount[ti];
            for (let e = 0; e < count; e++) {
                let v = Math.min(127, buf[offset + 1 + e]);
                for (let n = 0; n < noteEvent.length; n++) {
                    if (noteEvent[n] == first + e) seq.velocities[n] = v;
                }
            }
            offset += 1 + count;
        }

        seq._update();
        return seq;
    }

    // ---------- scales ----------

    // semitones above the root for each scale (pentatonic = major pentatonic, blues = minor blues)
    const SCALE_STEPS: number[][] = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // chromatic
        [0, 2, 4, 5, 7, 9, 11],                 // major
        [0, 2, 3, 5, 7, 8, 10],                 // natural minor
        [0, 2, 4, 7, 9],                        // pentatonic
        [0, 3, 5, 6, 7, 10]                     // blues
    ];

    /** move a MIDI note to the nearest note of the scale; halfway between two, it goes down */
    export function snapToScale(note: number, scale: SequenceScale, root: ScaleRoot): number {
        let steps = SCALE_STEPS[scale] || SCALE_STEPS[0];
        let inScale = (n: number) => steps.indexOf(((n - root) % 12 + 12) % 12) >= 0;
        for (let d = 0; d <= 6; d++) {
            if (inScale(note - d)) return note - d;
            if (inScale(note + d)) return note + d;
        }
        return note;
    }

    /** added to every sequence's notes when they play */
    let globalTranspose = 0;

    // ---------- tempo and master clock ----------

    // The tempo is the Music library's (music.tempo(), set with the standard Tempo blocks),
    // so melodies and sequences share one tempo. A beat is a quarter note = 4 steps.
    let paused = false;
    let clockRunning = false;
    let clockGeneration = 0;
    let syncedSequences: Sequence[] = [];

    // "on sequencer step X of N" and "on every sequencer step of N" handlers
    let stepHandlerSteps: number[] = [];
    let stepHandlerLengths: number[] = [];
    let stepHandlers: (() => void)[] = [];
    let everyStepLengths: number[] = [];
    let everyStepHandlers: ((step: number) => void)[] = [];

    /** current speed in beats per minute; 0 while paused */
    function currentBpm(): number {
        return paused ? 0 : Math.max(0, music.tempo());
    }

    /** length of one step (a 16th note) in ms, for note durations */
    function msPerStep(): number {
        let bpm = music.tempo();
        return bpm > 0 ? 60000 / bpm / 4 : 10000;
    }

    /**
     * Keeps time in steps. It never sleeps longer than 20 ms at a time and re-reads the
     * tempo (and the paused flag) every time it wakes, so changes take effect at once.
     * Progress is measured from control.millis(), so it doesn't drift.
     */
    class StepTimer {
        last: number;
        phase: number;

        constructor() {
            this.last = control.millis();
            this.phase = 0;
        }

        /** wait for the next step; returns false if keepGoing() turned false while waiting */
        waitForNextStep(keepGoing: () => boolean): boolean {
            while (keepGoing()) {
                let now = control.millis();
                let bpm = currentBpm();
                this.phase += (now - this.last) * bpm * 4 / 60000;
                this.last = now;
                if (this.phase >= 1) {
                    // if we fell more than a step behind, skip the missed steps rather than rush them
                    this.phase -= Math.floor(this.phase);
                    return true;
                }
                let wait = bpm > 0 ? (1 - this.phase) * 60000 / (bpm * 4) : 20;
                basic.pause(Math.max(1, Math.min(20, Math.ceil(wait))));
            }
            return false;
        }
    }

    function playOnce(seq: Sequence) {
        let timer = new StepTimer();
        for (let step = 0; step < seq.length; step++) {
            seq._trigger(step, msPerStep());
            if (step < seq.length - 1) timer.waitForNextStep(() => true);
        }
        // let the last step last its full length, as "until done" promises
        timer.waitForNextStep(() => true);
    }

    /** start the step handlers for this tick, each in its own fiber so they can't hold up the clock */
    function fireStepHandlers(tick: number) {
        for (let i = 0; i < stepHandlers.length; i++) {
            let length = Math.max(1, Math.floor(stepHandlerLengths[i]));
            if (tick % length + 1 == stepHandlerSteps[i]) control.inBackground(stepHandlers[i]);
        }
        for (let i = 0; i < everyStepHandlers.length; i++) {
            let length = Math.max(1, Math.floor(everyStepLengths[i]));
            let step = tick % length + 1;
            let handler = everyStepHandlers[i];
            control.inBackground(() => handler(step));
        }
    }

    // ---------- blocks ----------

    /**
     * A 16-step polyphonic sequence. Click it to draw notes in the piano roll.
     * Notes are stored as MIDI note numbers (60 = middle C).
     */
    //% blockId=synth_sequence_create
    //% block="sequence $song||scale $scale root $root"
    //% song.fieldEditor=pianoroll
    //% song.fieldOptions.decompileLiterals=true
    //% song.fieldOptions.taggedTemplate="hex"
    //% song.fieldOptions.decompileArgumentAsString="true"
    //% song.fieldOptions.showSnapControls=true
    //% song.fieldOptions.showTimeSignature=true
    //% song.fieldOptions.simInstruments="Sound 1,Sound 2,Sound 3"
    //% song.fieldOptions.showMidiNumbers=true
    //% song.fieldOptions.showSequenceTools=true
    //% song.fieldOptions.singleTrack=true
    //% song.fieldOptions.previewColors="#0b8a0d,#33c236,#065a08,#7fdc81"
    //% song.snippet="hex`00780004080100`"
    //% blockSetVariable=myMelody
    //% duplicateShadowOnDrag
    //% group="Sequencer" weight=90
    //% scale.defl=SequenceScale.Chromatic root.defl=ScaleRoot.C
    export function createSequence(song: Buffer, scale?: SequenceScale, root?: ScaleRoot): Sequence {
        let seq = decodeSequence(song);
        if (scale !== undefined || root !== undefined) {
            seq.scale = scale || SequenceScale.Chromatic;
            seq.root = root || ScaleRoot.C;
            seq._update();
        }
        return seq;
    }

    /**
     * Play a sequence. Each track uses the sound picked for it in the piano roll.
     * "until done" waits until it has finished, "in background" plays it once
     * while your program carries on, and "in sync in background" loops it in time
     * with the master clock (see "start sequences").
     */
    //% blockId=synth_sequence_play
    //% block="start sequence $seq $mode"
    //% seq.shadow=variables_get seq.defl=myMelody
    //% group="Sequencer" weight=80
    export function playSequence(seq: Sequence, mode: SequencePlayMode): void {
        if (!seq) return;
        if (mode == SequencePlayMode.UntilDone) {
            playOnce(seq);
        } else if (mode == SequencePlayMode.InBackground) {
            control.inBackground(() => playOnce(seq));
        } else if (syncedSequences.indexOf(seq) < 0) {
            // joins at once, at the step the master clock says it is at (tick % its length)
            syncedSequences.push(seq);
        }
    }

    /**
     * Stop a sequence that is playing in sync with the master clock.
     */
    //% blockId=synth_sequence_stop
    //% block="stop synced sequence $seq"
    //% seq.shadow=variables_get seq.defl=myMelody
    //% group="Sequencer" weight=50
    export function stopSequence(seq: Sequence): void {
        let i = syncedSequences.indexOf(seq);
        if (i < 0) return;
        syncedSequences.removeAt(i);
    }

    /**
     * Start the master clock from step 1. Sequences played "in sync in background"
     * play at the clock's current step, so they all line up.
     */
    //% blockId=synth_sequences_start
    //% block="start sequences sync clock"
    //% group="Sequencer" weight=70
    export function startSequences(): void {
        if (clockRunning) return;
        clockRunning = true;
        paused = false;
        clockGeneration++;
        let generation = clockGeneration;
        let alive = () => clockRunning && generation == clockGeneration;

        control.inBackground(() => {
            let tick = 0;
            let timer = new StepTimer();
            while (alive()) {
                fireStepHandlers(tick);
                let ms = msPerStep();
                // every synced sequence is at step tick % its own length, so
                // sequences of different lengths stay phase-locked (polyrhythms)
                for (let i = 0; i < syncedSequences.length; i++) {
                    let seq = syncedSequences[i];
                    seq._trigger(tick % seq.length, ms);
                }
                tick++;
                if (!timer.waitForNextStep(alive)) break;
            }
        });
    }

    /**
     * Stop the master clock. Synced sequences stay registered and start again
     * from the top on the next "start sequences".
     */
    //% blockId=synth_sequences_end
    //% block="stop sequences sync clock"
    //% group="Sequencer" weight=60
    export function endSequences(): void {
        clockRunning = false;
        clockGeneration++;
        paused = false;
    }

    /**
     * Pause all sequences where they are. "resume sequences" carries on from the same step.
     */
    //% blockId=synth_sequences_pause
    //% block="pause sequences"
    //% group="Sequencer" weight=59
    export function pauseSequences(): void {
        paused = true;
    }

    /**
     * Carry on playing sequences after "pause sequences", from the step they paused on.
     */
    //% blockId=synth_sequences_resume
    //% block="resume sequences"
    //% group="Sequencer" weight=58
    export function resumeSequences(): void {
        paused = false;
    }

    /**
     * Old block, kept so existing projects still work: sequences now use the Music
     * tempo, so this just calls music.setTempo (which ignores 0 and below).
     */
    //% blockId=synth_sequence_tempo
    //% block="set sequence tempo to $bpm bpm"
    //% bpm.min=40 bpm.max=500 bpm.defl=120 deprecated=1
    //% group="Sequencer" weight=40
    export function setSequenceTempo(bpm: number): void {
        music.setTempo(bpm);
    }

    /**
     * Transpose every note of a sequence by a number of semitones
     * (12 = one octave up, -12 = one octave down).
     */
    //% blockId=synth_sequence_transpose
    //% block="transpose $seq by $semitones semitones"
    //% seq.shadow=variables_get seq.defl=myMelody
    //% semitones.defl=12
    //% group="Sequencer" weight=30
    export function transposeSequence(seq: Sequence, semitones: number): void {
        if (!seq) return;
        seq.transpose += semitones;
        seq._update();
    }

    /**
     * Snap a sequence's notes to a scale. The notes you drew are kept, so you can snap
     * to another scale (or back to chromatic) at any time without losing the melody.
     * Notes halfway between two scale notes go down.
     */
    //% blockId=synth_sequence_snap
    //% block="snap $seq to scale $scale root $root"
    //% seq.shadow=variables_get seq.defl=myMelody
    //% scale.defl=SequenceScale.Major root.defl=ScaleRoot.C
    //% group="Sequencer" weight=25
    export function snapSequenceToScale(seq: Sequence, scale: SequenceScale, root: ScaleRoot): void {
        if (!seq) return;
        seq.scale = scale;
        seq.root = root;
        seq._update();
    }

    /**
     * Transpose every sequence, including ones already playing, by a number of semitones.
     * It adds up: transposing by 2 twice moves everything up 4 semitones.
     */
    //% blockId=synth_sequences_transpose_all
    //% block="transpose all sequences by $semitones semitones"
    //% semitones.defl=2
    //% group="Sequencer" weight=20
    export function transposeAllSequences(semitones: number): void {
        globalTranspose += semitones;
    }

    /**
     * Run code when the master clock reaches a step. Steps count 1 to barLength and
     * then start again, so "step 1 of 16" runs at the start of every 16-step bar.
     * The code runs alongside the clock, so it can't hold it up; changes it makes to
     * sequences apply from the next step.
     */
    //% blockId=synth_on_sequencer_step
    //% block="on sequencer step $step of $barLength"
    //% step.min=1 step.defl=1 barLength.min=1 barLength.defl=16
    //% group="Sequencer" weight=15
    export function onSequencerStep(step: number, barLength: number, handler: () => void): void {
        stepHandlerSteps.push(step);
        stepHandlerLengths.push(barLength);
        stepHandlers.push(handler);
    }

    /**
     * Run code on every step of the master clock. step counts 1 to barLength and
     * then starts again.
     */
    //% blockId=synth_on_every_sequencer_step
    //% block="on every sequencer step $step of $barLength"
    //% draggableParameters="reporter"
    //% barLength.min=1 barLength.defl=16
    //% group="Sequencer" weight=14
    export function onEverySequencerStep(barLength: number, handler: (step: number) => void): void {
        everyStepLengths.push(barLength);
        everyStepHandlers.push(handler);
    }
}
