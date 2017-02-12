import { UI } from './../../ionic2-helpers/libs/ui';
import { APIService, User } from './../../providers/api-service';
import { RegisterPage } from './../register/register';
import { HomePage } from './../home/home';
import { Component } from '@angular/core';
import { NavController, AlertController, Events } from 'ionic-angular';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  public username: string;
  public password: string;
  
  constructor(
    public navCtrl: NavController,
    private events: Events,
    private api: APIService,
    private alertCtrl: AlertController
  ) {
    
  }

  ionViewWillLoad() {
    if(this.api.isLoggedIn()){
      this.navCtrl.setRoot(HomePage);
    }
  }

  doLogin() {
    if(this.username && this.password){
      this.api.login<User>('appuser', this.username, this.password, (user) => {
        this.api.setUser(user);
        this.api.cachePassword(this.password);
        this.navCtrl.setRoot(HomePage);
      });
    }
    else UI.alert(this.alertCtrl, 'Please enter your username and password.');
  }

  register(){
    this.navCtrl.push(RegisterPage);
  }
}
