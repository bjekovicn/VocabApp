import { Component, input } from '@angular/core';
import { PracticeMode } from '@core/models/practice-mode.model';
import { ProgressDetail } from '@features/progress/pages/progress-review.component';

@Component({
  selector: 'app-word-progress-table',
  imports: [],
  templateUrl: './word-progress-table.html',
})
export class WordProgressTable {
  details = input<ProgressDetail[]>([]);
  activeMode = input<PracticeMode | null>(null);

  getEaseFactorColor(ease: number): string {
    if (ease >= 2.5) return 'text-green-600';
    if (ease >= 2.0) return 'text-yellow-600';
    return 'text-red-600';
  }

  getRepetitionsBg(reps: number): string {
    if (reps >= 5) return 'bg-green-100 text-green-700';
    if (reps >= 2) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  }

  getEffectiveRepetitions(correct: number, incorrect: number): number {
    return correct + incorrect;
  }
}
