import { ProgressBarComponent } from './progress-bar';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    ProgressBarComponent
  ],
  imports: [
    IonicPageModule.forChild(ProgressBarComponent)
  ],
  exports: [
    ProgressBarComponent
  ]
})
export class ProgressBarComponentModule {}