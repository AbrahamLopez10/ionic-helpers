import { Util } from '../../../libs/util'; //'../../ionic2-helpers/libs/util';
import { UI } from '../../../libs/ui'; //'../../ionic2-helpers/libs/ui';
import { APIService, UserRegistration, User } from './../../providers/api-service';
import { LoginPage } from './../login/login';
import { HomePage } from './../home/home';
import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';

@Component({
  selector: 'page-register',
  templateUrl: 'register.html'
})
export class RegisterPage {
  public username: string;
  public password: string;
  public confirmPassword: string;
  public name: string;
  public email: string;

  constructor(
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    private api: APIService
  ) {

  }

  doRegister() {
    if(this.username.trim() && this.password.trim() && this.confirmPassword.trim() && this.email.trim()){
      if(this.password != this.confirmPassword){
        UI.alert(this.alertCtrl, 'The password and the confirmed password don\'t match, please check and try again.');
        return;
      }

      let registration = new UserRegistration();
      registration.username = this.username;
      registration.password = this.password;
      registration.name = this.name;
      registration.email = this.email;

      this.api.register(registration, (user: User) => {
        this.api.setUser(user);
        this.navCtrl.setRoot(HomePage);
      });
    }
    else UI.alert(this.alertCtrl, 'Please enter all the required fields.');
  }

  login() {
    this.navCtrl.setRoot(LoginPage);
  }

  openTOS() {
    Util.openURL('');
  }
}
