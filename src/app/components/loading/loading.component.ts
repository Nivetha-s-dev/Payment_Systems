import { Component } from '@angular/core';
import { LoadingService } from '../../services/loading.service';

@Component({
    selector: 'app-loading',
    template: `
    <div class="loading-overlay" *ngIf="loading$ | async">
      <mat-spinner diameter="48"></mat-spinner>
    </div>
  `,
    styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
  `]
})
export class LoadingComponent {
    loading$ = this.loadingService.loading$;

    constructor(private loadingService: LoadingService) {}
}
