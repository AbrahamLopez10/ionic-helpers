/*
====================
INSTRUCTIONS:
====================
1. Install the Photo Library plugin from Ionic Native, which is required by the "allowSaving" feature (see Usage below).
   To install run the following command in shell:
----
  npm install --save @ionic-native/photo-library && \
  ionic plugin add cordova-plugin-photo-library --variable PHOTO_LIBRARY_USAGE_DESCRIPTION="This is required by the app to save images."
----

Then import PhotoLibrary in the app.module.ts file and add it the "providers" section there.

2. Install the SocialSharing plugin form Ionic Native, which is required by the "allowSharing" feature (see Usage below):
----
  npm install --save @ionic-native/social-sharing
----

Then import SocialSharing in the app.module.ts file and add it the "providers" section there.

3. Import ZoomPanDirective and FlipbookPage in your app.module.ts and add both of them to the "declarations" there.

4. Add FlipbookPage to the "entryComponents" of the app.module.ts file.

====================
USAGE:
====================
To open the flipbook just create a ModalController using FlipbookPage and pass the following NavParams:
- title: string (optional)
- activeIndex: number (optional)
- allowSharing: boolean (optional, false by default)
- allowSaving: boolean (optional, false by default)
- saveAlbumName: string (optional, "App Images" by default)
- images: FlipbookImage[] (required)

====================
EXAMPLE:
====================
this.modalCtrl.create(FlipbookPage, {
  title: 'Title', // optional
  activeIndex: 1, // optional
  allowSharing: true,
  allowSaving: true,
  saveAlbumName: 'My Album Name',
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
/*
import { NavController, NavParams, Slides, Events, PopoverController, ToastController } from 'ionic-angular';
import { BaseFlipbookPage } from '../../ionic2-helpers/pages/flipbook/base.flipbook';
import { Component, ViewChild } from '@angular/core';
import { Translator } from './../../ionic2-helpers/providers/translator';
import { DomSanitizer } from '@angular/platform-browser';
import { PhotoLibrary } from '@ionic-native/photo-library';
import { SocialSharing } from '@ionic-native/social-sharing';

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
    protected toastCtrl: ToastController,
    protected popoverCtrl: PopoverController,
    protected sanitizer: DomSanitizer,
    protected sharing: SocialSharing,
    protected photoLibrary: PhotoLibrary,
    private translator: Translator
  ) {
    super(translator);
    this.init();
  }
}
*/