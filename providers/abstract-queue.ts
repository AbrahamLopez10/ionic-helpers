import { Util } from './../libs/util';
import { AbstractAPIService } from "./abstract-api-service";
import { sprintf } from "../libs/sprintf";

export abstract class AbstractQueue<T> {
  protected api: AbstractAPIService;
  protected items: T[] = [];
  protected T_Class: any;
  private storageKey: string;
  private timer: number;

  protected INTERVAL = 5000;

  constructor(T_Class?: any, storageKey?: string) {
    this.storageKey = storageKey ? storageKey : this.constructor.name;
    if(T_Class) this.T_Class = T_Class;
    this.log('Instantiated');
  }

  abstract process(): void;

  start() {
    this.log('Started');

    this.timer = setInterval(() => {
      if(this.items.length != 0){
        this.log('Processing...'); 
        this.process();
      } else {
        this.log('Empty queue, waiting.');
      }
    }, this.INTERVAL);
  }

  stop() {
    this.log('Stopped');
    clearInterval(this.timer);
  }

  init() {
      this.load();
      this.start();
  }

  log(...params) {
      if(typeof params[0] == 'string'){
          params[0] = `[${this.constructor.name}] ` + params[0];
      }

      console.log.apply(this, params);
  }

  async load() {
    this.log('Loading');

    try{
      let queueJson = await this.api.getCacheItem(this.storageKey);
      
      if(queueJson){
          let queue: T[] = Util.parseJSON(queueJson);

          if(queue instanceof Array){
              if(this.T_Class){
                  let T_Class = this.T_Class;
                  this.items = queue.map(item => new T_Class(item));
              } else {
                  this.items = queue;
              }

              this.log('Loaded: ', queue);
          } else {
            this.log('Retrieved queue data is invalid: ', queueJson); 
          }
      } else {
        this.log('Retrieved queue is empty.'); 
      }
    } catch(error){
      console.error(sprintf('%s load error: ', this.constructor.name, error));
    }
  }

  async save() {
    let queueJson = JSON.stringify(this.items);
    await this.api.setCacheItem(this.storageKey, queueJson);
  }

  find(key, value) {
    for(let item of this.items){
      if(item[key] === value){
        return item;
      }
    }

    return null;
  }

  getItems(byRef: boolean = false) {
      return byRef ? this.items : this.items.slice();
  }

  getCount() {
    return this.items.length;
  }

  push(item: T) {
    this.items.push(item);
    this.log('Pushed item: ', item);
    this.save();
  }

  peek(): T {
      return this.items.length != 0 ? this.items[0] : null;
  }

  pop(): T {
      if(this.items.length == 0) return null;
      let item = this.items.shift();
      this.log('Popped item: ', item);
      this.save();
      return item;
  }

  popToBack(): T {
    if(this.items.length == 0) return null;
    let item = this.items.shift();
    this.items.push(item);
    this.log('Popped item to back: ', item);
    this.save();
    return item;
  }
}