import { Component } from '@angular/core';
import { GlobalState } from '../../services/global.state';

@Component({
  selector: 'is-compare-page',
  templateUrl: './compare-page.component.html'
})
export class ComparePageComponent {
  comparedProducts = [];
  constructor(globalState: GlobalState) {

    globalState.subscribeCachedData('productCompareData', data => {
      this.comparedProducts = data;
    });
  }
}
