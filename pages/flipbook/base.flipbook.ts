/**
 * @name          BaseFlipbookPage
 * @description   Page base class for Ionic v3+ apps to allow users browse an image catalog (as a horizontal slider), with integrated lazy loading and full support for pinch-to-zoom, bookmarks, comments per image, social sharing (Cordova plugin required), and saving to photo gallery (Cordova plugin required)
 * @author        Abraham Lopez <ablopez824@gmail.com>
 */

import { DomSanitizer } from '@angular/platform-browser';
import { UI } from './../../libs/ui';
import { Translator } from './../../providers/translator';
import { Translate } from './../../providers/translate';
import { Component } from '@angular/core';
import { NavController, NavParams, Slides, Events, PopoverController, ViewController, ToastController } from 'ionic-angular';

/* The 3 optional dependencies below have been commented out and "any" has been used in this class instead of them to allow this class to compile even if these optional dependencies are missing */
//import { SocialSharing } from "@ionic-native/social-sharing";
//import { PhotoLibrary, LibraryItem } from '@ionic-native/photo-library';

export interface FlipbookImage {
  url: string;
  id?: any;
  comments?: string;
  bookmark?: string;
}

class Bookmark {
  public name: string;
  public index: number;
  public image_id: any;
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
    this.bookmarks = this.navParams.get('bookmarks');
  }

  select(bookmark: Bookmark){
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

export class BaseFlipbookPage {
  public title: string;
  public images: FlipbookImage[];
  public comments: string;
  public activeIndex: number;
  public headerVisible: boolean = true;
  public footerVisible: boolean = false;
  public bookmarks: Bookmark[];
  public allowSharing: boolean = false;
  public allowSaving: boolean = false;
  public showSaveLabel: boolean = true;
  public saveAlbumName: string = 'App Images';
  public lazyLoadOffset: number = 2; // Lazy load this number of slides before and after the current slide

  protected navCtrl: NavController;
  protected navParams: NavParams;
  protected events: Events;
  protected toastCtrl: ToastController;
  protected popoverCtrl: PopoverController;
  protected sanitizer: DomSanitizer;
  protected sharing: any;
  protected photoLibrary: any;
  
  public tr: Translate;
  protected slides: Slides;

  private zoomDetectionTimer;
  private wasZoomed = false;
  private tappingBlocked = false;

  constructor(translator: Translator) {
    this.tr = new Translate(translator, 'Flipbook');

    this.tr.register('es', [
      ['The image has been saved to your device\'s photo gallery.', 'La imagen ha sido guardada en la galeria de fotos de su dispositivo.'],
      ['Sorry, the image could not be saved at this moment.', 'Lo sentimos, la imagen no pudo ser guardada en éste momento.'],
      ['Sorry, an error ocurred and the image could not be saved.', 'Lo sentimos, ocurrió un error y la imagen no pudo ser guardada.'],
      ['Sorry, your device didn\t allow permission to save images to your photo gallery.', 'Lo sentimos, su dispositivo no otorgo permiso para guardar imagenes en la galería de fotos.'],
      ['Save', 'Guardar']
    ]);
  }
  
  init() {
    this.title = this.navParams.get('title') || '';
    this.activeIndex = this.navParams.get('index') || 0;
    this.bookmarks = [];

    if(this.navParams.get('bookmarks')){
      this.bookmarks = this.navParams.get('bookmarks');
    }

    if(this.navParams.get('allowSharing')){
      this.allowSharing = true;
    }

    if(this.navParams.get('allowSaving')){
      this.allowSaving = true;
    }

    if(this.navParams.get('showSaveLabel')){
      this.showSaveLabel = true;
    }

    if(this.navParams.get('saveAlbumName')){
      this.saveAlbumName = this.navParams.get('saveAlbumName');
    }

    if(this.navParams.get('images')){
      let images: FlipbookImage[] = this.navParams.get('images');

      if(images.length != 0){
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
              this.bookmarks.push(<Bookmark>{
                name: item.bookmark,
                index: index
              });
            }
          }
        }
      } else console.warn('[Flipbook] No images were passed.');
    } else throw new Error('[Flipbook] The "images" parameter should be passed to the FlipbookPage instance.');
    
    console.log('BOOKMARKS: ', this.bookmarks);
    console.log('IMAGES: ', this.images);

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

    this.events.subscribe('flipbook:slideToImageId', (imageId: number) => {
      this.slideToImageId(imageId);
    });

    this.slideChanged();
  }

  ionViewWillLeave() {
    this.events.unsubscribe('flipbook:slideTo');
    this.events.unsubscribe('flipbook:slideToImageId');
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

  getCurrentImageURL() {
    return this.images[this.activeIndex].url;
  }

  shareImage() {
    this.sharing.share(this.comments, this.title, this.getCurrentImageURL());
  }

  saveImage() {
    console.log('[Flipbook.saveImage] Image: ', this.getCurrentImageURL());
    console.log('[Flipbook.saveImage] Requesting authorization...');
    
    this.photoLibrary.requestAuthorization().then(() => {
      console.log('[Flipbook.saveImage] Authorized. Saving image...');
      this.photoLibrary.saveImage(this.getCurrentImageURL(), this.saveAlbumName).then((libraryItem: any) => {
        console.log('[Flipbook.saveImage] Success:', libraryItem);
        UI.toast(this.toastCtrl, this.tr._('The image has been saved to your device\'s photo gallery.'));
      }, (reason) => {
        console.warn('[Flipbook.saveImage] Rejected:', reason);
        UI.toast(this.toastCtrl, this.tr._('Sorry, the image could not be saved at this moment.'));
      }).catch((error) => {
        console.error('[Flipbook.saveImage] Error:', error);
        UI.toast(this.toastCtrl, this.tr._('Sorry, an error ocurred and the image could not be saved.'));
      });
    }, (reason) => {
      console.warn('[Flipbook.saveImage] Authorization denied. Reason:', reason);
      UI.toast(this.toastCtrl, this.tr._('Sorry, your device didn\t allow permission to save images to your photo gallery.'));
    }).catch((error) => {
      console.error('[Flipbook.saveImage] Authorization denied. Error:', error);
      UI.toast(this.toastCtrl, this.tr._('Sorry, your device didn\t allow permission to save images to your photo gallery.'));
    });
  }

  slideTo(index: number){
    this.slides.slideTo(Math.min(index, (this.images.length - 1)));
  }

  slideToImageId(imageId: number){
    let index = -1;

    for(let slide of this.images){
      index ++;

      if(slide.id === imageId){
        this.slideTo(index);
        break;
      }
    }

    console.warn('[BaseFlipbookPage.slideToImageId] Image ID not found: ' + imageId);
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
      if(index < 0 || index > this.images.length - 1) continue;

      let slide: any = document.getElementById('flipbook_slide_' + index);
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