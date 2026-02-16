import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-word-progress-badges',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './word-progress-badges.component.html',
})
export class WordProgressBadgesComponent {
  repetitions = input.required<number>();
  correctCount = input.required<number>();
  incorrectCount = input.required<number>();
  easeFactor = input.required<number>();
  daysSinceReview = input.required<number>();

  getEffectiveRepetitions(): number {
    const total = this.correctCount() + this.incorrectCount();
    if (this.repetitions() === 0 && total > 0) return total;
    return this.repetitions();
  }

  getRepetitionsBg(): string {
    const reps = this.getEffectiveRepetitions();
    if (reps >= 5) return 'bg-green-100 text-green-700';
    if (reps >= 2) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  }

  getEaseFactorBg(): string {
    const ease = this.easeFactor();
    if (ease >= 2.5) return 'bg-green-100 text-green-700';
    if (ease >= 2.0) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }
}
