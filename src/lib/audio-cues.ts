/**
 * Timeline of the theme song, in seconds of the audio file.
 *
 * SONG_START is where playback begins when the visitor boards.
 * BUZZER_AT is the buzzer the build-up lands on: the alarm clock rings.
 * Measured against the waveform (a sustained ~750 Hz tone from 21.85 s to
 * 22.15 s); nudge this if the ring feels early or late.
 */
export const SONG_START = 11.0;
export const BUZZER_AT = 21.85;
/** The ringing clock becomes an airplane. */
export const TAKEOFF_AT = BUZZER_AT + 0.7;
/** The overlay clears and the site is live. */
export const REVEAL_AT = TAKEOFF_AT + 1.5;
/** Volume after the intro, once the song is a bed rather than the show. */
export const CRUISE_VOLUME = 0.55;
export const INTRO_VOLUME = 0.9;
