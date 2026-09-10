/** Detectable audio quality issue types */
export type WarningType =
  | 'multiple-singers'
  | 'choir-harmony'
  | 'heavy-distortion'
  | 'spoken-word'
  | 'low-volume'
  | 'short-duration';

/** A specific warning about audio characteristics */
export interface ConfidenceWarning {
  type: WarningType;
  /** User-facing description */
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

/** Metadata about processing quality and detected audio characteristics */
export interface ConfidenceReport {
  songId: string;
  overallConfidence: 'high' | 'medium' | 'low';
  /** Mean confidence across all detected notes (0.0–1.0) */
  averageNoteConfidence: number;
  warnings: ConfidenceWarning[];
  processedAt: Date;
}
