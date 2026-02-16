import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-word-progress-badges',
  imports: [NgClass],
  templateUrl: './word-progress-badges.component.html',
})
export class WordProgressBadgesComponent {
  repetitions = input.required<number>();
  correctCount = input.required<number>();
  incorrectCount = input.required<number>();
  easeFactor = input.required<number>();
  daysSinceReview = input.required<number>();

  effectiveRepetitions = computed(() => {
    const total = this.correctCount() + this.incorrectCount();
    return this.repetitions() === 0 && total > 0 ? total : this.repetitions();
  });

  scoreRatio = computed(() => {
    const total = this.correctCount() + this.incorrectCount();
    return total === 0 ? null : this.correctCount() / total;
  });
}
