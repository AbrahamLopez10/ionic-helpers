/*
=== OPTIONAL ===
To enable the permanent storage of cached responses and custom items, and/or the secure storage of the user's password in CRUD calls (to avoid requesting the password to the user on each CRUD operation), do the following:

1. Install the Native Storage plugin from Ionic Native:
----
  ionic plugin add cordova-plugin-native-storage --save && npm install --save @ionic-native/native-storage
----

2. Import Native Storage (@ionic-native/native-storage) in app.module.ts and add Native Storage to the "providers" section.

3. Install the Secure Storage plugin from Ionic Native:
----
  ionic plugin add cordova-plugin-secure-storage --save && npm install --save @ionic-native/secure-storage
----

4. Import Secure Storage (@ionic-native/secure-storage) in app.module.ts and add Secure Storage to the "providers" section.

5. Uncomment the import and dependency injection below for NativeStorage and SecureStorage as well as the "this.useNativeStorage(nativeStorage)" and "this.useSecureStorage(secureStorage)" calls
*/
/*
import { AlertController, LoadingController, ToastController } from 'ionic-angular';
import { AbstractAPIService, User } from '../ionic-helpers/providers/abstract-api-service';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Util } from '../ionic-helpers/libs/util';
import { SecureStorage } from '@ionic-native/secure-storage';
import { NativeStorage } from '@ionic-native/native-storage';

@Injectable()
export class APIService extends AbstractAPIService {
  protected API_URL: string = '';
  protected API_KEY: string = '';
  protected ERROR_GENERIC = 'Conexión inestable, por favor revise su acceso a Internet.';
  protected ERROR_CONNECTION = 'Su dispositivo no tiene conexión de Internet, favor de revisar y volver a intentar.';

  protected user: User;

  private USER_STORAGE_ID = 'BaseApp.APIService.User';

  constructor(
    protected http: Http,
    //protected nativeStorage: NativeStorage,
    //protected secureStorage: SecureStorage,
    protected alertCtrl: AlertController,
    protected loadingCtrl: LoadingController,
    protected toastCtrl: ToastController
  ){
    super();
    this.init();

    //this.useNativeStorage(nativeStorage);
    //this.useSecureStorage(secureStorage);

    let userData = Util.retrieve(this.USER_STORAGE_ID);

    if(userData && userData.id){
      let user = new User(userData);
      this.setUser(user);
    }
  }

  logout() {
    this.user = null;
    Util.store(this.USER_STORAGE_ID, null);
    this.clearPassword();
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
    this.user = Object.assign(new User, data);
    this.setInternalUser(this.user);
    console.log('[APIService] User: ', this.user);
  }
}
*/