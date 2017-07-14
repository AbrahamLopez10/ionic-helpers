import { FlipbookBookmark } from './base.flipbook';
import { Component } from '@angular/core';
import { IonicPage, NavParams, Events, ViewController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'flipbook-bookmarks',
  template: `
    <ion-list>
      <button *ngFor="let bookmark of bookmarks" ion-item (click)="select(bookmark)">
        {{bookmark.name}}
      </button>
    </ion-list>
  `
})
export class FlipbookBookmarksPopover {
  public bookmarks: FlipbookBookmark[];

  constructor(
    private navParams: NavParams,
    private events: Events,
    private viewCtrl: ViewController
  ){
    this.bookmarks = this.navParams.get('bookmarks');
  }

  select(bookmark: FlipbookBookmark){
    if(bookmark.index){
      this.events.publish('flipbook:slideTo', bookmark.index);
    } else if(bookmark.image_id){
      this.events.publish('flipbook:slideToImageId', bookmark.image_id);
    } else {
      throw new Error('[BaseFlipbookPage] Bookmark doesn\'t point to an index or an image_id.');
    }
    
    this.viewCtrl.dismiss();
  }
}