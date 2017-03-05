import { Directive, ElementRef } from '@angular/core';

// Requires: HammerJS (pre-installed with Ionic 2)
declare var Hammer;

@Directive({
    selector: '[zoom-pan]'
})
export class ZoomPanDirective {
    private element: any;

    public isZoomed: boolean;

    constructor(el: ElementRef) {
        this.element = el.nativeElement;
        this.setZoomed(false);

        this.hammerIt(this.element);
    }

    private setZoomed(zoomed) {
        this.isZoomed = zoomed;
        this.element.setAttribute('zoomed', this.isZoomed);
    }

    private hammerIt(elm) {
        let hammertime = new Hammer(elm, {});
        
        hammertime.get('pinch').set({
            enable: true
        });
        
        let posX = 0,
            posY = 0,
            scale = 1,
            last_scale = 1,
            last_posX = 0,
            last_posY = 0,
            max_pos_x = 0,
            max_pos_y = 0,
            el = elm;

        hammertime.on('doubletap pan pinch panend pinchend', (ev) => {
            if (ev.type === 'doubletap') {
                last_scale = scale;
                scale = scale == 1 ? 2 : 1;
            }
            else{
                // pan
                if (scale !== 1) {
                    posX = last_posX + ev.deltaX;
                    posY = last_posY + ev.deltaY;
                    max_pos_x = Math.ceil((scale - 1) * el.clientWidth / 2);
                    max_pos_y = Math.ceil((scale - 1) * el.clientHeight / 2);
                    if (posX > max_pos_x) {
                        posX = max_pos_x;
                    }
                    if (posX < -max_pos_x) {
                        posX = -max_pos_x;
                    }
                    if (posY > max_pos_y) {
                        posY = max_pos_y;
                    }
                    if (posY < -max_pos_y) {
                        posY = -max_pos_y;
                    }
                }

                // pinch
                if (ev.type === 'pinch') {
                    scale = Math.max(.999, Math.min(last_scale * (ev.scale), 4));
                }
                if (ev.type === 'pinchend') { last_scale = scale; }

                // panend
                if (ev.type === 'panend') {
                    last_posX = posX < max_pos_x ? posX : max_pos_x;
                    last_posY = posY < max_pos_y ? posY : max_pos_y;
                }
            }

            if(scale == 1){
                posX = 0;
                posY = 0;
            }

            el.style.webkitTransform = 'translate3d(' + posX + 'px,' + posY + 'px, 0) ' +
                                       'scale3d(' + scale + ', ' + scale + ', 1)';;
            if (scale <= 1) {
                this.setZoomed(false);
            } else {
                this.setZoomed(true);
            }
        });
    }
}