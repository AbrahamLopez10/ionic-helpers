/**
 * @name          AbstractAPIService
 * @description   Base class for an API service provider in Ionic v3+ applications, using a GET/POST based, CRUD-oriented custom ruleset for an HTTP JSON API (TODO: pending documentation for custom ruleset)
 * @author        Abraham Lopez <ablopez824@gmail.com>
 */

import { Http, Response, URLSearchParams, Headers, QueryEncoder } from '@angular/http';
import { LoadingController, AlertController, ToastController } from 'ionic-angular';
import { sha1 } from '../libs/sha1';
import { UI } from '../libs/ui';
import { Util } from '../libs/util';
import 'rxjs/add/operator/toPromise';

declare var cordova;

export class Entity {
  constructor(data?: Object) {
    if (data) {
      try {
        for (var key in data) {
          this[key] = data[key];
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }

  asPlainObject() {
    let object: any = {};

    for (var key in this) {
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
  email?: string;
  phone?: string;
}

export class User extends Entity implements UserInterface {
  public id: number;
  public username: string;
  public token: string;
  public name: string;
  public email?: string;
  public phone?: string;

  getFirstName(): string {
    if (!this.name) return '';

    let name = this.name.split(' ');

    if (name.length != 0) {
      let firstName = name[0].toLowerCase();
      firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1, firstName.length);
      return firstName;
    }
    else return '';
  }
}

export class UserRegistration {
  username: string;
  name: string;
  password: string;
  type: number;
  email: string;
}

export class APIRequestOptions {
  useCache: boolean = false; // If set to true automatically enables useOfflineCache and useFastCache
  useOfflineCache: boolean = false;
  useFastCache: boolean = false;
  showLoader: boolean = true;
  showErrors: boolean = true;
  loaderDisplay: string = null;
  fastCacheMaxAge: number = null;

  constructor(data?: Object) {
    if (data) {
      for (var key in data) {
        this[key] = data[key];
      }
    }
  }
}

export class CRUDRequestOptions extends APIRequestOptions {
  verifyPassword: boolean = true;
  selfOwner: boolean = false;
  secureReads: boolean = false;
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
  protected nativeStorage: any;
  protected secureStorageObject: any;

  protected ERROR_GENERIC = 'Sorry, an error ocurred, please try again later.';
  protected ERROR_CONNECTION = 'Sorry, your device is offline. Please check your Internet connection and try again.';
  protected ERROR_PASSWORD_INVALID = 'Sorry, your password is incorrect.';
  protected TITLE_ENTER_PASSWORD = 'Confirm Password';
  protected MESSAGE_ENTER_PASSWORD = 'Please enter your password to proceed:';
  protected MESSAGE_OFFLINE = 'Offline';
  protected CACHE_STORAGE_KEY = 'AbstractAPIService.Cache';
  protected FAST_CACHE_MAX_AGE = 1; // in minutes
  protected STORAGE_KEY_PREFIX = 'AbstractAPIService.SecureStorage';
  protected PASSWORD_STORAGE_EXPIRATION_DAYS = 30;

  private _ready: boolean = false;
  private _cache: Object = {};
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
    if (window['cordova'] && cordova.getAppVersion) {
      cordova.getAppVersion.getVersionNumber((version) => {
        this._appVersion = version;
      });
    }

    setTimeout(() => {
      if (!this._ready) {
        throw new Error('[AbstractAPIService] this.init() must be called within the APIService implementation');
      }
    }, 1000);
  }

  init() {
    this._ready = true;
    this.loadCache();
    this.loadPassword();
  }

  getAppVersion() {
    return this._appVersion;
  }

  getEndpointUrl(endpoint: string): string {
    return this.API_URL + endpoint;
  }

  useNativeStorage(nativeStorage) {
    this.nativeStorage = nativeStorage;
    this.onSecureStorageUsed();
  }

  useSecureStorage(secureStorage) {
    if (window['cordova']) {
      console.info('[AbstractAPIService.useSecureStorage] Using secure storage.');
      secureStorage.create(this.getStorageKey()).then((secureStorageObject) => {
        this.secureStorageObject = secureStorageObject;
        this.onSecureStorageUsed();
      });
    } else {
      console.info('[AbstractAPIService.useSecureStorage] Using local storage as Cordova is not available.');
    }
  }

  onSecureStorageUsed() {
    this.loadCache();
    this.loadPassword();
  }

  get<T>(endpoint: string, params: Object, onSuccess: (response: any, results?: T[]) => void, onError?: (error: string, response?: any) => void, options?: APIRequestOptions, headers: Object = {}): void {
    if (!this.API_URL) throw new Error('[AbstractAPIService.get] Please set a value for API_URL to make API requests.');

    if (!params) params = {};

    options = new APIRequestOptions(options);

    if (options.useCache) {
      options.useFastCache = true;
      options.useOfflineCache = true;
    }

    if (options.useFastCache || options.useOfflineCache) {
      let cachedResult = this.getCacheResult(endpoint, params);

      if (!Util.isOnline()) {
        if (options.useOfflineCache) {
          if (cachedResult) {
            UI.toast(this.toastCtrl, this.MESSAGE_OFFLINE, {
              duration: 3000
            });
            this.handleSuccess(cachedResult.data, onSuccess);
            return;
          }
          else {
            this.handleError(options, this.ERROR_CONNECTION, onError);
            return;
          }
        }
        else {
          this.handleError(options, this.ERROR_CONNECTION, onError);
          return;
        }
      }

      if (options.useFastCache && cachedResult) {
        let age = (Util.getTimestamp() - cachedResult.timestamp) / 60;

        if (age <= (options.fastCacheMaxAge || this.FAST_CACHE_MAX_AGE)) {
          this.handleSuccess(cachedResult.data, onSuccess);
          return;
        }
      }
    }

    let loader;
    if (options.showLoader) loader = UI.loader(this.loadingCtrl, options.loaderDisplay);

    this.http.get(this.getEndpointUrl(endpoint), {
      search: this.getParams(params),
      headers: new Headers(headers)
    }).toPromise()
      .then((response) => {
        if (loader) loader.dismiss().catch(() => { });

        let json = response.json();

        if (json) {
          if (json.status !== undefined && (json.status == 0 || json.status == 'error')) {
            this.handleError(options, json, onError);
            return;
          }

          this.saveResultInCache(endpoint, params, json);
          this.handleSuccess(json, onSuccess);
        }
        else this.handleError(options, json, onError);
      }).catch((error) => {
        if (loader) loader.dismiss().catch(() => { });
        this.handleError(options, error, onError);
      });
  }

  post(endpoint: string, params: Object, onSuccess?: (response?: any) => void, onError?: (error: string, response?: any) => void, options?: APIRequestOptions, headers: Object = {}): void {
    if (!this.API_URL) throw new Error('[AbstractAPIService.post] Please set a value for API_URL to make API requests.');

    if (!params) params = {};

    options = new APIRequestOptions(options);

    let loader;
    if (options.showLoader) loader = UI.loader(this.loadingCtrl, options.loaderDisplay);

    this.http.post(this.getEndpointUrl(endpoint), this.getParams(params), {
      headers: new Headers(headers)
    }).toPromise()
      .then((response) => {
        if (loader) loader.dismiss().catch(() => { });

        let json = response.json();

        if (json) {
          if (json.error || (json.status !== undefined && (json.status === 0 || json.status === 'error'))) {
            this.handleError(options, json, onError);
            return;
          }

          if (onSuccess) this.handleSuccess(json, onSuccess);
        }
        else this.handleError(options, json, onError);
      }).catch((error) => {
        if (loader) loader.dismiss().catch(() => { });
        this.handleError(options, error, onError);
      });
  }

  create<T>(modelName: string, data: Object, onSuccess: (entity?: T) => void, onError?: (error: string, response: any) => void, onCancel?: Function, excludedFields: string[] = ['id'], options?: CRUDRequestOptions) {
    if (!options) {
      options = new CRUDRequestOptions();
    }

    let doCreate = () => {
      let user = this.getInternalUser();

      let params = {
        _OWNER_ID: user ? user.id : '',
        _OWNER_TOKEN: user ? user.token : '',
        _OWNER_PASSWORD: (this._password || ''),
      };

      if (options.selfOwner) {
        params._OWNER_ID = 'SELF';
        params._OWNER_TOKEN = 'SELF';
        params._OWNER_PASSWORD = '';
      }

      for (let key in data) {
        let value = data[key];

        if (value !== null && (!excludedFields || excludedFields.indexOf(key) == -1) && (/string|number|boolean/).test(typeof value)) {
          params[key] = value;
        }
      }

      this.post('create/' + modelName, params, (response) => {
        this.clearCRUDCache(modelName);
        onSuccess(response.entity as T);
      }, (error, response) => {
        this.onCRUDError(onError, onCancel, error, response);
      }, options);
    };

    if (options.verifyPassword && !options.selfOwner) {
      this.checkPassword(() => {
        doCreate();
      }, onCancel);
    } else {
      doCreate();
    }
  }

  register<T>(modelName: string, data: Object, onSuccess: (entity?: T) => void, onError?: (error: string, response: any) => void, onCancel?: Function, excludedFields: string[] = ['id'], options?: CRUDRequestOptions) {
    if (!options) options = new CRUDRequestOptions();
    options.selfOwner = true;
    this.create<T>(modelName, data, onSuccess, onError, onCancel, excludedFields, options);
  }

  read<T>(modelName: string, additionalParams: Object, onSuccess: (results: T[]) => void, onError?: (error: string, response?: any) => void, onCancel?: Function, options?: CRUDRequestOptions) {
    if (options && options.secureReads && !this._password) {
      this.checkPassword(() => {
        this.read<T>(modelName, additionalParams, onSuccess, onError, null, options);
      }, onCancel, options);

      return;
    }

    let user = this.getInternalUser();

    let params = {
      _OWNER_ID: user ? user.id : '',
      _OWNER_TOKEN: user ? user.token : ''
    };

    if (additionalParams) {
      for (var key in additionalParams) {
        params[key] = additionalParams[key];
      }
    }

    if (!options) {
      options = new CRUDRequestOptions();
    }

    this.get<T>('read/' + modelName, params, (response, results: T[]) => {
      onSuccess(results as T[]);
    }, (error, response) => {
      this.onCRUDError(onError, onCancel, error, response);
    }, options);
  }

  update<T>(modelName: string, entityId: any, data: Object, onSuccess: (entity?: T) => void, onError?: (error: string, response: any) => void, onCancel?: Function, excludedFields: string[] = ['id'], options?: CRUDRequestOptions) {
    this.checkPassword(() => {
      let user = this.getInternalUser();

      let params = {
        _OWNER_ID: user ? user.id : '',
        _OWNER_TOKEN: user ? user.token : '',
        _OWNER_PASSWORD: (this._password || ''),
        _ENTITY_ID: entityId
      };

      for (let key in data) {
        let value = data[key];

        if (value !== null && (!excludedFields || excludedFields.indexOf(key) == -1) && (/string|number|boolean/).test(typeof value)) {
          params[key] = value;
        }
      }

      if (!options) {
        options = new CRUDRequestOptions();
      }

      this.post('update/' + modelName, params, (response) => {
        this.clearCRUDCache(modelName);
        onSuccess(response.entity as T);
      }, (error, response) => {
        this.onCRUDError(onError, onCancel, error, response);
      }, options);
    }, onCancel, options);
  }

  delete(modelName: string, entityId: any, onSuccess: Function, onError?: (error: string, response: any) => void, onCancel?: Function, options?: CRUDRequestOptions) {
    this.checkPassword(() => {
      let user = this.getInternalUser();

      if (!options) {
        options = new CRUDRequestOptions();
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
    }, onCancel, options);
  }

  protected onCRUDError(onError: (error: string, response?: any) => void, onCancel: Function, error: string, response: any) {
    if (response && response.code) {
      console.warn('[AbstractAPIService.onCRUDError] Code: ', response.code, ' / Message: ', error);
      if (onCancel) onCancel();
    }
    else if (onError) onError(error, response);
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

  getPassword() {
    return this._password;
  }

  protected getStorageKey(suffix = '') {
    // Append partial hash of API URL to cache key to make it unique among the same host (mainly for development purposes using localhost)
    return this.STORAGE_KEY_PREFIX + '.' + sha1(this.API_URL).substr(0, 15) + '.' + suffix;
  }

  private loadPassword() {
    if (this.secureStorageObject) {
      this.secureStorageObject.get('password').then((jsonData) => {
        if (this.parsePasswordStorageContents(jsonData)) {
          console.log('[AbstractAPIService.loadPassword] Password successfully retrieved.');
        }
      }, (error) => {
        console.warn('[AbstractAPIService.loadPassword] Could not load password from secure storage: ', error);
      });
    } else if (this.nativeStorage) {
      this.nativeStorage.getItem('password').then((jsonData) => {
        if (this.parsePasswordStorageContents(jsonData)) {
          console.log('[AbstractAPIService.loadPassword] Password successfully retrieved.');
        }
      }, (error) => {
        console.warn('[AbstractAPIService.loadPassword] Could not load password from secure storage: ', error);
      });
    } else {
      this.parsePasswordStorageContents(localStorage.getItem(this.getStorageKey('password')));
    }
  }

  savePassword(password: string) {
    this._password = password;

    console.log('[AbstractAPIService.savePassword] Saving password...');

    if (this.secureStorageObject) {
      this.secureStorageObject.set('password', this.getPasswordStorageContents()).then(() => {
        console.info('[AbstractAPIService.savePassword] Password successfully saved using secure storage.');
      }, (error) => {
        console.error('[AbstractAPIService.savePassword] Could not save password into secure storage: ', error);
      });
    } else if (this.nativeStorage) {
      this.nativeStorage.setItem('password', this.getPasswordStorageContents()).then(() => {
        console.info('[AbstractAPIService.savePassword] Password successfully saved using secure storage.');
      }, (error) => {
        console.error('[AbstractAPIService.savePassword] Could not save password into secure storage: ', error);
      });
    } else {
      console.info('[AbstractAPIService.savePassword] Password successfully saved using local storage.');
      localStorage.setItem(this.getStorageKey('password'), this.getPasswordStorageContents());
    }
  }

  clearPassword() {
    this.savePassword('');
  }

  private parsePasswordStorageContents(jsonData: string) {
    if (jsonData) {
      let data = Util.parseJSON(jsonData);

      if (data) {
        if (data.expiration && data.expiration > Util.getTimestamp()) {
          this._password = data.password;
          return true;
        } else console.info('[AbstractAPIService.parsePasswordStorageContents] Password has expired.');
      } else console.warn('[AbstractAPIService.parsePasswordStorageContents] Invalid JSON data: ', jsonData);
    } else console.log('[AbstractAPIService.parsePasswordStorageContents] Data is empty.');

    return false;
  }

  private getPasswordStorageContents() {
    let expiration = Util.getTimestamp() + (this.PASSWORD_STORAGE_EXPIRATION_DAYS * (3600 * 24));
    let data = {
      password: this._password,
      expiration: expiration
    };
    return JSON.stringify(data);
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

  checkPassword(callback: (password?: string) => void, cancelPromptCallback?: Function, options?: CRUDRequestOptions) {
    if (this._password || (options && (!options.verifyPassword || options.selfOwner))) {
      callback(this._password);
    }
    else {
      this.promptPassword((password) => {
        if (password != null) {
          this.savePassword(password);
          callback(password);
        }
        else if (cancelPromptCallback) cancelPromptCallback();
      });
    }
  }

  getInternalUser(): UserInterface {
    return this._user;
  }

  setInternalUser(user: UserInterface) {
    this._user = user as UserInterface;
  }

  getUser(): UserInterface {
    return this.getInternalUser();
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

    for (let value in object) {
      item = {};
      item[valueField] = value;
      item[nameField] = object[value];
      itemList.push(item);
    }

    return itemList;
  }

  private getParamsHash(params: Object): string {
    return sha1(JSON.stringify(params));
  }

  private loadCache() {
    if (this.nativeStorage && window['cordova']) {
      this.nativeStorage.getItem('cache').then((json) => {
        console.log('[AbstractAPIService.loadCache] Cache loaded from native storage.');
        this._cache = Util.parseJSON(json);
      }, (error) => {
        if (error && error.code != 2) { // Error code 2 (Item not found)
          console.warn('[AbstractAPIService.loadCache] Error when loading from native storage: ', error);
        }
      });
    } else {
      console.log('[AbstractAPIService.loadCache] Cache loaded from local storage.');
      this._cache = Util.retrieve(this.getCacheStorageKey()) || {};
    }
  }

  private saveCache() {
    if (this.nativeStorage && window['cordova']) {
      let json = JSON.stringify(this._cache);
      this.nativeStorage.setItem('cache', json).then(() => {
        console.log('[AbstractAPIService.saveCache] Cache saved in native storage.');
      }, (error) => {
        console.warn('[AbstractAPIService.saveCache] Cache save error: ', error);
      });
    } else {
      let saved = Util.store(this.getCacheStorageKey(), this._cache);
      if (saved) {
        console.log('[AbstractAPIService.saveCache] Cache saved in local storage.');
      } else {
        console.warn('[AbstractAPIService.saveCache] Local storage limit exceeded, cleaning up...');
        // If cache size exceeds localStorage limit then clear the cache
        localStorage.setItem(this.getCacheStorageKey(), '');
      }
    }
  }

  clearCache(endpoint?: string) {
    if (endpoint) {
      let endpointHash: string = sha1(endpoint);

      if (this._cache[endpointHash]) {
        delete this._cache[endpointHash];
      }
    }
    else {
      this._cache = {};
    }

    this.saveCache();
  }

  private getCacheStorageKey() {
    // Append partial hash of API URL to cache key to make it unique among the same host (mainly for development purposes using localhost)
    return this.CACHE_STORAGE_KEY + '.' + sha1(this.API_URL).substr(0, 15);
  }

  private getCacheResult(endpoint: string, params: Object): CacheResult {
    let endpointHash: string = sha1(endpoint);
    let cacheId = this.getParamsHash(params);
    let endpointCache: Object = this._cache[endpointHash];
    let result: CacheResult = endpointCache ? endpointCache[cacheId] : null;
    return result || null;
  }

  private saveResultInCache(endpoint: string, params: Object, result: any) {
    let endpointHash: string = sha1(endpoint);
    let cacheId = this.getParamsHash(params);
    if (!this._cache[endpointHash]) this._cache[endpointHash] = {};
    this._cache[endpointHash][cacheId] = new CacheResult(result);
    this.saveCache();
  }

  private clearCRUDCache(modelName: string) {
    this.clearCache('get/' + modelName);
    this.clearCache('read/' + modelName);
  }

  getCacheItem(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.nativeStorage && window['cordova']) {
        console.log('[AbstractAPIService.getCacheItem] Using native storage.');
        this.nativeStorage.getItem(key).then((value) => {
          console.log('[AbstractAPIService.getCacheItem] Item retrieved: ' + key);
          resolve(value);
        }, (error) => {
          console.warn('[AbstractAPIService.getCacheItem] Error: ', error);
          reject(error);
        });
      } else {
        console.log('[AbstractAPIService.getCacheItem] Using local storage. Item retrieved: ' + key);
        resolve(localStorage.getItem(this.getStorageKey(key)));
      }
    });
  }

  setCacheItem(key: string, value: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.nativeStorage && window['cordova']) {
        console.log('[AbstractAPIService.setCacheItem] Using secure storage.');
        this.nativeStorage.setItem(key, value).then(() => {
          console.log('[AbstractAPIService.setCacheItem] Item saved: ' + key);
          resolve();
        }, (error) => {
          console.warn('[AbstractAPIService.setCacheItem] Error: ', error);
          reject(error);
        });
      } else {
        console.log('[AbstractAPIService.setCacheItem] Using local storage. Item saved: ' + key);
        localStorage.setItem(this.getStorageKey(key), value);
        resolve();
      }
    });
  }

