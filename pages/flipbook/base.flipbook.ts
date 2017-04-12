import { Component } from '@angular/core';
import { NavController, NavParams, Slides, Events, PopoverController, ViewController } from 'ionic-angular';
import { SocialSharing } from "@ionic-native/social-sharing";

export interface FlipbookImage {
  url: string;
  comments?: string;
  bookmark?: string;
}

class Bookmark {
  public name: string;
  public index: number;
}

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
  public bookmarks: Bookmark[];

  constructor(
    private navParams: NavParams,
    private events: Events,
    private viewCtrl: ViewController
  ){
    this.bookmarks = navParams.get('bookmarks');
  }

  select(bookmark: Bookmark){
    this.events.publish('flipbook:slideTo', bookmark.index);
    this.viewCtrl.dismiss();
  }
}

export class BaseFlipbookPage {
  public title: string;
  public images: FlipbookImage[];
  public comments: string;
  public activeIndex: number;
  public headerVisible: boolean = true;
  public footerVisible: boolean = false;
  public bookmarks: Bookmark[];
  public allowSharing: boolean = false;
  public lazyLoadOffset: number = 2; // Lazy load this number of slides before and after the current slide

  protected navCtrl: NavController;
  protected navParams: NavParams;
  protected events: Events;
  protected popoverCtrl: PopoverController;
  protected sharing: SocialSharing;
  
  protected slides: Slides;

  private zoomDetectionTimer;
  private wasZoomed = false;
  private tappingBlocked = false;

  init() {
    this.title = this.navParams.get('title') || '';
    this.activeIndex = this.navParams.get('index') || 0;
    this.bookmarks = [];

    if(this.navParams.get('allowSharing')){
      this.allowSharing = true;
    }

    if(this.navParams.get('images')){
      let images: FlipbookImage[] = this.navParams.get('images');

      this.images = [];

      let index = -1;

      for(let item of images){
        index ++;

        if(typeof item == 'string'){
          this.images.push({
            url: item
          });
        } else if(typeof item == 'object'){
          this.images.push(item as FlipbookImage);

          if(item.bookmark){
            this.bookmarks.push({
              name: item.bookmark,
              index: index
            });
          }
        }
      }
    } else throw new Error('[Flipbook] The "images" parameter should be passed to the FlipbookPage instance.');
    
    this.zoomDetectionTimer = setInterval(() => {
      let isZoomed = this.isSliderZoomed();

      if(isZoomed !== null && this.wasZoomed != isZoomed && !this.tappingBlocked){
        this.headerVisible = !isZoomed;
        this.footerVisible = !isZoomed && this.hasComments();
        this.wasZoomed = isZoomed;
      }
    }, 500);
  }

  ionViewDidEnter() {
    if(this.activeIndex > 0){
      this.slideTo(this.activeIndex);
    }

    this.events.subscribe('flipbook:slideTo', (index: number) => {
      this.slideTo(index);
    });

    this.slideChanged();
  }

  ionViewWillLeave() {
    this.events.unsubscribe('flipbook:slideTo');
    clearInterval(this.zoomDetectionTimer);
  }

  showBookmarks(event: Event) {
    let popover = this.popoverCtrl.create(FlipbookBookmarksPopover, {
      bookmarks: this.bookmarks
    });

    popover.present({
      ev: event
    });
  }

  shareImage() {
    let image = this.images[this.activeIndex];
    this.sharing.share(this.comments, this.title, image.url);
  }

  slideTo(index: number){
    this.slides.slideTo(Math.min(index, (this.images.length - 1)));
  }

  isSliderZoomed(): boolean {
    let slideIndex = this.slides.getActiveIndex();
    let slide = this.slides._slides[slideIndex];

    if(slide){
      let zoomPan = slide.querySelector('[zoom-pan]');
      return (zoomPan.getAttribute('zoomed') !== 'false');
    }
    else return null;
  }

  allowSliding(ev: Event) {
    let isZoomed = this.isSliderZoomed();

    if(isZoomed !== null){
      this.slides.lockSwipes(isZoomed);
    }
  }

  lazyLoad() {
    for(let index = (this.activeIndex - this.lazyLoadOffset); index <= (this.activeIndex + this.lazyLoadOffset); index ++){
      if(index < 0 || index >= this.images.length - 1) continue;

      let slide: HTMLImageElement = document.getElementById('flipbook_slide_' + index) as HTMLImageElement;
      let src = slide.dataset.src;

      if(src != ''){
        console.log('[Flipbook] Preloading index ' + index + ': ' + src);
        slide.src = src;
        slide.dataset.src = '';
      }
    }
  }
  
  slideChanged() {
    let index = Math.min(Math.max(0, this.slides.getActiveIndex()), (this.images.length - 1));
    this.activeIndex = index;
    this.updateComments();
    this.lazyLoad();
  }

  slideTapped() {
    if(this.tappingBlocked) return;

    this.tappingBlocked = true;

    this.headerVisible = !this.headerVisible;
    this.footerVisible = this.headerVisible && this.hasComments();

    setTimeout(() => {
      this.tappingBlocked = false;
    }, 300);
  }

  hasComments(): boolean {
    return this.comments ? true : false;
  }

  updateComments(){
    this.comments = this.images[this.activeIndex].comments;
    this.footerVisible = this.headerVisible && this.hasComments();
  }

  goBack() {
    if(this.headerVisible){
      this.navCtrl.pop();
    }
  }
}