import { AlertController, LoadingController, ToastController } from 'ionic-angular';
import { AbstractAPIService, Entity, UserInterface } from '../../providers/abstract-api-service'; // '../ionic2-helpers/providers/abstract-api-service';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Util } from '../../libs/util'; // '../ionic2-helpers/libs/util';

export class User extends Entity implements UserInterface {
  public id: number;
  public username: string;
  public name: string;
  public token: string;
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

    let user = Util.retrieve(this.USER_STORAGE_ID);

    if(user && user.id){
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