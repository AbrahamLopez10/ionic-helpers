/**
 * @name      AbstractAPIService
 * @version   1.1
 * @author    Abraham Lopez <ab@aplimovil.mx>
 */
import { Http, Response, URLSearchParams, Headers, QueryEncoder } from '@angular/http';
import { LoadingController, AlertController, ToastController } from 'ionic-angular';
import 'rxjs/add/operator/toPromise';

import { sha1 } from '../libs/sha1';
import { UI } from '../libs/ui';
import { Util } from '../libs/util';

declare var cordova;

export class Entity {
  constructor(data?: Object) {
    if(data){
      for(var key in data){
        this[key] = data[key];
      }
    }
  }

  asPlainObject() {
    let object: any = {};

    for(var key in this){
      object[key] = this[key];
    }

    return object;
  }
}

export interface UserInterface {
  id: number;
  username: string;
  name: string;
  token: string;
}

export class APIRequestOptions {
  useCache: boolean = false; // If set to true automatically enables useOfflineCache and useFastCache
  useOfflineCache: boolean = false;
  useFastCache: boolean = false;
  showLoader: boolean = true;
  showErrors: boolean = true;

  constructor(data?: Object) {
    if(data){
      for(var key in data){
        this[key] = data[key];
      }
    }
  }
}

class CacheResult {
  data: any;
  timestamp: number;

  constructor(data: any) {
    this.data = data;
    this.timestamp = Util.getTimestamp();
  }
}

class APIQueryEncoder extends QueryEncoder {
  /* This custom implementation of QueryEncoder fixes a bug in Angular's URLSearchParams
  where + signs are encoded as spaces on the XHR request.
  Reference: https://github.com/angular/angular/issues/11058 */
  encodeKey(k: string): string {
      k = super.encodeKey(k);
      return k.replace(/\+/gi, '%2B');
  }
  encodeValue(v: string): string {
      v = super.encodeKey(v);
      return v.replace(/\+/gi, '%2B');
  }
}

export abstract class AbstractAPIService {
  protected API_URL: string = '';
  protected API_KEY: string = '';
  
  protected http: Http;
  protected alertCtrl: AlertController;
  protected loadingCtrl: LoadingController;
  protected toastCtrl: ToastController;
  protected verifyPassword: boolean = true;
  protected secureReads: boolean = false;

  protected ERROR_GENERIC = 'Sorry, an error ocurred, please try again later.';
  protected ERROR_CONNECTION = 'Sorry, your device is offline. Please check your Internet connection and try again.';
  protected ERROR_PASSWORD_INVALID = 'Sorry, your password is incorrect.';
  protected TITLE_ENTER_PASSWORD = 'Confirm Password';
  protected MESSAGE_ENTER_PASSWORD = 'Please enter your password to proceed:';
  protected MESSAGE_OFFLINE = 'Offline';
  protected FAST_CACHE_MAX_AGE = 1; // in minutes
  protected CLEAR_PASSWORD_AFTER = 15; // in minutes

  private cache: Object = {};
  private requestsWaiting: Object = {};
  private _user: UserInterface;
  private _password: string;
  private _appVersion: string;

  /*
  // Add the following constructor in the child class:
  constructor(
    protected http: Http,
    protected alertCtrl: AlertController,
    protected loadingCtrl: LoadingController,
    protected toastCtrl: ToastController
  ){
    super();
  }
  */

  constructor() {
    this.loadCache();

    if(window['cordova'] && cordova.getAppVersion){
      cordova.getAppVersion.getVersionNumber((version) => {
        this._appVersion = version;
      });
    }
  }

  getAppVersion(){
    return this._appVersion;
  }

  getEndpointUrl(endpoint: string): string {
    return this.API_URL + endpoint;
  }

