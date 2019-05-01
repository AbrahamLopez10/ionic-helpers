/**
 * @name			EasyPush
 * @description		A cross-platform iOS/Android TypeScript library for easing integration of push notifications with a 3rd party provider.
 * @requires		Cordova (version CLI-6.3.0 or greater) and phonegap-plugin-push NPM plugin version 1.10.2 or greater
 * @author			Abraham Lopez <ablopez824@gmail.com>
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
	firebasePlugin: null,
	pushPlugin: null,
	customDataFieldName: "custom",

	_pushToken: null,
	_onNotificationReceivedCallbacks: [],
	_onReadyCallbacks: [],

	init: function(onTokenRegistered: (token: string, oldToken: string) => void, onError: (error: string) => void, config?: EasyPushOptions){
		var self = this;
		var args = arguments;

		if(!config) config = new EasyPushOptions();

		if(!onTokenRegistered){
			console.error("[EasyPush.init] Missing onTokenRegistered callback parameter.");
			return;
		}

		if(Util.onMobileDevice()){
			if(window['FirebasePlugin'] !== undefined){
				this.firebasePlugin = window['FirebasePlugin'];
			}
			else if(window['PushNotification'] !== undefined){
				this.pushPlugin = PushNotification.init({
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
			}
			else{
				console.warn("[EasyPush.init] Plugin not available yet, retrying...");
				
				setTimeout(function(){
					EasyPush.init.apply(self, args);
				}, 5000);

				return this;
			}

			this._setupPlugin(onTokenRegistered, onError);
		}
		else{
			console.log("[EasyPush.init] Registering desktop device.");

			var token;

			if(!(token = this.getToken())){
				token = 'desktop-' + Math.floor((Math.random() * 900000) + 100000);
				this._saveToken(token);
			}

			onTokenRegistered(token, null);
			this._onReady(token);
		}

		return this;
	},
	
	_setupPlugin: function(onTokenRegistered, onError){
		var self = this;

		if(this.firebasePlugin){
			console.info('[EasyPush] Using Firebase plugin');

			this.firebasePlugin.getToken(function(token) {
				self._onTokenObtained(token, onTokenRegistered);
			}, function(error) {
				console.error(error);
				if(onError) onError(error);
			});

			this.firebasePlugin.onTokenRefresh(function(token){
				self._onTokenObtained(token, onTokenRegistered);
			}, function(error) {
				console.error(error);
				if(onError) onError(error);
			});

			this.firebasePlugin.onNotificationOpen(function(notification){
				console.info('[EasyPush] Firebase notification received: ', notification);
				var applicationWasActive = notification.tap ? false : true;
				self._onNotificationReceived(notification.body, applicationWasActive, notification, notification);
			});
		}
		else{
			console.info('[EasyPush] Using PhoneGap push plugin');

			this.pushPlugin.on('registration', function(data){
				self._onTokenObtained(data.registrationId, onTokenRegistered);
			});

			this.pushPlugin.on('notification', function(notification){
				console.info('[EasyPush] Push plugin notification received: ', notification);
				var applicationWasActive = notification.additionalData.foreground ? true : false;
				var additionalData = notification.additionalData[this.customDataFieldName];
				self._onNotificationReceived(notification.message, applicationWasActive, additionalData, notification);
			});

			this.pushPlugin.on('error', function(e){
				console.error(e);
				if(onError) onError(e);
			});
		}
	},

	listen: function(onNotificationReceived: (message: string, applicationWasActive: boolean, notificationData: any, pushNotification: any) => void){
		this._onNotificationReceivedCallbacks.push(onNotificationReceived);
		return this;
	},

	ready: function(onReady: (pushToken: string) => void){
		this._onReadyCallbacks.push(onReady);
		return this;
	},

	hasPermission: function(callback: (isEnabled: boolean) => void){
		this.pushPlugin.hasPermission(function(data){
			callback(data.isEnabled);
		});
	},

	setAppBadgeNumber: function(badgeNumber: number){
		if(!isNaN(badgeNumber)){
			this.pushPlugin.setApplicationIconBadgeNumber(function(){
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
		this.pushPlugin.getApplicationIconBadgeNumber(function(badgeNumber){
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
		this.pushPlugin.clearAllNotifications(function(){
			console.error("[EasyPush.clearNotifications] Notifications successfully cleared");
			if(callback) callback();
		}, function(){
			console.error("[EasyPush.clearNotifications] Could not clear notifications");
		});
	},

	_onReady: function(pushToken: string){
		for(var i=0; i<this._onReadyCallbacks.length; i++){
			var callback = this._onReadyCallbacks[i];

			try{
				callback(pushToken);
			}
			catch(e){
				console.error(e);
			}
		}
	},

	_onTokenObtained: function(token, onTokenRegistered: (token: string, oldToken: string) => void){
		var oldToken = this.getToken();

		console.log("[EasyPush] Obtained device token: ", token);
		this._saveToken(token);
		onTokenRegistered(token, oldToken);
		this._onReady(token);
	},

	_onNotificationReceived: function(message: string, applicationWasActive: boolean, additionalData: any, notification: any){
		for(var i=0; i<this._onNotificationReceivedCallbacks.length; i++){
			var callback = this._onNotificationReceivedCallbacks[i];

			try{
				callback(message, applicationWasActive, additionalData, notification);
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