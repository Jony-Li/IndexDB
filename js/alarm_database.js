//(function(){
	function AlarmDatabase(dbName,storeName,version){
		this.dbName = dbName;
		this.storeName = storeName;
		this.version = version;
		//适配兼容性
		this.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;

		this.withDatabase = new Promise((resolve,reject) => {
			var request = this.indexedDB.open(this.dbName,this.version);
			request.onupgradeneeded = (event) => {
				var db = event.target.result;
				//Ensure the object store exists.
				if(!db.objectStoreNames.contains(this.storeName)){
					var objectStore = db.createObjectStore(this.storeName,{keyPath: 'id',autoIncrement: true});
					//TODO create index
					//objectStore.createIndex
				}
			};
			request.onsuccess = ((event) => {resolve(event.target.result)});
			request.onerror = ((event) => {reject(event.target.errorCode || event.target.error)});
		}).then((db) => {
			//Only return when all of the alarms have been upgraded
			return new Promise((resolve, reject) => {
				//Go through existing alarms here,and make sure they conform
				//to the latest spec(upgrade old version,etc...).
				var transaction = db.transaction(this.storeName,'readwrite');
				var store = transaction.objectStore(this.storeName);
				var request = store.openCursor();
				request.onsuccess = ((event) => {
					var cursor = event.target.result;
					if(cursor){
						store.put(this.normalizeAlarmRecord(cursor.value));
						cursor.continue();
					}
				});

				transaction.oncomplete = (() => resolve(db));
				transaction.onerror = ((event) => reject(event.target.errotCode || event.target.error));
			});
		}).catch((error) => {
			//Explicit error.toString() coercion needed to see a message
			console.error('AlarmDatabase Fatal Error: ',error.toString());
		});
	}

	AlarmDatabase.prototype = {
		normalizeAlarmRecord: function(alarm){
			if(!alarm.registeredAlarms){
				alarm.registeredAlarms = {};
			}
			if (typeof alarm.enabled !== 'undefined') {
				delete alarm.enabled;//删除对象的属性
			}
			if (typeof alarm.normalAlarmId !== 'undefined') {
				alarm.registeredAlarms.normal = alarm.normalAlarmId;
				delete alarm.normalAlarmId;
			}
			if (typeof alarm.snoozeAlarmId !== 'undefined') {
				alarm.registeredAlarms.snooze = alarm.snoozeAlarmId;
				delete alarm.snoozeAlarmId;
			}
			if (typeof alarm.repeat === 'string') {
				var days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
				var newRepeat = {};
				for (var i = 0; i < alarm.repeat.length && i < days.length; i++) {
					if (alarm.repeat[i] === '1') {
						newRepeat[days[i]] = true;
					}
				}
				alarm.repeat = newRepeat;
			}else {
				alarm.repeat = alarm.repeat || {};
			}

			alarm.hour = parseInt(alarm.hour, 10);
			alarm.minute = parseInt(alarm.minute, 10);
			return alarm;
	},
	/**
	 * Execute a database store request with the given method and	
	 * arguments,returning a Promise that will be fullfilled with the 
	 * Store's result.
	 */
	 withStoreRequest:function(method){
	 	console.log(arguments);
	 	//var args = arguments[1];

	 	var args1 = new Array(arguments.length);
	 	for(var i=0,len = arguments.length; i<len;i++){
	 		args1[i] = arguments[i];
	 	}
	 	var args = args1.slice(1);
	 	// /get/.test(string) 前面参数是正则表达式
	 	var readmode = (/get/.test(method) ? 'readonly' : 'readwrite');
	 	console.log(readmode);
	 	return this.withDatabase.then((database) => {
	 		var store = database.transaction(this.storeName,readmode).objectStore(this.storeName);
	 		if(method === 'getAll'){
	 			return objectStoreGetAll(store);
	 		}else {
	 			return new Promise((resolve,reject) => {
	 				//TODO why
				 	console.log(args);
	 				//var request = store[method].apply(store, args);
	 				//var request = store.put(args);
	 				//等同于 store.method(args)
	 				var request = store[method].apply(store,args);
	 				request.onsuccess = ((event) => {resolve(event.target.result)});
	 				request.onerror = ((event) => {reject(event.target.error)});
	 			});
	 		}
	 	});
	 },

	 put:function(alarm){
	 	//var data = alarm.toJSON();
	 	var data = alarm;
	 	if(!data.id){
	 		delete data.id;//IndexedDB requires _no _ID key, not null/undefined.
	 	}
	 	return this.withStoreRequest('put',data).then((id) => {
	 		alarm.id = id;
	 	});
	 },

	 get:function(id){
	 	//模拟数据 JSON
	 	var Alarm =  {
	 		id: 1,
	 		registeredAlarms:1,
	 		repeat:1,
	 		hour:1,
	 		minute:1,
	 		lable:1,
	 		sound:1,
	 		vibrate:1,
	 		snooze:1,
	 	};
	 	return this.withStoreRequest('get',id).then((data) => {
	 		console.log('-----------------');
	 		console.log(data);
	 	});
	 }
	}

	function objectStoreGetAll(objectStore){
		return new Promise((resolve, reject) => {
			var items = [];
			var request = objectStore.openCursor();
			request.onsuccess = ((event) => {
				var cursor = event.target.result;
				if (cursor) {
					items.push(cursor.value);
					cursor.continue();
				}else {
					resolve(items);
				}
			})
		});
	}

//});