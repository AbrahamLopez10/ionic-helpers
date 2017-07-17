import { Util } from './../libs/util';
import { UI } from './../libs/ui';
import { Translator } from './translator';
import { AlertController } from 'ionic-angular';
import { Translate } from './translate';
import { AbstractAPIService } from "./abstract-api-service";

export class AbstractQueue<T> {
  protected api: AbstractAPIService;
  protected alertCtrl: AlertController;
  protected tr: Translate;
  protected queue: T[] = [];
  protected T_Class: any;

  protected STORAGE_KEY = 'queue';

  constructor(translator: Translator, T_Class?: any) {
    this.tr = new Translate(translator);
    if(T_Class) this.T_Class = T_Class;
  }

  async load() {
    try{
        let queueJson = await this.api.getCacheItem(this.STORAGE_KEY);
        
        if(queueJson){
            let queue: T[] = Util.parseJSON(queueJson);

            if(queue instanceof Array){
                if(this.T_Class){
                    let T_Class = this.T_Class;
                    this.queue = queue.map(item => new T_Class(item));
                } else {
                    this.queue = queue;
                }
            }
        }
    } catch(error){
      UI.alert(this.alertCtrl, this.tr._('Queue load error: ', error));
    }
  }

  async save() {
    let queueJson = JSON.stringify(this.queue);
    await this.api.setCacheItem(this.STORAGE_KEY, queueJson);
  }

  getItems() {
      return this.queue.slice();
  }

  getCount() {
    return this.queue.length;
  }

  push(item: T) {
    this.queue.push(item);
    this.save();
  }

  peek(): T {
      return this.queue.length != 0 ? this.queue[0] : null;
  }

  pop(): T {
      if(this.queue.length == 0) return null;
      let item = this.queue.shift();
      this.save();
      return item;
  }
}