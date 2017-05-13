/**
 * @name          BaseUploadProgressPage
 * @description   Base page class for an upload progress popup in Ionic v2+ apps
 * @author        Abraham Lopez <ablopez824@gmail.com>
 */

import { Translate } from './../../providers/translate';
import { Translator } from './../../providers/translator';
import { UI } from '../../libs/ui';
import { ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, Events, AlertController } from 'ionic-angular';

export class BaseUploadProgressPage {
  public progress: number = 0;
  public fileName: string = '';
  public tr: Translate;

  /* Dependency injections */
  public navCtrl: NavController;
  public navParams: NavParams;
  protected alertCtrl: AlertController;
  protected events: Events;
  protected changeDetector: ChangeDetectorRef;

  constructor(translator: Translator, fileName: string) {
    this.tr = new Translate(translator, 'UploadProgress');
    this.tr.register('es', [
      ['Cancel', 'Cancelar'],
      ['Are you sure you want to cancel the upload?', '¿Está seguro(a) que desea cancelar el envío?'],
      ['Uploading %s, please wait...', 'Subiendo %s, por favor espere...']
    ]);

    this.fileName = fileName;
  }

  ionViewDidLoad() {
    this.events.subscribe('upload-progress:update', (progress: number, fileName?: string) => {
      //console.log('[UploadProgressPage] Progress updated: ' + progress + '%');
      this.progress = progress;
      if(fileName) this.fileName = fileName;
      this.changeDetector.detectChanges();
    });
  }

  ionViewWillUnload() {
    this.events.unsubscribe('upload-progress:update');
  }

  cancel() {
    UI.confirm(this.alertCtrl, this.tr._('Cancel'), this.tr._('Are you sure you want to cancel the upload?'), () => {
      this.events.publish('upload-progress:cancel');
    });
  }
}