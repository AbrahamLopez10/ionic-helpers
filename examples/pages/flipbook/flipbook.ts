/*
import { NavController, NavParams, Slides } from 'ionic-angular';
import { BaseFlipbookPage } from '../../ionic2-helpers/pages/flipbook/base.flipbook';
import { Component, ViewChild } from '@angular/core';

// Be sure to import ZoomPanDirective and FlipbookPage in your app.module.ts
// Both should be added to the declarations of @NgModule and FlipbookPage in the entryComponents
@Component({
  selector: 'page-flipbook',
  templateUrl: '../../ionic2-helpers/pages/flipbook/flipbook.html'
})
export class FlipbookPage extends BaseFlipbookPage {
  @ViewChild('flipbook')
  protected slides: Slides;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams
  ) {
    super();
    this.init();
  }
}
*/

/*
INSTRUCTIONS:
--------------------
To open the flipbook just create a ModalController using FlipbookPage and pass the following NavParams:
- title: string (optional)
- images: FlipbookImage[] (required)

EXAMPLE:
--------------------
this.modalCtrl.create(FlipbookPage, {
  title: 'Title',
  images: [
    {
      url: '...', // required
      comments: '...' //optional
    },
    {
      url: '...', // required
      comments: '...' //optional
    }
  ]
}).present();
*/