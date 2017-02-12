import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Slides } from 'ionic-angular';

export interface FlipbookImage {
  url: string;
  comments?: string;
}

export class BaseFlipbookPage {
  public title: string;
  public images: FlipbookImage[];
  public comments: string;
  public activeIndex: number;
  public headerVisible: boolean = true;
  public footerVisible: boolean = false;
  private zoomDetectionTimer;
  private wasZoomed = false;
  private tappingBlocked = false;

  @ViewChild('flipbook')
  private slides: Slides;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
  ) {
    this.title = navParams.get('title');
    this.images = navParams.get('images');
    this.activeIndex = navParams.get('index') || 0;
    
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
      let index = Math.min(this.activeIndex, (this.images.length - 1));
      this.slides.slideTo(index);
    }

    this.updateComments();
  }

  ionViewWillLeave() {
    clearInterval(this.zoomDetectionTimer);
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
  
  slideChanged() {
    let index = Math.min(Math.max(0, this.slides.getActiveIndex()), (this.images.length - 1));
    this.activeIndex = index;
    this.updateComments();
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