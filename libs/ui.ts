/*
@name			Util
@description	UI helper functions for Ionic 2
@author			Abraham Lopez <abraham.lopez@aplimovil.mx>
@version		1.0
*/

export var UI = {
	language: 'english',
	alertController: null,
	loaderController: null,
	toastController: null,
	dialogInstances: [],
	backButtonCallbacksDisabled: null,
	languageStrings: {
		english: {
			OK: 'OK',
			CANCEL: 'Cancel'
		},
		spanish: {
			OK: 'Aceptar',
			CANCEL: 'Cancelar'
		},
		french: {
			OK: 'Accepter',
			CANCEL: 'Annuler'
		}
	},

	initModals: function(alertController, loaderController, toastController){
		this.alertController = alertController;
		this.loaderController = loaderController;
		this.toastController = toastController;
	},

	cleanModals: function(){
		var self = this;

		console.trace('[UI.cleanModals] called');

		for(var i=0, dialog; i<this.dialogInstances.length; i++){
			dialog = this.dialogInstances[i];
			if(dialog){
				dialog.onDidDismiss(function(){
					delete self.dialogInstances[i];
				});
				dialog.dismiss();
			}
		}
	},

	setLanguage: function(language){
		this.language = language;
	},

	getLanguageString: function(stringName){
		return this.languageStrings[this.language][stringName];
	},

	handleBackButton: function(callback){
		var self = this;

		document.addEventListener("backbutton", function(e){
			if(callback && !self.backButtonCallbacksDisabled){
				var result = callback();

				if(result === false){
					// If callback returns false then stop the other callbacks on the line
					self.backButtonCallbacksDisabled = true;

					setTimeout(function(){
						self.backButtonCallbacksDisabled = false;
					}, 100);
				}
			}
        }, false);

        return this;
	},

	alert: function(alertCtrl, message, callback?, buttonText?){
		message = (message || '').replace(/\n/g, '<br />');
		
		var alert = alertCtrl.create({
			title: '',
			subTitle: message,
			buttons: [buttonText || this.getLanguageString('OK')]
		});

		alert.present();

		alert.onDidDismiss(function(){
			setTimeout(function(){
				if(callback) callback();
			}, 500);
		});
	},

	showAlert: function(alertCtrl, message, callback?, buttonText?){
		this.alert(alertCtrl, message, callback, buttonText);
	},

	createAlert: function(title, message?, callback?, buttonText?) {
		if(!this.alertController){
			console.error('Please call UI.initModals(...) before using UI.createAlert()');
			return;
		}

		if(arguments.length == 1){
			message = title;
			title = '';
		}

		message = (message || '').replace(/\n/g, '<br />');

		var alert = this.alertController.create({
            title: (title || ''),
            subTitle: message,
            buttons: [{
				text: (buttonText || this.getLanguageString('OK'))
			}]
        });

        alert.present();

		alert.onDidDismiss(function(){
			setTimeout(function(){
				if(callback) callback();
			}, 200);
		});

		this.dialogInstances.push(alert);

		return alert;
	},

	confirm: function(alertCtrl, title, message, yesCallback, noCallback?, options?){
		message = (message || '').replace(/\n/g, '<br />');
		
		if(!options) options = {};
		
		var confirm = alertCtrl.create({
            title: title,
            message: message,
            buttons: [
				{
                    text: (options.cancelButton || this.getLanguageString('CANCEL')),
                    handler(){
						setTimeout(function(){
							if(noCallback) noCallback();
						}, 200);
                    }
                },
				{
                    text: (options.okButton || this.getLanguageString('OK')),
                    handler(){
						setTimeout(function(){
							if(yesCallback) yesCallback();
						}, 200);
                    }
                }
            ]
        });

        confirm.present();

		return confirm;
	},
	
	showConfirm: function(alertCtrl, title, message, yesCallback, noCallback?, options?){
		this.confirm(alertCtrl, title, message, yesCallback, noCallback, options);
	},

	createConfirm: function(title, message, yesCallback, noCallback?) {
		if(!this.alertController){
			console.error('Please call UI.initModals(...) before using UI.createConfirm()');
			return;
		}

		message = (message || '').replace(/\n/g, '<br />');

		this.cleanModals();

		var confirm = this.alertController.create({
            title: title,
            message: message,
            buttons: [
				{
					text: this.getLanguageString('CANCEL'),
                    handler(){
						setTimeout(function(){
							if(noCallback) noCallback();
						}, 200);
                    }
                },
				{
					text: this.getLanguageString('OK'),
                    handler(){
						setTimeout(function(){
							if(yesCallback) yesCallback();
						}, 200);
                    }
                }
            ]
        });

        confirm.present();

		this.dialogInstances.push(confirm);

		return confirm;
	},
	
	prompt: function(alertController, title, message, onEnter, onCancel?, options?){
		if(!options) options = {};

		var prompt = alertController.create({
			title: title,
			message: message,
			inputs: [
				{
					name: 'value',
					placeholder: (options.placeholder || ''),
					type: (options.type || 'text'),
					value: (options.value || ''),
				}	
			],
			buttons: [
				{
					text: this.getLanguageString('CANCEL'),
                    handler(){
						setTimeout(function(){
							if(onCancel) onCancel();
						}, 200);
                    }
                },
				{
					text: this.getLanguageString('OK'),
                    handler(data){
						setTimeout(function(){
							if(onEnter) onEnter(data.value);
						}, 200);
                    }
                }
            ]
		});

		prompt.present();
	},
	
	toast: function(toastController, message, options?){
		if(!options) options = {};

		var toast = toastController.create({
          message: message,
          duration: (options.duration || 5000),
          position: (options.position || 'bottom'),
          cssClass: (options.cssClass || 'notification-toast'),
          showCloseButton: (options.showCloseButton !== undefined ? options.showCloseButton : true),
          closeButtonText: (options.closeButtonText || this.getLanguageString('OK')),
          dismissOnPageChange: (options.dismissOnPageChange !== undefined ? options.dismissOnPageChange : false)
        });

        toast.present();

		return toast;
	},

	showToast: function(toastController, message, options?){
		this.toast(toastController, message, options);
	},

	createToast: function(message, options?){
		if(!this.toastController){
			console.error('Please call UI.initModals(...) before using UI.createToast()');
			return;
		}

		this.cleanModals();

		if(!options) options = {};

		var toast = this.toastController.create({
          message: message,
          duration: (options.duration || 5000),
          position: (options.position || 'bottom'),
          cssClass: (options.cssClass || 'notification-toast'),
          showCloseButton: (options.showCloseButton !== undefined ? options.showCloseButton : true),
          closeButtonText: (options.closeButtonText || this.getLanguageString('OK')),
          dismissOnPageChange: (options.dismissOnPageChange !== undefined ? options.dismissOnPageChange : false)
        });

        toast.present();

		this.dialogInstances.push(toast);

		return toast;
	},

	loader: function(loadingCtrl, message?, options?){
		if(!message) message = '';
		
		message = message.replace(/\n/g, '<br />');

		if(!options) options = {};

		var loader = loadingCtrl.create({
          content: message,
		  showBackdrop: (options.showBackdrop !== undefined ? options.showBackdrop : true),
          duration: (options.duration || 20000),
		  dismissOnPageChange: (options.dismissOnPageChange !== undefined ? options.dismissOnPageChange : false)
        });

        loader.present();

		return loader;
	},

	showLoader: function(loadingCtrl, message?, options?){
		this.loader(loadingCtrl, message, options);
	},

	createLoader: function(message?, options?){
		if(!this.loaderController){
			console.error('Please call UI.initModals(...) before using UI.createLoader()');
			return;
		}

		this.cleanModals();

		if(!options) options = {};

		var loader = this.loaderController.create({
          content: (message || ''),
		  showBackdrop: (options.showBackdrop !== undefined ? options.showBackdrop : true),
          duration: (options.duration || 20000),
		  dismissOnPageChange: (options.dismissOnPageChange !== undefined ? options.dismissOnPageChange : false)
        });

        loader.present();

		this.dialogInstances.push(loader);

		return loader;
	}
};