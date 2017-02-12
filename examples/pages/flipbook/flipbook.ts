import { BaseFlipbookPage } from '../../../pages/flipbook/flipbook'; // '../ionic2-helpers/pages/flipbook/flipbook';
import { Component } from '@angular/core';

// REQUIRES: ZoomPanDirective
// Be sure to import ZoomPanDirective in your app.module.ts and put it in the @NgModule declarations
@Component({
  selector: 'page-flipbook',
  templateUrl: '../../../pages/flipbook/flipbook.html' // '../ionic2-helpers/pages/flipbook/flipbook.html'
})
class FlipbookPage extends BaseFlipbookPage {

}