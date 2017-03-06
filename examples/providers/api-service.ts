/*
import { AlertController, LoadingController, ToastController } from 'ionic-angular';
import { AbstractAPIService, Entity, UserInterface } from '../ionic2-helpers/providers/abstract-api-service';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Util } from '../ionic2-helpers/libs/util';

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

  private USER_STORAGE_ID = 'APIService.User';

  constructor(
    protected http: Http,
    protected alertCtrl: AlertController,
    protected loadingCtrl: LoadingController,
    protected toastCtrl: ToastController
  ){
    super();

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