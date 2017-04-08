/*
import { SocialSharing } from '@ionic-native/social-sharing';
import { NavController, NavParams, Slides, Events, PopoverController } from 'ionic-angular';
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
    public navParams: NavParams,
    protected events: Events,
    protected popoverCtrl: PopoverController,
    protected sharing: SocialSharing
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
- activeIndex: number (optional)
- allowSharing: boolean (optional, false by default)
- images: FlipbookImage[] (required)

EXAMPLE:
--------------------
this.modalCtrl.create(FlipbookPage, {
  title: 'Title', // optional
  activeIndex: 1, // optional
  allowSharing: true,
  images: [
    {
      url: '...', // required
      comments: '...' // optional,
      bookmark: 'Bookmark Name' // optional
    },
    {
      url: '...', // required
      comments: '...' //optional
    }
  ]
}).present();
*/