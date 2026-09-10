import { useState } from 'react';
import { Badge } from '../ui/badge.tsx';
import type { ConfidenceReport } from '../../types/confidence.ts';

interface ConfidenceDisplayProps {
  report: ConfidenceReport;
}

const confidenceColors = {
  high: 'success',
  medium: 'warning',
  low: 'destructive',
} as const;

const confidenceLabels = {
  high: 'High Confidence',
  medium: 'Medium Confidence',
  low: 'Low Confidence',
} as const;

const severityIcons = {
  info: '💡',
  warning: '⚠️',
  critical: '🚨',
};

export function ConfidenceDisplay({ report }: ConfidenceDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={confidenceColors[report.overallConfidence]}>
            {confidenceLabels[report.overallConfidence]}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Note accuracy: {Math.round(report.averageNoteConfidence * 100)}%
          </span>
        </div>

        {report.warnings.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary hover:underline"
            aria-expanded={expanded}
          >
            {expanded ? 'Hide' : `${report.warnings.length} warning${report.warnings.length > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {expanded && report.warnings.length > 0 && (
        <ul className="mt-3 space-y-2">
          {report.warnings.map((warning, index) => (
            <li
              key={index}
              className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-sm"
            >
              <span className="shrink-0">{severityIcons[warning.severity]}</span>
              <span>{warning.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
