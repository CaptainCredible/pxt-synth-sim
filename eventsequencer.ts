/**
 * Event sequences: a drum-machine style grid whose hits don't make sound themselves but
 * fire "on sequencer event" handlers, so you can sequence anything (drum sounds, radio
 * messages, LEDs...). They are Sequences, so play / stop / cue / sync work the same.
 *
 * The grid is the piano roll's drum track, counted from the bottom: "neutral kick" = event 1 ...
 * "low tom" = event 12. The 12 rows above (metallic and up) don't fire anything.
 * If the track is switched to a melodic instrument, notes fire by pitch: C = event 1 ... B = event 12.
 */

enum SequencerEvent {
    //% block="event 1"
    E1 = 0,
    //% block="event 2"
    E2 = 1,
    //% block="event 3"
    E3 = 2,
    //% block="event 4"
    E4 = 3,
    //% block="event 5"
    E5 = 4,
    //% block="event 6"
    E6 = 5,
    //% block="event 7"
    E7 = 6,
    //% block="event 8"
    E8 = 7,
    //% block="event 9"
    E9 = 8,
    //% block="event 10"
    E10 = 9,
    //% block="event 11"
    E11 = 10,
    //% block="event 12"
    E12 = 11
}

namespace synthBlocks {
    const EVENT_COUNT = 12;

    let eventHandlerEvents: number[] = [];
    let eventHandlers: ((velocity: number) => void)[] = [];

    /** run every handler for this event, each in its own fiber so they can't hold up the clock */
    function fireSequencerEvent(event: number, velocity: number) {
        for (let i = 0; i < eventHandlers.length; i++) {
            if (eventHandlerEvents[i] != event) continue;
            let handler = eventHandlers[i];
            control.inBackground(() => handler(velocity));
        }
    }

    /**
     * A Sequence whose hits fire events instead of playing notes.
     * steps[i] / velocities[i] are as in Sequence; events[i] is the event (0-11).
     */
    export class EventSequence extends Sequence {
        public events: number[];

        constructor() {
            super();
            this.events = [];
        }

        _update() { }

        _trigger(step: number, msPerStep: number) {
            for (let i = 0; i < this.steps.length; i++) {
                if (this.steps[i] == step) fireSequencerEvent(this.events[i], this.velocities[i]);
            }
        }
    }

    function u16(buf: Buffer, offset: number): number {
        return buf.getNumber(NumberFormat.UInt16LE, offset);
    }

    /** read a piano-roll song buffer (format: pxt/pxtlib/music.ts encodeSong) into an EventSequence */
    function decodeEventSequence(buf: Buffer): EventSequence {
        let seq = new EventSequence();
        if (!buf || buf.length < 7) return seq;

        let beatsPerMeasure = buf[3];
        let ticksPerBeat = buf[4];
        let measures = buf[5];
        let numTracks = buf[6];
        let ticksPerStep = Math.max(1, ticksPerBeat / 4);
        seq.length = Math.max(1, Math.floor(measures * beatsPerMeasure * ticksPerBeat / ticksPerStep));

        // for the optional velocity section: per-hit index of the note event it came from
        let hitEvent: number[] = [];
        let trackIds: number[] = [];
        let trackFirstEvent: number[] = [];
        let trackEventCount: number[] = [];
        let eventIndex = 0;

        let offset = 7;
        for (let t = 0; t < numTracks && offset + 4 <= buf.length; t++) {
            let id = buf[offset];
            let isDrum = buf[offset + 1] != 0;
            let headerLength = u16(buf, offset + 2); // drum kit (or instrument) bytes
            let octave = isDrum ? 0 : buf[offset + 4 + 27];
            let noteStart = offset + 4 + headerLength;
            let noteBytes = u16(buf, noteStart);
            let p = noteStart + 2;
            let end = p + noteBytes;

            trackIds.push(id);
            trackFirstEvent.push(eventIndex);
            let count = 0;

            while (p < end && p + 5 <= buf.length) {
                let step = Math.floor(u16(buf, p) / ticksPerStep);
                let polyphony = buf[p + 4];
                for (let i = 0; i < polyphony; i++) {
                    let raw = buf[p + 5 + i];
                    // drum track: the drum's row; melodic: pitch class (song note 1 = C)
                    let event = isDrum ? raw : (((raw & 0x3f) + (octave - 2) * 12 - 1) % 12 + 12) % 12;
                    if (event < 0 || event >= EVENT_COUNT || step >= seq.length) continue;
                    seq.steps.push(step);
                    seq.lengths.push(1);
                    seq.events.push(event);
                    seq.velocities.push(127);
                    seq.drawnNotes.push(0);
                    seq.notes.push(0);
                    seq.presets.push(0);
                    hitEvent.push(eventIndex);
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
            let ti = trackIds.indexOf(buf[offset]);
            if (ti < 0) break;
            let first = trackFirstEvent[ti];
            let count = trackEventCount[ti];
            for (let e = 0; e < count; e++) {
                let v = Math.min(127, buf[offset + 1 + e]);
                for (let n = 0; n < hitEvent.length; n++) {
                    if (hitEvent[n] == first + e) seq.velocities[n] = v;
                }
            }
            offset += 1 + count;
        }
        return seq;
    }

    /**
     * An event sequence: click it to place hits on a drum grid. Each row fires one of
     * 12 events ("on sequencer event"): the bottom row
     * ("neutral kick") is event 1, up to "low tom" = event 12. Play, cue and stop it like a sequence.
     */
    //% blockId=synth_event_sequence_create
    //% block="event sequence $song"
    //% song.fieldEditor=pianoroll
    //% song.fieldOptions.decompileLiterals=true
    //% song.fieldOptions.taggedTemplate="hex"
    //% song.fieldOptions.decompileArgumentAsString="true"
    //% song.fieldOptions.showSnapControls=true
    //% song.fieldOptions.showTimeSignature=true
    //% song.fieldOptions.singleTrack=true
    //% song.snippet="hex`007800040801010901050000000000000600000001000100`"
    //% blockSetVariable=myEvents
    //% duplicateShadowOnDrag
    //% group="Event sequencer" weight=12
    export function createEventSequence(song: Buffer): EventSequence {
        return decodeEventSequence(song);
    }

    /**
     * Run code when a playing event sequence reaches a hit on this event's row.
     * velocity is the hit's velocity (0-127). Every event sequence fires the same 12 events.
     */
    //% blockId=synth_on_sequencer_event
    //% block="on sequencer $event $velocity"
    //% draggableParameters="reporter"
    //% group="Event sequencer" weight=11
    export function onSequencerEvent(event: SequencerEvent, handler: (velocity: number) => void): void {
        eventHandlerEvents.push(event);
        eventHandlers.push(handler);
    }

    /**
     * Fire a sequencer event yourself, as if an event sequence had reached it.
     */
    //% blockId=synth_fire_sequencer_event
    //% block="fire sequencer $event||velocity $velocity"
    //% velocity.min=0 velocity.max=127 velocity.defl=127
    //% group="Event sequencer" weight=10
    export function fireEvent(event: SequencerEvent, velocity?: number): void {
        fireSequencerEvent(event, velocity === undefined ? 127 : velocity);
    }
}
