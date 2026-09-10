/** Standard guitar tuning (low to high): E2, A2, D3, G3, B3, E4 */
export const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] as const;

/** Standard tuning MIDI note numbers (low to high) */
export const STANDARD_TUNING_MIDI = [40, 45, 50, 55, 59, 64] as const;

/** Minimum fret number */
export const MIN_FRET = 0;

/** Maximum fret number */
export const MAX_FRET = 24;

/** Number of strings on a standard guitar */
export const STRING_COUNT = 6;

/** Maximum comfortable fret span in a single hand position */
export const MAX_FRET_SPAN = 5;
