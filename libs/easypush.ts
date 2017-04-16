/*
@name			EasyPush
@description	A cross-platform iOS/Android TypeScript library for easing integration of push notifications with a 3rd party provider.
@requires		Cordova (version CLI-6.3.0 or greater) and phonegap-plugin-push NPM plugin version 1.10.2 or greater
@author			Abraham Lopez <abraham.lopez@aplimovil.mx>
@version		1.0
*/

import { Util } from './util';

declare var PushNotification;

export class EasyPushOptions {
  androidSenderID: string;
  clearBadge: boolean;
  alert: boolean;
  badge: boolean;
  sound: any;
  vibrate: boolean;
  forceShow: boolean; // Android only
  clearNotifications: boolean; // Android only

  constructor(data?: Object) {
    if(data){
      for(var key in data){
        this[key] = data[key];
      }
    }
  }
}

export var EasyPush = {
	plugin: null,
	customDataFieldName: "custom",

	_pushToken: null,
	_onNotificationReceived: [],
	_onReady: [],

	init: function(onDeviceRegistered: (pushToken: string) => void, onError: (error: string) => void, config?: EasyPushOptions){
		var self = this;
		var args = arguments;

		if(!config) config = new EasyPushOptions();

		// This "retry" function allows us to retry (with a delay) the calls to the PushPlugin in case it isn't loaded yet by the time init() is called
		function retry(){
			setTimeout(function(){
				EasyPush.init.apply(self, args);
			}, 5000);
		}

		if(!onDeviceRegistered){
			console.error("[EasyPush.init] Missing onDeviceRegistered callback parameter.");
			return;
		}

		if(!window['PushNotification']){
			console.warn("[EasyPush.init] PushPlugin not available yet.");
			retry();
			return this;
		}

		if(Util.onMobileDevice()){
			this.plugin = PushNotification.init({
				ios: {
					clearBadge: (typeof config.clearBadge != 'undefined' ? config.clearBadge : true),
					alert: (typeof config.alert != 'undefined' ? config.alert : true),
					badge: (typeof config.badge != 'undefined' ? config.badge : true),
					sound: (typeof config.sound != 'undefined' ? config.sound : true)
				},
				android: {
					senderID: (config.androidSenderID || ''),
					clearBadge: (typeof config.clearBadge != 'undefined' ? config.clearBadge : true),
					sound: (typeof config.sound != 'undefined' ? config.sound : true),
					vibrate: (typeof config.vibrate != 'undefined' ? config.vibrate : true),
					forceShow: (typeof config.forceShow != 'undefined' ? config.forceShow : false),
					clearNotifications: (typeof config.clearNotifications != 'undefined' ? config.clearNotifications : false)
				}
			});

			this.plugin.on('registration', function(data){
				var pushToken = data.registrationId;
				console.log("[EasyPush] Device registered successfully: ", pushToken);
				self._saveToken(pushToken);
				onDeviceRegistered(pushToken);
				self._callOnReady(pushToken);
			});

			this.plugin.on('notification', function(pushNotification){
				console.info('[EasyPush] Notification received: ', pushNotification);
				self._callOnNotificationReceived(pushNotification);
			});

			this.plugin.on('error', function(e){
				console.error('[EasyPush] Error: ', e);
				if(onError) onError(e);
			});
		}
		else{
			console.log("[EasyPush.init] Registering desktop device.");

			var pushToken;

			if(!(pushToken = this.getToken())){
				pushToken = 'desktop-' + Math.floor((Math.random() * 900000) + 100000);
				this._saveToken(pushToken);
			}

			onDeviceRegistered(pushToken);
			this._callOnReady(pushToken);
		}

		return this;
	},

	listen: function(onNotificationReceived: (message: string, applicationWasActive: boolean, notificationData: any, pushNotification: any) => void){
		this._onNotificationReceived.push(onNotificationReceived);
		return this;
	},

	ready: function(onReady: (pushToken: string) => void){
		this._onReady.push(onReady);
		return this;
	},

	hasPermission: function(callback: (isEnabled: boolean) => void){
		this.plugin.hasPermission(function(data){
			callback(data.isEnabled);
		});
	},

	setAppBadgeNumber: function(badgeNumber: number){
		if(!isNaN(badgeNumber)){
			this.plugin.setApplicationIconBadgeNumber(function(){
				console.log("[EasyPush.setAppBadgeNumber] Successfully updated the app\'s badge number to: " + badgeNumber);
			}, function(error){
				console.error("[EasyPush.setAppBadgeNumber] An error ocurred when trying to update the app's badge number to: " + badgeNumber);
			}, badgeNumber);
		}
		else{
			console.error("[EasyPush.setAppBadgeNumber] badgeNumber should be a numeric value");
		}
	},

	getAppBadgeNumber: function(callback: (badgeNumber: number) => void){
		this.plugin.getApplicationIconBadgeNumber(function(badgeNumber){
			console.log("[EasyPush.getAppBadgeNumber] Badge number: " + badgeNumber);
			callback(badgeNumber);
		}, function(){
			console.error("[EasyPush.getAppBadgeNumber] Could not obtain badge number");
		});
	},

	clearAppBadge: function(){
		this.setAppBadgeNumber(0);
	},

	clearNotifications: function(callback: Function){
		this.plugin.clearAllNotifications(function(){
			console.error("[EasyPush.clearNotifications] Notifications successfully cleared");
			if(callback) callback();
		}, function(){
			console.error("[EasyPush.clearNotifications] Could not clear notifications");
		});
	},

	_callOnReady: function(pushToken: string){
		for(var i=0; i<this._onReady.length; i++){
			var callback = this._onReady[i];

			try{
				callback(pushToken);
			}
			catch(e){
				console.error(e);
			}
		}
	},

	_callOnNotificationReceived: function(pushNotification: any){
		var applicationWasActive = (pushNotification.additionalData.foreground ? true : false);

		for(var i=0; i<this._onNotificationReceived.length; i++){
			var callback = this._onNotificationReceived[i];

			try{
				callback(pushNotification.message, applicationWasActive, pushNotification.additionalData[this.customDataFieldName], pushNotification);
			}
			catch(e){
				console.error(e);
			}
		}
	},

	_saveToken: function(token: string){
		this._pushToken = token;
		localStorage.setItem('EasyPush_Token', token);
	},

	getToken: function(): string {
		if(!this._pushToken){
			this._pushToken = localStorage.getItem('EasyPush_Token');
		}

		return this._pushToken;
	}
};