  get<T>(endpoint: string, params: Object, onSuccess: (results: T[]) => void, onError?: (error: string, response?: any) => void, options?: APIRequestOptions, headers: Object = {}): void {
    if(!params) params = {};
    
    options = new APIRequestOptions(options);

    let cacheResult = this.getCacheResult(endpoint, params);

    if(options.useCache){
      options.useFastCache = true;
      options.useOfflineCache = true;
    }

    if(options.useFastCache && cacheResult){
      let age = (Util.getTimestamp() - cacheResult.timestamp) / 60;

      if(age <= this.FAST_CACHE_MAX_AGE){
        onSuccess(cacheResult.data);
        return;
      }
    }
    else if(options.useOfflineCache && !Util.isOnline()){
      if(cacheResult){
        UI.toast(this.toastCtrl, this.MESSAGE_OFFLINE);
        onSuccess(cacheResult.data);
        return;
      }
      else{
        this.handleError(options, this.ERROR_CONNECTION, onError);
      }
    }

    let requestHash = sha1(endpoint + '|' + this.getParamsHash(params));

    if(this.requestsWaiting[requestHash] !== undefined){
      this.requestsWaiting[requestHash].push({
        onSuccess: onSuccess,
        onError: onError
      });

      return;
    }

    this.requestsWaiting[requestHash] = [];

    let loader;
    if(options.showLoader) loader = UI.loader(this.loadingCtrl);

    this.http.get(this.getEndpointUrl(endpoint), {
      search: this.getParams(params),
      headers: new Headers(headers)
    }).toPromise()
      .then((response) => {
        if(loader) loader.dismiss().catch(() => {});
        
        let json = response.json();

        if(json && json.status){
          this.saveResultInCache(endpoint, params, json.results);

          let results = json.results as T[];
          
          onSuccess(results);
          this.runRequestsWaiting(requestHash, results, 'onSuccess');
        }
        else{
          this.handleError(options, json, onError);
          this.runRequestsWaiting(requestHash, json.error, 'onError');
        }
      }).catch((error) => {
        if(loader) loader.dismiss().catch(() => {});
        this.handleError(options, error, onError);
        this.runRequestsWaiting(requestHash, error, 'onError');
      });
  }

  post(endpoint: string, params: Object, onSuccess?: (response?: any) => void, onError?: (error: string, response?: any) => void, options?: APIRequestOptions, headers: Object = {}): void {
    if(!params) params = {};
    
    options = new APIRequestOptions(options);

    let loader;
    if(options.showLoader) loader = UI.loader(this.loadingCtrl);

    this.http.post(this.getEndpointUrl(endpoint), this.getParams(params), {
      headers: new Headers(headers)
    }).toPromise()
      .then((response) => {
        if(loader) loader.dismiss().catch(() => {});
        
        let json = response.json();

        if(json && json.status){
          if(onSuccess) onSuccess(json);
        }
        else this.handleError(options, json, onError);
      }).catch((error) => {
        if(loader) loader.dismiss().catch(() => {});
        this.handleError(options, error, onError);
      });
  }

  create<T>(modelName: string, data: Object, onSuccess: (entity?: T) => void, onError?: (error: string, response: any) => void, onCancel?: Function, excludedFields: string[] = ['id'], options?: APIRequestOptions) {
    this.checkPassword(() => {
      let user = this.getInternalUser();

      let params = {
        _OWNER_ID: user ? user.id : '',
        _OWNER_TOKEN: user ? user.token : '',
        _OWNER_PASSWORD: (this._password || ''),
      };

      for(let key in data){
        let value = data[key];

        if(value !== null && excludedFields.indexOf(key) == -1 && (/string|number|boolean/).test(typeof value)){
          params[key] = value;
        }
      }

      if(!options){
        options = new APIRequestOptions();
        options.showErrors = false;
      }

      this.post('create/' + modelName, params, (response) => {
        this.clearCRUDCache(modelName);
        onSuccess(response.entity as T);
      }, (error, response) => {
        this.onCRUDError(onError, onCancel, error, response);
      }, options);
    }, onCancel);
  }

