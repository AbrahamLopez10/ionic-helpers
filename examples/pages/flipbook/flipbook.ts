/*
====================
INSTRUCTIONS:
====================
1. Install the SocialSharing plugin from Ionic Native, which is required by the "allowSharing" feature (see Usage below):
----
  npm install --save @ionic-native/social-sharing && \
  ionic plugin add cordova-plugin-x-socialsharing --save
----

Or if using PhoneGap Build just run "npm install --save @ionic-native/social-sharing" and add the following to your config.xml:
----
  <plugin name="cordova-plugin-x-socialsharing" version="5.1.7" source="npm"/>
----

Then import SocialSharing (@ionic-native/social-sharing) in the app.module.ts file and add it the "providers" section there.

2. Install the PhotoLibrary plugin from Ionic Native:
----
   npm install --save @ionic-native/photo-library && \
   ionic plugin add cordova-plugin-photo-library --save --variable PHOTO_LIBRARY_USAGE_DESCRIPTION="This is required by the app to save images."
----

Or if using PhoneGap Build just run "npm install --save @ionic-native/photo-library" and add the following to your config.xml:
----
  <plugin name="cordova-plugin-photo-library" version="2.0.4" source="npm">
      <variable name="PHOTO_LIBRARY_USAGE_DESCRIPTION" value="This is required by the app to save images." />
  </plugin>
----

Then import PhotoLibrary (@ionic-native/photo-library) in the app.module.ts file and add it the "providers" section there.

3. Import ZoomPanDirective, FlipbookPage, and FlipbookBookmarksPopover in your app.module.ts and add all of them to the "declarations" there.

4. Add FlipbookPage and FlipbookBookmarksPopover to the "entryComponents" of the app.module.ts file.

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
import { BaseFlipbookPage } from '../../ionic-helpers/pages/flipbook/base.flipbook';
import { Component, ViewChild } from '@angular/core';
import { Translator } from './../../ionic-helpers/providers/translator';
import { DomSanitizer } from '@angular/platform-browser';
import { PhotoLibrary } from '@ionic-native/photo-library';
import { SocialSharing } from '@ionic-native/social-sharing';

@Component({
  selector: 'page-flipbook',
  templateUrl: '../../ionic-helpers/pages/flipbook/flipbook.html'
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