  getSecureItem(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.nativeStorage && window['cordova']) {
        console.log('[AbstractAPIService.getSecureItem] Using native storage.');
        this.nativeStorage.getItem(key).then((value) => {
          console.log('[AbstractAPIService.getSecureItem] Item retrieved: ' + key);
          resolve(value);
        }, (error) => {
          console.warn('[AbstractAPIService.getSecureItem] Error: ', error);
          reject(error);
        });
      } else {
        console.log('[AbstractAPIService.getSecureItem] Using local storage. Item retrieved: ' + key);
        resolve(localStorage.getItem(this.getStorageKey(key)));
      }
    });
  }

  setSecureItem(key: string, value: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.nativeStorage && window['cordova']) {
        console.log('[AbstractAPIService.setSecureItem] Using secure storage.');
        this.nativeStorage.setItem(key, value).then(() => {
          console.log('[AbstractAPIService.setSecureItem] Item saved: ' + key);
          resolve();
        }, (error) => {
          console.warn('[AbstractAPIService.setSecureItem] Error: ', error);
          reject(error);
        });
      } else {
        console.log('[AbstractAPIService.setSecureItem] Using local storage. Item saved: ' + key);
        localStorage.setItem(this.getStorageKey(key), value);
        resolve();
      }
    });
  }

  private getParams(additionalParams?: Object): URLSearchParams {
    let params = new URLSearchParams('', new APIQueryEncoder());

    params.set('key', this.API_KEY);

    if (this._appVersion) {
      params.set('_VERSION', this._appVersion);
    }

    if (additionalParams) {
      for (let name in additionalParams) {
        params.set(name, additionalParams[name]);
      }
    }

    return params;
  }

  private handleSuccess(response: any, onSuccess: Function) {
    if (response.results !== undefined) {
      onSuccess(response, response.results);
    }
    else {
      onSuccess(response);
    }
  }

  private handleError(options: APIRequestOptions, response: any, callback?: (error: string, response?: any) => void): void {
    let error: string;

    if (response instanceof Response) {
      try {
        let body = response.json();

        if (body.error) {
          error = body.error;
        }

        if (body.code && body.code == 'passwordIncorrect') {
          this.clearPassword();
        }
      }
      catch (e) {
        console.error('[AbstractAPIService.handleError] ', e);
      }
    }
    else if (typeof response == 'object') {
      if (response.code && response.code == 'passwordIncorrect') {
        this.clearPassword();
      }

      if (response.error) {
        error = response.error;
      }
      else if (response.message) {
        error = response.message;
      }
      else {
        error = response.toString();
      }
    }
    else if (typeof response == 'string') {
      error = response;
    }

    if (!error) {
      error = this.ERROR_GENERIC;
    }

    console.warn('[AbstractAPIService] Error: ', error);

    if (options.showErrors) {
      UI.alert(this.alertCtrl, error);
    }

    if (callback instanceof Function) {
      callback(error, response);
    }
  }
}