  read<T>(modelName: string, additionalParams: Object, onSuccess: (results: T[]) => void, onError?: (error: string, response?: any) => void, onCancel?: Function, options?: APIRequestOptions) {
    if(this.secureReads && !this._password){
      this.checkPassword(() => {
        this.read<T>(modelName, additionalParams, onSuccess, onError, null, options);
      }, onCancel);

      return;
    }

    let user = this.getInternalUser();

    let params = {
      _OWNER_ID: user ? user.id : '',
      _OWNER_TOKEN: user ? user.token : ''
    };

    if(additionalParams){
      for(var key in additionalParams){
        params[key] = additionalParams[key];
      }
    }

    if(!options){
      options = new APIRequestOptions();
      options.showErrors = false;
    }

    this.get<T>('read/' + modelName, params, (results: T[]) => {
      onSuccess(results as T[]);
    }, (error, response) => {
      this.onCRUDError(onError, onCancel, error, response);
    }, options);
  }

  update<T>(modelName: string, entityId: any, data: Object, onSuccess: (entity?: T) => void, onError?: (error: string, response: any) => void, onCancel?: Function, excludedFields: string[] = ['id'], options?: APIRequestOptions) {
    this.checkPassword(() => {
      let user = this.getInternalUser();

      let params = {
        _OWNER_ID: user ? user.id : '',
        _OWNER_TOKEN: user ? user.token : '',
        _OWNER_PASSWORD: (this._password || ''),
        _ENTITY_ID: entityId
      };

      for(let key in data){
        let value = data[key];

        if(value !== null && excludedFields.indexOf(key) == -1 && (/string|number|boolean/).test(typeof value)){
          params[key] = value;
        }
      }

      if(!options){
        options = new APIRequestOptions();
        options.showErrors = false;
      }

      this.post('update/' + modelName, params, (response) => {
        this.clearCRUDCache(modelName);
        onSuccess(response.entity as T);
      }, (error, response) => {
        this.onCRUDError(onError, onCancel, error, response);
      }, options);
    }, onCancel);
  }

  delete(modelName: string, entityId: any, onSuccess: Function, onError?: (error: string, response: any) => void, onCancel?: Function, options?: APIRequestOptions) {
    this.checkPassword(() => {
      let user = this.getInternalUser();

      if(!options){
        options = new APIRequestOptions();
        options.showErrors = false;
      }
      
      this.post('delete/' + modelName, {
        _OWNER_ID: user ? user.id : '',
        _OWNER_TOKEN: user ? user.token : '',
        _OWNER_PASSWORD: (this._password || ''),
        _ENTITY_ID: entityId
      }, (response) => {
        this.clearCRUDCache(modelName);
        onSuccess();
      }, (error, response) => {
        this.onCRUDError(onError, onCancel, error, response);
      }, options);
    }, onCancel);
  }

  protected onCRUDError(onError: (error: string, response?: any) => void, onCancel: Function, error: string, response: any) {
    if(response && response.code){
      console.warn('[AbstractAPIService.onCRUDError] Code: ', response.code, ' / Message: ', error);
      if(onCancel) onCancel();
      UI.alert(this.alertCtrl, error);
    }
    else if(onError) onError(error, response);
  }

  login<T>(modelName: string, username: string, password: string, onSuccess: (user: T) => void, onError?: (error: string, response?: any) => void, options?: APIRequestOptions) {
    this.post('login/' + modelName, {
      _USERNAME: username,
      _PASSWORD: password
    }, (response) => {
      this._user = response.account as UserInterface;
      onSuccess(response.account as T);
    }, onError, options);
  }

  cachePassword(password: string) {
    this._password = password;

    setTimeout(() => {
      this._password = null;
    }, (this.CLEAR_PASSWORD_AFTER * 60 * 1000));
  }

  getPassword() {
    return this._password;
  }

  clearPassword() {
    this._password = null;
  }

  promptPassword(callback: (password: string) => void) {
    UI.prompt(this.alertCtrl, this.TITLE_ENTER_PASSWORD, this.MESSAGE_ENTER_PASSWORD, (password: string) => {
      callback(password);
    }, () => {
      callback(null);
    }, {
      type: 'password'
    });
  }

  checkPassword(callback: (password?: string) => void, cancelPromptCallback?: Function) {
    if(this._password || !this.verifyPassword){
      callback(this._password);
    }
    else{
      this.promptPassword((password) => {
        if(password != null){
          this.cachePassword(password);
          callback(password);
        }
        else if(cancelPromptCallback) cancelPromptCallback();
      });
    }
  }

