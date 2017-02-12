import { UI } from './../../ionic2-helpers/libs/ui';
import { APIService, User } from './../../providers/api-service';
import { LoginPage } from './../login/login';
import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public user: User;

  constructor(
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    private api: APIService
  ) {
    this.user = api.getUser();
  }

  logout() {
    UI.confirm(this.alertCtrl, 'Logout', 'Are you sure you want to logout?', () => {
      this.api.logout();
      this.navCtrl.setRoot(LoginPage);
    });
  }
}
