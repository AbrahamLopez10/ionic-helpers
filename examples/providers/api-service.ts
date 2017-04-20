/*
=== OPTIONAL ===
To enable the secure storing of the user's password in CRUD calls, do the following:

1. Install the SecureStorage plugin from Ionic Native:
----
  ionic plugin add cordova-plugin-secure-storage && npm install --save @ionic-native/secure-storage
----

2. Import SecureStorage (@ionic-native/secure-storage) in app.module.ts and add SecureStorage to the "providers" section.

3. Uncomment the import (~ line 16) and dependency injection (~ line 59) below for SecureStorage
as well as the "this.useSecureStorage(secureStorage)" call (~ line 68).
*/
/*
import { AlertController, LoadingController, ToastController } from 'ionic-angular';
import { AbstractAPIService, Entity, UserInterface } from '../ionic2-helpers/providers/abstract-api-service';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Util } from '../ionic2-helpers/libs/util';
//import { SecureStorage } from '@ionic-native/secure-storage';

export class User extends Entity implements UserInterface {
  public id: number;
  public username: string;
  public token: string;
  public name: string;
  public email: string;
  public phone: string;

  getFirstName(): string {
    if(this.name) return '';

    let name = this.name.split(' ');

    if(name.length != 0){
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

@Injectable()
export class APIService extends AbstractAPIService {
  protected API_URL: string = '';
  protected API_KEY: string = '';

  protected user: User;

  private USER_STORAGE_ID = 'APP_NAME.APIService.User';

  constructor(
    protected http: Http,
    //protected secureStorage: SecureStorage,
    protected alertCtrl: AlertController,
    protected loadingCtrl: LoadingController,
    protected toastCtrl: ToastController
  ){
    super();

    //this.useSecureStorage();

    let userData = Util.retrieve(this.USER_STORAGE_ID);

    if(userData && userData.id){
      let user = new User(userData);
      this.setInternalUser(user);
      this.setUser(user);
    }
  }

  register(userRegistration: UserRegistration, onSuccess: (user: User) => void, onError?: (error: string, response?: any) => void) {
    this.create<User>('appuser', userRegistration, (user: User) => {
      onSuccess(user);
    }, onError);
  }

  logout() {
    this.user = null;
    Util.store(this.USER_STORAGE_ID, null);
  }

  isLoggedIn() {
    return (this.user && this.user.id ? true : false);
  }

  getUser(): User {
    return this.user;
  }

  updateUser(changes: Object) {
    let user = this.getUser();

    for(var key in changes){
      user[key] = changes[key];
    }

    this.setUser(user);
  }

  setUser(data: Object) {
    Util.store(this.USER_STORAGE_ID, data);

    this.user = new User();
    
    for(var key in data){
      this.user[key] = data[key];
    }
  }
}
*/