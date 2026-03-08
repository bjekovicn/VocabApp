import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '@core/services/i18n.service';
import { CustomSelectComponent } from '@shared/select/custom-select';
import { CustomButtonComponent } from '@shared/button/custom-button';
import { CustomCardComponent } from '@shared/card/custom-card';
import { DirectionSelectorComponent } from '../components/direction-selector/direction-selector.component';
import { FlipCardPracticeComponent } from '../components/flip-card-practice/flip-card-practice.component';
import { PracticeTypeSelectorComponent } from '../components/practice-type-selector/practice-type-selector.component';
import { QuizPracticeComponent } from '../components/quiz-practice/quiz-practice.component';
import { ShuffleSelectorComponent } from '../components/shuffle-selector/shuffle-selector.component';
import { FilterSelectorComponent } from '../components/filter-selector/filter-selector.component';
import { PracticeFacade } from './practice.facade';

@Component({
  selector: 'app-practice-page',
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomSelectComponent,
    FlipCardPracticeComponent,
    QuizPracticeComponent,
    DirectionSelectorComponent,
    PracticeTypeSelectorComponent,
    ShuffleSelectorComponent,
    FilterSelectorComponent,
  ],
  templateUrl: './practice.component.html',
})
export class PracticeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly facade = inject(PracticeFacade);
  protected readonly i18n = inject(I18nService);

  protected readonly state = this.facade.state;
  protected readonly errorMessage = this.facade.errorMessage;
  protected readonly selectedDirection = this.facade.selectedDirection;
  protected readonly selectedType = this.facade.selectedType;
  protected readonly selectedMode = this.facade.selectedMode;
  protected readonly practiceWords = this.facade.practiceWords;
  protected readonly selectedListId = this.facade.selectedListId;
  protected readonly shuffleEnabled = this.facade.shuffleEnabled;
  protected readonly selectedFilter = this.facade.selectedFilter;
  protected readonly listOptions = this.facade.listOptions;
  protected readonly selectedListSummary = this.facade.selectedListSummary;
  protected readonly filterOptions = this.facade.filterOptions;
  protected readonly availableWords = this.facade.availableWords;
  protected readonly stats = this.facade.stats;
  protected readonly startButtonLabel = this.facade.startButtonLabel;

  public constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.facade.applyPreset(params.get('filter'));
    });
  }

  public startPractice(): void {
    this.facade.startPractice();
  }

  public handleDirectionChange(direction: string): void {
    this.facade.setDirection(direction);
  }

  public handleTypeChange(type: string): void {
    this.facade.setType(type);
  }

  public handleShuffleChange(shuffled: boolean): void {
    this.facade.setShuffleEnabled(shuffled);
  }

  public handleFilterChange(filter: string): void {
    this.facade.setFilter(filter);
  }

  public async handlePracticeFinished(results: Parameters<PracticeFacade['finishPractice']>[0]): Promise<void> {
    await this.facade.finishPractice(results);
  }

  public restartPractice(): void {
    this.facade.restartPractice();
  }

  public goHome(): void {
    this.router.navigate(['/']);
  }
}
