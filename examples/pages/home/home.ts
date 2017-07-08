/*
import { UI } from '../../ionic-helpers/libs/ui';
import { APIService } from '../../providers/api-service';
import { User } from "../../ionic-helpers/providers/abstract-api-service";
import { LoginPage } from '../login/login';
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
*/