  clearCache(endpoint?: string){
    if(endpoint){
      let endpointHash: string = sha1(endpoint);

      if(this.cache[endpointHash]){
        delete this.cache[endpointHash];
      }
    }
    else{
      this.cache = {};
    }

    this.saveCache();
  }

  getInternalUser(): UserInterface {
    return this._user;
  }

  setInternalUser(user: UserInterface) {
    this._user = user as UserInterface;
  }

  objectToItemArray(object: Object, valueField = 'value', nameField = 'name') {
    /*
    This method is useful for iterating over the options of an object-based enum on a template using *ngFor, for example:
    -- example-page.ts --
    class ExamplePage {
        public CustomerTypes = {
            1: 'Consumer',
            2: 'Reseller',
            3: 'Wholesale'
        };
    }

    -- example-page.html --
    <ion-select>
        <ion-option *ngFor="let customerType of api.objectToItemArray(CustomerTypes)" value="customerType.value">{{customerType.name}}</ion-option>
    </ion-select>
    */
    let itemList: Object[] = [];
    let item;

    for(let value in object){
      item = {};
      item[valueField] = value;
      item[nameField] = object[value];
      itemList.push(item);
    }

    return itemList;
  }

  private runRequestsWaiting(requestHash: string, value: any, callbackName: string) {
    if(this.requestsWaiting[requestHash]){
      for(let request of this.requestsWaiting[requestHash]){
        let callback = request[callbackName];
        callback(value);
      }

      delete this.requestsWaiting[requestHash];
    }
  }

  private getParamsHash(params: Object): string {
    return sha1(JSON.stringify(params));
  }

  private loadCache() {
    this.cache = Util.retrieve('AbstractAPIService.Cache') || {};
  }

  private saveCache() {
    Util.store('AbstractAPIService.Cache', this.cache);
  }

  private getCacheResult(endpoint: string, params: Object): CacheResult {
    let endpointHash: string = sha1(endpoint);
    let cacheId = this.getParamsHash(params);
    let endpointCache: Object = this.cache[endpointHash];
    let result: CacheResult = endpointCache ? endpointCache[cacheId] : null;
    return result || null;
  }

  private clearCRUDCache(modelName: string) {
    this.clearCache('get/' + modelName);
    this.clearCache('read/' + modelName);
  }

  private saveResultInCache(endpoint: string, params: Object, result: any) {
    let endpointHash: string = sha1(endpoint);
    let cacheId = this.getParamsHash(params);
    if(!this.cache[endpointHash]) this.cache[endpointHash] = {};
    this.cache[endpointHash][cacheId] = new CacheResult(result);
    this.saveCache();
  }

  private getParams(additionalParams?: Object): URLSearchParams {
    let params = new URLSearchParams('', new APIQueryEncoder());

    params.set('key', this.API_KEY);

    if(this._appVersion){
      params.set('_VERSION', this._appVersion);
    }

    if(additionalParams){
      for(let name in additionalParams){
        params.set(name, additionalParams[name]);
      }
    }

    return params;
  }

  private handleError(options: APIRequestOptions, response: any, callback?: (error: string, response?: any) => void): void {
    let error: string;

    if(response instanceof Response){
      try{
        let body = response.json();

        if(body.error){
          error = body.error;
        }

        if(body.code && body.code == 'passwordIncorrect'){
          this.clearPassword();
        }
      }
      catch(e){
        console.error('[AbstractAPIService.handleError] ', e);
      }
    }
    else if(response){
      if(response.code && response.code == 'passwordIncorrect'){
        this.clearPassword();
      }

      if(response.error){
        error = response.error;
      }
      else if(response.message){
        error = response.message;
      }
      else{
        error = response.toString();
      }
    }

    if(!error){
      error = this.ERROR_GENERIC;
    }

    console.trace('[AbstractAPIService] Error: ', error);

    if(options.showErrors){
      UI.alert(this.alertCtrl, error);
    }

    if(callback instanceof Function){
      callback(error, response);
    }
  }
}