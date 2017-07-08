import { ZoomPanDirective } from './zoom-pan';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    ZoomPanDirective
  ],
  imports: [
    IonicPageModule.forChild(ZoomPanDirective)
  ],
  exports: [
    ZoomPanDirective
  ]
})
export class ZoomPanDirectiveModule {}