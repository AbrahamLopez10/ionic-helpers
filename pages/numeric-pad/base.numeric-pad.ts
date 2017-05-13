/**
 * @name          BaseNumericPadPage
 * @description   A page base class for a numeric pad interface for Ionic v2+ apps to allow users to enter numeric codes, PINs, etc.
 * @author        Abraham Lopez <ablopez824@gmail.com>
 */

import { UI } from './../../libs/ui';
import { Translator } from './../../providers/translator';
import { Translate } from './../../providers/translate';
import { DomSanitizer } from '@angular/platform-browser';
import { NavController, NavParams, ViewController, AlertController, ToastController, Events } from 'ionic-angular';

declare var jQuery;

export class BaseNumericPadPage {
    public value: string = '';
    public tr: Translate;

    private mask: boolean = false;
    private partialMask: boolean = false;
    private maxLength: number = 8;
    private required: boolean = false;
    private requiredMessage: string;
    private callback: (value: string) => boolean;
    private canLeave: boolean = false;
    
    public instructions: string;
    public disableCancel: boolean = false;
    public enterDisabled: boolean = false;

    /* Dependency injections */
    public navCtrl: NavController;
    public navParams: NavParams;
    public viewCtrl: ViewController;
    protected alertCtrl: AlertController;
    protected toastCtrl: ToastController;
    protected events: Events;
    protected sanitizer: DomSanitizer;

    constructor(translator: Translator){
        this.tr = new Translate(translator, 'NumericPad');
        this.tr.register('es', [
          ['Enter', 'Entrar'],
          ['Clear', 'Borrar'],
          ['Cancel', 'Cancelar']
        ]);

        this.requiredMessage = this.tr._('Please enter a value.');
    }

    init() {
        if(this.navParams.get('mask')){
            this.mask = true;
        }

        if(this.navParams.get('partialMask')){
            this.partialMask = true;
        }

        if(this.navParams.get('maxLength')){
            this.maxLength = parseInt(this.navParams.get('maxLength'), 10);
            if(isNaN(this.maxLength)) throw new Error('[NumericPadPage] Max length parameter passed is not a numeric value.');
        }

        if(this.navParams.get('required')){
            this.required = true;
        }

        if(this.navParams.get('requiredMessage')){
            this.requiredMessage = this.navParams.get('requiredMessage');
        }

        if(this.navParams.get('instructions')){
            this.instructions = this.navParams.get('instructions');
        }

        if(this.navParams.get('disableCancel')){
            this.disableCancel = true;
        }

        if(this.navParams.get('callback')){
            this.callback = this.navParams.get('callback');
            if(typeof this.callback != 'function') throw new Error('[NumericPadPage] The "callback" parameter should be a function.');
        } else throw new Error('[NumericPadPage] The "callback" parameter is required but was not passed as a nav param.');
    }

    ionViewDidEnter() {
        this.events.subscribe('numeric-pad:disable-enter', () => {
            this.enterDisabled = true;
        });

        this.events.subscribe('numeric-pad:enable-enter', () => {
            this.enterDisabled = false;
        });

        this.events.subscribe('numeric-pad:shake', () => {
            this.shakeInput();
        });

        this.events.subscribe('numeric-pad:clear', () => {
            this.clear();
        });
    }
    
    ionViewCanLeave() {
        if(!this.canLeave){
            return this.enter();
        }
    }

    ionViewWillLeave() {
        this.events.unsubscribe('numeric-pad:disable-enter');
        this.events.unsubscribe('numeric-pad:enable-enter');
        this.events.unsubscribe('numeric-pad:shake');
        this.events.unsubscribe('numeric-pad:clear');
    }

    press(num: number) {
        if(this.value.length >= this.maxLength){
            this.shakeInput();
            return;
        }

        this.value += num;
        
        if(this.mask){
            this.displayValue("*".repeat(this.value.length));
        } else if(this.partialMask){
            this.displayValue("*".repeat(this.value.length - 1) + this.value.substr(-1, 1));
        } else {
            this.displayValue(this.value);
        }
    }

    displayValue(value: string) {
        jQuery('#numeric-pad-display input').val(value);
    }

    enter(): boolean {
        if(this.required){
            if(this.value != ''){
                if(this.callback(this.value) !== false){
                    this.dismiss();
                }
            } else {
                this.shakeInput();
                UI.toast(this.toastCtrl, this.tr._(this.requiredMessage), {duration: 3000});
                return false;
            }
        } else {
            if(this.value == '' && this.disableCancel){
                return false;
            }
            
            if(this.callback(this.value) !== false){
                this.dismiss();
            }
        }

        return true;
    }

    dismiss() {
        this.canLeave = true;
        this.viewCtrl.dismiss();
    }

    shakeInput() {
        let $input = jQuery('numeric-pad-page ion-input');

        $input.addClass('shake');

        setTimeout(() => {
            $input.removeClass('shake');
        }, 1000);
    }

    clear() {
        this.value = '';
        this.displayValue('');
    }

    cancel() {
        if(this.disableCancel) return;

        if(this.callback(null) !== false){
            this.viewCtrl.dismiss();
        }
    }
}