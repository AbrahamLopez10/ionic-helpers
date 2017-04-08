import { sprintf } from './sprintf';
/*
@name			Util
@description	General utility functions
@author			Abraham Lopez <abraham.lopez@aplimovil.mx>
@version		1.0
*/

import { UI } from './ui';
import { sha1 } from './sha1';

declare var cordova;
declare var requestFileSystem, webkitRequestFileSystem, resolveLocalFileSystemURL, geolocation;
declare var LocalFileSystem, TEMPORARY;
declare var FileEntry, FileTransfer, FileTransferError, Connection;

export var Util = {
	_imageCacheEnabled: false,
	_imageCacheFolderPath: null,
	_imageCacheInitialized: false,
	_geolocationCancelled: false,
	_geolocationMaskLockId: 'getGeoLocation',
	_fileSystemInstance: null,
	_language: 'spanish',

	extend: function(object: Object, extendWith: Object): Object {
		let newObject = {};
		
		for(var key in object){
			newObject[key] = object[key];
		}

		for(var key in extendWith){
			newObject[key] = extendWith[key];
		}

		return newObject;
	},

	setLanguage: function(language){
		this._language = language;
	},

	getOfflineCachedImageUrl: function(imageUrl, forceCacheUsage){
		var self = this;
		var cacheStoragePrefix = "CachedImage_";

		if(!imageUrl) return imageUrl;
		
		if(this._imageCacheFolderPath){
			var imageID = sha1(imageUrl);
			var extension = imageUrl.split('.').pop();
			var cachedImagePath = this._imageCacheFolderPath + '/' + imageID + '.' + extension;
			var cacheName = cacheStoragePrefix + imageID;

			if(this.isOnline() && forceCacheUsage !== true){
				self.downloadFile(imageUrl, cachedImagePath, function(fileURL, fileEntry){
					Util.store(cacheName, fileURL);
					console.log("Util.getOfflineCachedImageUrl: Successfully downloaded the " + imageUrl + " image into cache (URL: " + fileURL + ", File: " + cachedImagePath + ")");
				});

				return imageUrl;
			}
			else{
				var cachedImageUrl = Util.retrieve(cacheName);

				if(cachedImageUrl){
					console.log("Util.getOfflineCachedImageUrl: Successfully retrieved image (" + imageUrl + ") from cache (" + cachedImageUrl + ")");
					return cachedImageUrl;
				}
				else{
					console.warn("Util.getOfflineCachedImageUrl: Couldn't retrieve image (" + imageUrl + ") from cache");
					return imageUrl;
				}
			}
		}
		else if(this._imageCacheEnabled){
			console.log("Util.getOfflineCachedImageUrl: Offline image cache not initialized yet, returning the same image URL (" + imageUrl + ")");
			this.enableImageOfflineCache();
			return imageUrl;
		}
		else{
			console.warn("Util.getOfflineCachedImageUrl: Offline image cache is not enabled.");
			return imageUrl;
		}
	},

	isOfflineImageCacheEnabled: function(){
		return this._imageCacheEnabled;
	},

	getCachedImageUrl: function(){ // DEPRECATED
		console.warn("Util.getCachedImageUrl() is deprecated, use Util.getOfflineCachedImageUrl() instead.");
		return this.getOfflineCachedImageUrl.apply(this, arguments);
	},

	enableImageOfflineCache: function(callback?){
		if(this._imageCacheInitialized) return;

		this._imageCacheEnabled = true;

		var self = this;
		var cacheFolderName = "cached_images";

		this.getFolder(cacheFolderName, function(folderEntry, cachePath){
			self._imageCacheFolderPath = cachePath;
			self._imageCacheInitialized = true;

			if(self.oniOSDevice()){
				self.setNoBackupiOSAttribute(folderEntry);
			}

			if(callback) callback(cachePath);

			console.log("Util.enableImageOfflineCache: Image cache folder accessed at \"" + cachePath + "\"");
		}, function(){
			self._imageCacheInitialized = true;
			if(callback) callback(null);
			console.warn('Util.enableImageOfflineCache: File system not available');
		});
	},

	initImageCache: function(){ // DEPRECATED
		console.warn("Util.initImageCache() is deprecated, use Util.enableImageOfflineCache() instead.");
		this.enableImageOfflineCache.apply(this, arguments);
	},

	initImageOfflineCache: function(){ // DEPRECATED
		console.warn("Util.initImageOfflineCache() is deprecated, use Util.enableImageOfflineCache() instead.");
		this.enableImageOfflineCache.apply(this, arguments);
	},

	getFileSystem: function(onReady, onError?){
		if(Util._fileSystemInstance){
			onReady(Util._fileSystemInstance);
			return;
		}

		if(!window['requestFileSystem']) requestFileSystem = webkitRequestFileSystem;

		var storageType = LocalFileSystem ? LocalFileSystem.PERSISTENT : TEMPORARY;
		var requestedQuota = LocalFileSystem ? 0 : (100 * 1024 * 1024);

		if(requestFileSystem){
			requestFileSystem(storageType, requestedQuota, function(fileSystem){
				Util._fileSystemInstance = fileSystem;
				onReady.call(Util, fileSystem);
				
			}, function(error){
				if(onError) onError.call(Util, error);
			});
		}
		else{
			console.error('[Util.getFileSystem] requestFileSystem is not available.');
			if(onError) onError.call(Util, {message: 'requestFileSystem is not available'});

			return;
		}
	},

	getFolder: function(folderPath, onReady, onError?, create?, exclusive?){
		Util.getFileSystem(function(fileSystem){
			fileSystem.root.getDirectory(folderPath, {
				create: (create || true),
				exclusive: (exclusive || false)
			}, function(folderEntry){
				if(onReady) onReady.call(Util, folderEntry, folderEntry.toURL());
			}, function(error){
				console.error('[Util.getFolder] error: ', error, 'folderPath: ', folderPath);
				if(onError) onError.call(Util, error);
			});
		}, onError);
	},

	getFile: function(filePath, onSuccess, onError?, create?, exclusive?){
		if(filePath instanceof FileEntry){
			var fileEntry = filePath;
			onSuccess.call(this, fileEntry, fileEntry.toURL());
			return;
		}

		Util.getFileSystem(function(fileSystem){
			fileSystem.root.getFile(filePath, {
				create: (create || false),
				exclusive: (exclusive || false)
			}, function(fileEntry){
				if(onSuccess) onSuccess.call(Util, fileEntry, fileEntry.toURL());
			}, function(error){
				if(onError) onError.call(Util, error);
			});
		}, function(error){
			console.error('[Util.getFile] error: ', error, 'filePath: ', filePath);
			if(onError) onError.call(Util, error);
		});
	},

	resolveFileURL: function(fileURL, onSuccess, onError?){
		if(!resolveLocalFileSystemURL){
			if(onError) onError({
				message: ('resolveLocalFileSystemURL is not available.')
			});

			return;
		}

		if(fileURL.indexOf('file://') !== 0) fileURL = 'file://' + fileURL;

		resolveLocalFileSystemURL(fileURL, function(fileEntry){
			onSuccess.call(Util, fileEntry);
		}, function(error){
			console.error('[Util.resolveFileURL] error: ', error, 'fileURL: ', fileURL);
			if(onError) onError.call(Util, error);
		});
	},

	fileExists: function(filePath, callback){
		resolveLocalFileSystemURL(filePath, function(file){
			callback.call(Util, file);
		}, function(){
			callback.call(Util, false);
		});
	},

	readFile: function(relativeFilePathOrFileEntry, onReady, onError?){
		Util.getFile(relativeFilePathOrFileEntry, function(fileEntry){
			fileEntry.file(function(file){
				var reader = new FileReader();

				reader.onloadend = function(){
					console.log('[Util.readFile] success');
					onReady.call(Util, this.result, fileEntry);
				};

				reader.onerror = function(error){
					console.error('[Util.readFile] error:', error, 'relativeFilePathOrFileEntry: ', relativeFilePathOrFileEntry);
					if(onError) onError.call(Util, error);
				};

				reader.readAsText(file);
			});
		}, onError);
	},

	readBinaryFile: function(relativeFilePathOrFileEntry, onReady, onError?){
		Util.getFile(relativeFilePathOrFileEntry, function(fileEntry){
			fileEntry.file(function(file){
				var reader = new FileReader();

				reader.onloadend = function(){
					console.log('[Util.readBinaryFile] success');
					var blob = new Blob([new Uint8Array(this.result)], {type: Util.getFileMIMEType(relativeFilePathOrFileEntry)});
					onReady.call(Util, blob, fileEntry);
				};

				reader.onerror = function(error){
					console.error('[Util.readBinaryFile] error:', error, 'relativeFilePathOrFileEntry: ', relativeFilePathOrFileEntry);
					if(onError) onError.call(Util, error);
				};

				reader.readAsArrayBuffer(file);
			});
		}, onError);
	},

	writeFile: function(relativeFilePathOrFileEntry, data, onReady?, onError?, mimeType?, append?){
		Util.getFile(relativeFilePathOrFileEntry, function(fileEntry){
			fileEntry.createWriter(function(fileWriter){
				fileWriter.onwriteend = function(){
					console.log('[Util.writeFile] success');
					if(onReady) onReady.call(Util, fileEntry);
				};

				fileWriter.onerror = function(error){
					console.error('[Util.writeFile] error:', error, 'relativeFilePathOrFileEntry: ', relativeFilePathOrFileEntry);
					if(onError) onError.call(Util, error);
				};

				if(append){
					fileWriter.seek(fileWriter.length);
				}

				fileWriter.write(new Blob([data], {
					type: (mimeType || 'text/plain')
				}));
			});
		}, function(error){
			if(onError) onError.call(Util, error);
		}, true);
	},

	writeBinaryFile: function(relativeFilePathOrFileEntry, blob, onReady?, onError?, mimeType?, append?){
		Util.getFile(relativeFilePathOrFileEntry, function(fileEntry){
			fileEntry.createWriter(function(fileWriter){
				fileWriter.onwriteend = function(){
					console.log('[Util.writeBinaryFile] success');
					if(onReady) onReady.call(Util, fileEntry);
				};

				fileWriter.onerror = function(error){
					console.error('[Util.writeBinaryFile] error:', error, 'relativeFilePathOrFileEntry: ', relativeFilePathOrFileEntry);
					if(onError) onError.call(Util, error);
				};

				if(append){
					fileWriter.seek(fileWriter.length);
				}

				fileWriter.write(blob);
			});
		}, function(error){
			if(onError) onError.call(Util, error);
		}, true);
	},

	appendFile: function(relativeFilePathOrFileEntry, data, onReady?, onError?, mimeType?){
		Util.writeFile(relativeFilePathOrFileEntry, data, onReady, onError, mimeType, true);
	},

	deleteFile: function(relativeFilePathOrFileEntry, onReady?, onError?){
		Util.getFile(relativeFilePathOrFileEntry, function(fileEntry){
			fileEntry.remove(function(){
				console.log('[Util.deleteFile] success');
				if(onReady) onReady.call(Util);
			}, function(error){
				console.error('[Util.deleteFile] error: ', error, 'relativeFilePathOrFileEntry: ', relativeFilePathOrFileEntry);
				if(onError) onError.call(Util, error);
			});
		}, onError);
	},

	downloadFile: function(fileUrl, saveToLocalFileURL, onReady, onError?) {
		if(!FileTransfer){
			console.warn('[Util.downloadFile] error: FileTransfer not available');
			
			if(onError) onError.call(Util, {
				message: "FileTransfer not available"
			});

			return;
		}

		var fileTransfer = new FileTransfer();

		fileTransfer.download(encodeURI(fileUrl), saveToLocalFileURL, function(fileEntry){
			try{
				var sLocalFileURL = fileEntry.toURL();

				fileEntry.file(function(file){
					onReady.call(Util, sLocalFileURL, fileEntry, file);
				}, function(error){
					console.error('[Util.downloadFile] error: ', error, 'fileUrl: ', fileUrl, 'saveToLocalFileURL: ', saveToLocalFileURL);
					if(onError) onError.call(Util, error);
				});
			}
			catch(error){
				console.error('[Util.downloadFile] error: ', error, 'fileUrl: ', fileUrl, 'saveToLocalFileURL: ', saveToLocalFileURL);
				if(onError) onError.call(Util, error);
			}
		}, function(error){
			switch(error.code){
				case FileTransferError.FILE_NOT_FOUND_ERR:
					error.type = "FILE_NOT_FOUND_ERR";
					break;
				case FileTransferError.INVALID_URL_ERR:
					error.type = "INVALID_URL_ERR";
					break;
				case FileTransferError.CONNECTION_ERR:
					error.type = "CONNECTION_ERR";
					break;
				case FileTransferError.ABORT_ERR:
					error.type = "ABORT_ERR";
					break;
			}

			console.error('[Util.downloadFile] error: ', error, 'fileUrl: ', fileUrl, 'saveToLocalFileURL: ', saveToLocalFileURL);

			if(onError) onError.call(Util, {
				message: "File could not be downloaded (Error: " + error.type + ", URL: " + fileUrl + ", Save To: " + saveToLocalFileURL + ")",
				code: error.code,
				type: error.type
			});
		});

		return fileTransfer;
	},

	uploadFile: function(localFileURL, uploadUrl, params, onSuccess, onError?, onProgress?, options?, trustAllHosts?){
		if(!FileTransfer){
			if(onError) onError.call(Util, {
				message: "FileTransfer not available"
			});

			return;
		}

		var fileTransfer = new FileTransfer();
		var fileExtension = this.getFileExtension(localFileURL);

		if(!options) options = {};

		if(!options.fileName) options.fileName = 'file' + (fileExtension ? '.' + fileExtension : '');
		if(!options.mimeType) options.mimeType = this.getFileMIMEType(localFileURL);
		if(options.chunkedMode === undefined) options.chunkedMode = false;
		
		if(!options.headers) options.headers = {};
		//if(!options.headers.Connection) options.headers.Connection = 'close';

		if(params) options.params = params;

		console.log('[Util.uploadFile] Uploading file: ' + localFileURL + ' / URL: ' + uploadUrl + ' / Options: ' + JSON.stringify(options));

		if(onProgress){
			fileTransfer.onprogress = function(progressEvent){
				if(progressEvent.lengthComputable){
					var percentage = ((progressEvent.loaded / progressEvent.total) * 100).toPrecision(3);
					onProgress.call(Util, percentage, progressEvent.loaded, progressEvent.total);
				}
			};
		}

		fileTransfer.upload(localFileURL, encodeURI(uploadUrl), function(result){
			if(!result.responseCode || result.responseCode == 200 || result.responseCode == 204){
				console.log('[Util.uploadFile] success: ', result);
				onSuccess.call(Util, result.response);
			}
			else{
				console.error('[Util.uploadFile] invalid response: ', result);
				if(onError) onError.call(Util);
			}
		}, function(error){
			console.error('[Util.uploadFile] error: ', error);

			if(error.code == FileTransferError.CONNECTION_ERR){
				console.error("[Util.uploadFile] response:\n" + error.body);
			}

			if(onError) onError.call(Util, error);
		}, options, trustAllHosts);

		return fileTransfer;
	},

	setNoBackupiOSAttribute: function(entry, onReady?, onError?){
		if(entry.setMetadata){
			entry.setMetadata(function(){
				console.log("Successfully set NoBackup iOS attribute to folder " + entry.toURL());
				if(onReady) onReady.call(Util);
			}, function(error){
				console.error("Could not set NoBackup iOS attribute to folder " + entry.toURL());
				if(onError) onError.call(Util, error);
			}, {
				"com.apple.MobileBackup": 1
			});
		}
		else console.warn('[Util.setNoBackupiOSAttribute] entry.setMetadata() method is not available.');
	},

	getFileExtension: function(fileName){
		if(FileEntry && fileName instanceof FileEntry){
			fileName = fileName.toURL();
		}

		fileName = fileName.split('.');
		return fileName.length > 1 ? fileName.pop().toLowerCase() : '';
	},

	getFileMIMEType: function(fileName){
		if(fileName instanceof FileEntry){
			fileName = fileName.toURL();
		}
		
		var mimeTypes = {
			'jpg': 'image/jpeg',
			'jpeg': 'image/jpeg',
			'gif': 'image/gif',
			'png': 'image/png',
			'bmp': 'image/bmp',
			'tif': 'image/tiff',
			'tiff': 'image/tiff',
			'ico': 'image/x-icon',
			'wmv': 'video/asf',
			'avi': 'video/avi',
			'divx': 'video/divx',
			'flv': 'video/x-flv',
			'mov': 'video/quicktime',
			'qt': 'video/quicktime',
			'mpg': 'video/mpeg',
			'mpeg': 'video/mpeg',
			'txt': 'text/plain',
			'csv': 'text/csv',
			'tsv': 'text/tab-separated-values',
			'rtx': 'text/richtext',
			'css': 'text/css',
			'htm|html': 'text/html',
			'mp3': 'audio/mpeg',
			'm4a': 'audio/mpeg',
			'mp4': 'video/mp4',
			'm4v': 'video/mp4',
			'ra|ram': 'audio/x-realaudio',
			'wav': 'audio/wav',
			'ogg|oga': 'audio/ogg',
			'ogv': 'video/ogg',
			'mid': 'audio/midi',
			'midi': 'audio/midi',
			'wma': 'audio/wma',
			'mka': 'audio/x-matroska',
			'mkv': 'video/x-matroska',
			'rtf': 'application/rtf',
			'js': 'application/javascript',
			'pdf': 'application/pdf',
			'doc': 'application/msword',
			'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml',
			'ppt': 'application/vnd.ms-powerpoint',
			'pps': 'application/vnd.ms-powerpoint',
			'pptx': 'application/vnd.openxmlformats-officedocument.presentationml',
			'xls': 'application/vnd.ms-excel',
			'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml',
			'mdb': 'application/vnd.ms-access',
			'mpp': 'application/vnd.ms-project',
			'swf': 'application/x-shockwave-flash',
			'class': 'application/java',
			'tar': 'application/x-tar',
			'zip': 'application/zip',
			'gz': 'application/x-gzip',
			'odt': 'application/vnd.oasis.opendocument.text',
			'odp': 'application/vnd.oasis.opendocument.presentation',
			'ods': 'application/vnd.oasis.opendocument.spreadsheet',
			'odg': 'application/vnd.oasis.opendocument.graphics',
			'odc': 'application/vnd.oasis.opendocument.chart',
			'odb': 'application/vnd.oasis.opendocument.database',
			'odf': 'application/vnd.oasis.opendocument.formula'
		};

		var extension = this.getFileExtension(fileName);

		if(extension){
			var type = mimeTypes[extension.toLowerCase()];
			if(type) return type;
		}
		
		return 'application/octet-stream';
	},

	DateTime: {
		MONTH_ABREV: {
			spanish: [ 
				"Ene", "Feb", "Mar", "Abr", 
				"May", "Jun", "Jul", "Ago", 
				"Sep", "Oct", "Nov", "Dic" 
			],

			english: [ 
				"Jan", "Feb", "Mar", "Apr", 
				"May", "Jun", "Jul", "Aug", 
				"Sep", "Oct", "Nov", "Dec" 
			]
		},

		MONTH_NAMES: {
			spanish: [ 
				"Enero", "Febrero", "Marzo", "Abril", 
				"Mayo", "Junio", "Julio", "Agosto", 
				"Septiembre", "Octubre", "Noviembre", "Diciembre" 
			],

			english: [ 
				"January", "February", "March", "April",
				"May", "June", "July", "August",
				"September", "October", "November", "December"
			]
		},

		clone: function(d) {
			var copy = new Date();
	        copy.setTime(d.getTime());
	        return copy;
		},

		getMonthAbrev: function(d) {
			return Util.DateTime.MONTH_ABREV[Util._language][d.getMonth()];
		},

		getMonthName: function(d) {
			return Util.DateTime.MONTH_NAMES[Util._language][d.getMonth()];
		},

		getFriendlyDate: function(d, shortDate?){
			if(!d) return "";
			if(!(d instanceof Date)) d = Util.DateTime.fromISO(d);
			var monthName = shortDate ? Util.DateTime.getMonthAbrev(d) : Util.DateTime.getMonthName(d);
			return d ? monthName + " " + d.getDate() + ", " + d.getFullYear() : "";
		},
		
		getFriendlyTime: function(d) {
			if(!d) return "";
			if(!(d instanceof Date)) d = Util.DateTime.fromISO(d);

			var curr_hour = d.getHours();
			var meridian = (curr_hour < 12) ? "AM" : "PM";

			if (curr_hour == 0)
			   curr_hour = 12;

			if (curr_hour > 12)
			   curr_hour = curr_hour - 12;

			var curr_min = d.getMinutes();
			return (Util.DateTime.twoDigits(curr_hour) + ":" + Util.DateTime.twoDigits(curr_min) + " " + meridian);
		},

		getFriendlyDateTime: function(d){
			if(!d) return "";
			if(!(d instanceof Date)) d = Util.DateTime.fromISO(d);
			return d ? Util.DateTime.getFriendlyDate(d) + " " + Util.DateTime.getFriendlyTime(d) : "";
		},

		fromISO: function(datetime) {
			if(!datetime) return null;

			if(datetime.indexOf(' ') == -1) datetime += ' 00:00:00';

			var t = datetime.split(/[- :]/);
			
			return new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
		},

		toISO: function(d) {
		    return d.getUTCFullYear() + "-" + Util.DateTime.twoDigits(1 + d.getUTCMonth()) + "-" + Util.DateTime.twoDigits(d.getUTCDate()) + " " + Util.DateTime.twoDigits(d.getUTCHours()) + ":" + Util.DateTime.twoDigits(d.getUTCMinutes()) + ":" + Util.DateTime.twoDigits(d.getUTCSeconds());
		},

		toHMS: function(d) {
			return Util.DateTime.twoDigits(d.getHours()) + ':' + Util.DateTime.twoDigits(d.getMinutes()) + ':' + Util.DateTime.twoDigits(d.getSeconds());
		},

		toYMD: function(d) {
	        var year, month, day;
	        year = String(d.getFullYear());
	        month = String(d.getMonth() + 1);
	        if (month.length == 1) {
	            month = "0" + month;
	        }
	        day = String(d.getDate());
	        if (day.length == 1) {
	            day = "0" + day;
	        }
	        return year + "-" + month + "-" + day;
		},

		twoDigits: function(d) {
		    if(0 <= d && d < 10) return "0" + d.toString();
		    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
		    return d.toString();
		}
	},

	clonePlainObject: function(obj){
		return JSON.parse(JSON.stringify(obj));
	},

	getGeoDistance: function(aPoint1, aPoint2){ // Returns the distance (in kilometers) between two geographic points (latitude/longitude pairs)
		var fLat1 = aPoint1[0];
		var fLon1 = aPoint1[1];
		var fLat2 = aPoint2[0];
		var fLon2 = aPoint2[1];
		
		var dLat = Util.degreesToRadians(fLat2-fLat1);
		var dLon = Util.degreesToRadians(fLon2-fLon1); 
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			 Math.cos(Util.degreesToRadians(fLat1)) * Math.cos(Util.degreesToRadians(fLat2)) * 
			 Math.sin(dLon/2) * Math.sin(dLon/2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		
		return (c * 6371); // kilometers
	},

	degreesToRadians: function(degrees){
		return degrees * (Math.PI / 180);
	},

	radiansToDegrees: function(radians){
		return radians * (180 / Math.PI);
	},

	loadScript: function(url, callback?, async?) {
		if(typeof callback === 'function' || callback === true || document.body){
			var script = document.createElement("script");

			script.type = "text/javascript";
			script.onload = function(){
				if(typeof callback == 'function') callback();
			};

			script.src = url;

			document.body.appendChild(script);
		}
		else{
			document.write('<script src="' + url + '"' + (async === true ? ' async="true"' : '') + (typeof callback == "string" ? ' onload="' + callback + '"' : '') + '></script>');
		}

		return this;
	},

	loadScripts: function(...args){
		for(var i=0; i<args.length; i++){
			Util.loadScript(args[i]);
		}

		return this;
	},

	getGoogleMapThumbnail: function(latitude, longitude, width, height) {
		var sMapURL = 'http://maps.googleapis.com/maps/api/staticmap?' +
					  'center=' + latitude + ',' + longitude + 
					  '&zoom=15&size=' + width + 'x' + height + 
					  '&markers=color:green%7Clabel:A%7C' + latitude + ',' + longitude +
					  '&sensor=true';

		return sMapURL;
	},

	parseJSON: function(json) {
		try {
	        var r = JSON.parse(json);
	        return r;
	    } catch (e) {
	        return null;
	    }
 	},

 	isEmail: function(input){
		return (/^[a-zA-Z0-9_\-\.]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$/g).test(input);
	},

	isNumeric: function(sValue){
		return (/^[0-9\.]+$/).test(sValue);
	},

	isAmount: function(sValue){
		return (/^[0-9\.\,]+$/).test(sValue);
	},

	onMobileDevice: function(){
		return navigator.userAgent.match(/(iphone|ipad|ipod|android|windows phone)/i) ? true : false;
	},

	oniOSDevice: function() {
	    return (navigator.userAgent.match(/(iphone|ipad|ipod)/i) ? true : false);
	},

	openURL: function(url, options?){
		if(!options) options = {};
		var target = (this.oniOSDevice() || url.indexOf('http') == 0) ? '_blank' : '_system';
		window.open(url, target, (options || 'closebuttoncaption=' + options.closeButtonCaption + ',location=no'));
	},

	openFile: function(filePath){
		/*
		NOTES:
		- Requires the "FileOpener2" Cordova plugin (cordova-plugin-file-opener2)
		- Uses the "In-App Browser"" Cordova plugin (cordova-plugin-inapp-browser) for remote files or as a fallback for the FileOpener2 plugin
		*/
		
		if(filePath.indexOf("http") === 0){
			Util.openURL(filePath);
		}
		else{
			if(cordova.plugins && cordova.plugins.fileOpener2){
				let mimeType = this.getFileMIMEType(filePath);

				cordova.plugins.fileOpener2.open(filePath, mimeType, {
					error : function(error){
						if(error.status == 9){
							alert("No available reader was found for this file (MIME: " + mimeType + ", File: " + filePath + ")");
						}
						else{
							alert("ERROR: " + error.message + " (Status: " + error.status + ")");
						}
					}
				});
			}
			else{
				alert("Cordova FileOpener2 plugin is not available.");
				Util.openURL(filePath);
			}
		}
	},

 	callPhone: function(phoneNumber){
 		phoneNumber = phoneNumber.toString().replace(/[^0-9]/g, "");
		window.location.href = "tel:" + phoneNumber;
 	},

 	sendEmail: function(address, subject?, message?){
		var params = [];
		if(subject) params.push("subject=" + encodeURIComponent(subject));
		if(message) params.push("body=" + encodeURIComponent(message));
		window.location.href = "mailto:" + address + (params.length != 0 ? ("?" + params.join("&")) : "");
	},

 	geocode: function(address, success, error, apiKey){ // Requires jQuery
 		var url = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=false';
		if(apiKey) url += '&key=' + apiKey;

 		(window['jQuery'] || window['$']).ajax({
 			url: (url + '&address=' + encodeURIComponent(address)),
 			type: 'GET',
 			dataType: 'json',
 			success: function(response){
	 			if(response.status == 'OK'){
	 				var point = response.results[0];

	 				if(point){
	 					var position = {
	 						latitude: point.geometry.location.lat,
	 						longitude: point.geometry.location.lng
	 					};

	 					success.apply(response, [response, position, point.formatted_address, response.results]);
	 				}
	 				else{
	 					if(error) error.call(response);
	 				}
	 			}
	 			else{
	 				if(error) error.call(response);
	 			}
	 		},
	 		error: function(){
	 			if(error) error();
	 		}
 		});
 	},

 	shareOnFacebook: function(sURL, sTitle, sImageURL?, sSummary?){
		if(!sURL) return;
		if(!sTitle) sTitle = "";
		var sShareURL = "https://www.facebook.com/sharer/sharer.php?s=100&p[url]=" + encodeURIComponent(sURL) + "&p[title]=" + encodeURIComponent(sTitle) + "&p[images][0]=" + encodeURIComponent(sImageURL || "") + "&p[summary]=" + encodeURIComponent(sSummary || "");
		window.open(sShareURL, "_blank");
	},

	postOnFacebook: function(params, callback?){
		var sPostURL = "https://www.facebook.com/dialog/feed?" +
			"app_id=" + params.appId +
			"&link=" + encodeURIComponent(params.link) +
			"&picture=" + (params.picture ? encodeURIComponent(params.picture) : "") +
			"&name=" + encodeURIComponent(params.name) +
			"&caption=" + (params.caption ? encodeURIComponent(params.caption) : "") +
			"&description=" + (params.description ? encodeURIComponent(params.description) : "") +
			"&redirect_uri=" + (params.returnUrl ? encodeURIComponent(params.returnUrl) : "");

		var browser = window.open(sPostURL, "_blank", "location=no,closebuttoncaption=Back");
		
		browser.addEventListener('loadstop', function(event: any){
			if(callback) callback.call(browser, event.url);
		});

		return browser;
	},

	postOnTwitter: function(sText, sURL, sVia){
		var sShareURL = "https://twitter.com/intent/tweet?source=tweetbutton&text=" + encodeURIComponent(sText);
		if(sURL) sShareURL += "&url=" + encodeURIComponent(sURL);
		if(sVia) sShareURL += "&via=" + sVia; 

		window.open(sShareURL, "_blank", "location=no,closebuttoncaption=Back");
	},

	shareOnPinterest: function(sURL, sImage, sDescription){
		var sShareURL = 'http://pinterest.com/pin/create/button/?url=' + encodeURIComponent(sURL) + '&media=' + encodeURIComponent(sImage) + '&description=' + encodeURIComponent(sDescription);
		window.open(sShareURL, "_blank", "location=no,closebuttoncaption=Back");
	},

	formatNumber: function(number, decimals = 0){
		number = parseFloat(number);

		if(isNaN(number)) return '-';
		
		number = number.toFixed(decimals);
		number += '';
		var x = number.split('.');
		var x1 = x[0];
		var x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;

		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}

		return x1 + x2;
	},

	formatMoney: function(amount, decimals = 0, prefix = '$', suffix = ''){
		return prefix + this.formatNumber(amount, decimals) + suffix;
	},

	store: function(key, object){
		var data = JSON.stringify(object);
		localStorage.setItem(key, data);
	},

	retrieve: function(key){
		var data = localStorage.getItem(key);
		
		if(data){
			try{
				var object = JSON.parse(data);
				return object;
			}
			catch(e){
				return null;
			}
		}
		else return null;
	},

	getTimestamp: function(){
		return Math.floor((new Date()).getTime() / 1000);
	},

	timestampToDate: function(timestamp){
		return new Date(timestamp * 1000);
	},

	naturalCompare: function(as, bs){
	    var a, b, a1, b1, i, n, L;
	    var rx=/(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;

	    if(as=== bs) return 0;
	    a= as.toLowerCase().match(rx);
	    b= bs.toLowerCase().match(rx);
	    L= a.length;
	    i=0;

	    while(i<L){
	        if(!b[i]) return 1;
	        a1=a[i];
	        b1=b[i];
	        i++;
	        if(a1!== b1){
	            n=a1-b1;
	            if(!isNaN(n)) return n;
	            return a1>b1? 1:-1;
	        }
	    }
	    
	    return b[i]? -1:0;
	},

	isOnline: function(){
		// Requires the org.apache.cordova.network-information PhoneGap plugin, otherwise it will use the deprecated navigator.onLine property
		if(typeof navigator['connection'] != 'undefined' && typeof navigator['connection'].type != 'undefined'){
			return (navigator['connection'].type != 'none');
		}
		else{
			return navigator.onLine ? true : false;
		}
	},

	onCellularConnection: function(){
		// Requires the org.apache.cordova.network-information PhoneGap plugin
		if(typeof navigator['connection'] != 'undefined' && typeof navigator['connection'].type != 'undefined' && typeof Connection != 'undefined'){
			return ([Connection.CELL_2G, Connection.CELL_3G, Connection.CELL_4G, Connection.CELL].indexOf(navigator['connection'].type) != -1);
		}
		else return null;
	},

	onISPConnection: function(){
		// Requires the org.apache.cordova.network-information PhoneGap plugin
		if(typeof navigator['connection'] != 'undefined' && typeof navigator['connection'].type != 'undefined' && typeof Connection != 'undefined'){
			return ([Connection.WIFI, Connection.ETHERNET, Connection.UNKNOWN].indexOf(navigator['connection'].type) != -1);
		}
		else return null;
	},

	onHighSpeedConnection: function(){
		// Requires the org.apache.cordova.network-information PhoneGap plugin
		if(typeof navigator['connection'] != 'undefined' && typeof navigator['connection'].type != 'undefined' && typeof Connection != 'undefined'){
			return (this.onISPConnection() || navigator['connection'].type == Connection.CELL_4G);
		}
		else return null;
	},

	getExcerpt: function(input, maxWords) {
		var words = input.split(' ');
		var excerpt = words.slice(0, maxWords).join(' ');

		if(excerpt.length < input.length) excerpt += '...';
	 
		return excerpt;
	},

	shortenText: function(input, charsPerLine, maxLines, opts?){
		if(!maxLines) maxLines = 1;

		var words = input.split(' '),
			currentLineLength = 0,
			lastLineBreakWordIndex = 0,
			currentWord,
			lines = [],
			shortenedInput = input;

		for(var i=0; i<words.length; i++){
			currentWord = words[i];
			currentLineLength += currentWord.length;

			if(i != (words.length - 1)){ // If we're not in the last word
				currentLineLength ++; // Space counts as 1 character
			}

			if(currentLineLength >= charsPerLine){
				// Add the new words to the line until before the current word that made the line length exceed its limit
				lines.push(words.slice(lastLineBreakWordIndex, i).join(' '));
				// Set the index of the last line break to the current one
				lastLineBreakWordIndex = i;
				// Set the line length to be the length of the current word pending to be added to the line
				currentLineLength = currentWord.length;	
			}

			// If we're on the last word and there are still words to be added
			if(i == (words.length - 1) && lastLineBreakWordIndex < i){
				// Add a new line with the rest of the words
				lines.push(words.slice(lastLineBreakWordIndex).join(' '));
			}

			if(lines.length >= maxLines){
				// Trim the lines to the maximum allowed number of lines
				lines = lines.slice(0, maxLines);
				// Create the shortened name by concatenating the lines
				shortenedInput = lines.join(' ');
				// If the shortened name is indeed shorter add a elipsis at the end
				if(shortenedInput.length < input.length){
					shortenedInput += '...';
				}
				break;
			}
		}

		return shortenedInput;
	},

	removeHTML: function(input){
		return input.replace(/<\/?[^>]+>/g, "");
	},

	getGeoLocation: function(onSuccess, onError?, config?, hideLoader?, hideError?, onCancel?){
		var self = this;

		if(!geolocation) geolocation = navigator.geolocation;

		if(!config){
			config = {};
		}
		
		if(!config.timeout) config.timeout = 10000;

		self._geolocationCancelled = false;
		
		let loader;

		if(hideLoader !== true){
			loader = UI.createLoader();
		}

		geolocation.getCurrentPosition(function(position){
			if(self._geolocationCancelled) return;
			if(loader) loader.dismiss(self._geolocationMaskLockId).catch(() => {});
			console.log('[Util.getGeoLocation] Position: ', position);
			onSuccess(position.coords);
		}, function(error){
			if(self._geolocationCancelled) return;
			if(loader) loader.dismiss(self._geolocationMaskLockId).catch(() => {});

			if(config.default){
				onSuccess({
					latitude: config.default[0],
					longitude: config.default[1]
				});
				
				return;
			}

			console.warn('[Util.getGeoLocation] Error: ', error);
			if(hideError !== true) UI.createAlert('Lo sentimos, ocurrió un error y no se pudo obtener su posición geográfica por GPS. Por favor intente de nuevo.');
			if(onError) onError();
		}, config);
	},

	getGeolocation: function(){ // Alias of getGeoLocation()
		this.getGeoLocation.apply(this, arguments);
	},

	triggerEvent: function(element, eventName){
		element.dispatchEvent(new Event(eventName));
	},

	minutesToElapsedTime: function(minutes, shortened){
		minutes = parseInt(minutes, 10);
		
		var hoursFormat = shortened ? '%s hrs' : '%s horas';
		var singleHourFormat = shortened ? '%s hr' : '%s hora';
		var minutesFormat = shortened ? '%s mins' : '%s minutos';
		var singleMinuteFormat = shortened ? '%s min' : '%s minuto';

		if(minutes >= 60){
			var hours = Math.floor(minutes / 60);
			minutes = minutes % 60;

			var hoursLabel = sprintf((hours == 1 ? singleHourFormat : hoursFormat), hours);
			var minutesLabel = sprintf((minutes == 1 ? singleMinuteFormat : minutesFormat), minutes);

			if(minutes > 0){
				return sprintf('%s, %s', hoursLabel, minutesLabel);
			}
			else{
				return hoursLabel;
			}
		}
		else{
			return sprintf((minutes == 1 ? singleMinuteFormat : minutesFormat), minutes);
		}
	},

	directionsTo: function(addressOrCoords){
		var url;
		
		addressOrCoords = encodeURIComponent(addressOrCoords);

		if(this.oniOSDevice()){
			url = 'http://maps.apple.com/maps?saddr=current%20location&daddr=' + addressOrCoords;
		}
		else{
			url = 'https://maps.google.com/maps?daddr=' + addressOrCoords;
		}

		window.open(url, '_system');
	}
};