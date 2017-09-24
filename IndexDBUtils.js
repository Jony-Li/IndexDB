var IndexDBUtils = {
	//dbname:数据库名;version:版本号;storeName:仓库名(表名);key:主键;increment:是否自增长
	initDB:function(dbname,version,storeName,indexName,key,increment=true){
		var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
		var version = version || 1;
		var request = indexedDB.open(dbname,version);
		request.onsuccess = function(event){
			console.log('create or open DB successed');
			IndexDBUtils.database = event.target.result;
			console.log(IndexDBUtils.database);
		};
		request.onerror = function(event){
			console.error('create DB failed: ', event.target.errorCode || event.target.error);
		};

		//数据库版本号增加时，会触发onupgradeneeded事件(该事件会在onsuccess之前调用)
		//第一次创建数据库的时候也会先触发onupgradeneeded事件，之后再调用onsuccess事件
		request.onupgradeneeded = function(event){
			console.log('for the first time to create DB or upgrade IndexDB');
			let db = event.target.result;
			//IndexDBUtils.database = event.currentTarget.result;
			IndexDBUtils.database = db;
			console.log('increment: ' + increment);
			if(!db.objectStoreNames.contains(storeName)){
				//ObjectStore必须在onupgradeneeded事件中创建，否则会创建失败
				var objectStore = increment? IndexDBUtils.database.createObjectStore(storeName,{keyPath:key,autoIncrement:true}):
				IndexDBUtils.database.createObjectStore(storeName,{keyPath:key});
				//必须在数据库初始化(onupgradeneeded)创建索引……
				//nameIndex:索引名称;name:索引对应表的字段名;unique:索引是否唯一
				objectStore.createIndex('nameIndex','name',{unique:true});
			}
		};
	},
	closeDB:function(db){
		console.log('close DB');
		db.close();
	},
	deleteDB:function(dbname){
		indexedDB.deleteDatabase(dbname);
	},
	addData:function(db,storeName,data){
		console.log('addData');
		let transaction = db.transaction(storeName,'readwrite');
		let store = transaction.objectStore(storeName);
		for(let i = 0,len = data.length;i < len;i++){
			store.add(data[i]);//这样添加数据主键必须是自增长的
			//store.add();//自定义key
		}
	},
	updateData:function(db,storeName,data){
		console.log('updateData');
		let transaction = db.transaction(storeName,'readwrite');
		let store = transaction.objectStore(storeName);
		let request = store.put(data);
		request.onsuccess = function(event){
			console.log('updateData successed');
		}
		request.onerror = function(event){
			console.error('updateData error: '+ event.target.errorCode || event.target.error);
		}
	},
	getDataById:function(db,storeName,id){
		console.log('getDataById');
		let transaction = db.transaction(storeName,'readwrite');
		let store = transaction.objectStore(storeName);
		var request = store.get(id);
		request.onsuccess = function(event){
			var data = event.target.result;
			console.log(data);
			return data;
		}
		request.onerror = function(event){
			console.error('getDataById error:',event.target.errorCode || event.target.error);
		}
	},
	//根据索引来获取数据
	//db:数据库;storeName:库(表)名;indexName:创建的索引名;name:查询的名字
	indexGetDataByName:function(db,storeName,indexName,name){
		console.log('indexGetData');
		let transaction = db.transaction(storeName,'readwrite');
		let store = transaction.objectStore(storeName);
		let index = store.index(indexName);
		let request = index.get(name);
		request.onsuccess = function(event){
			let data = event.target.result;
			console.log('indexGetDataByName successed: ' + event.target.result);
			console.log(data);
			return data;
		};
		request.onerror = ((event)=>{//使用ES箭头函数
			console.error('indexGetDataByName error: ',event.target.errorCode || event.target.error);
		});
	},
	//索引和游标联合查询
	indexOpenCursor:function(db,storeName,indexName){
		let transaction = db.transaction(storeName,'readwrite');
		let store = transaction.objectStore(storeName);
		let index = store.index(indexName);
		let request = index.openCursor();
		request.onsuccess = ((event)=>{
			let cursor = event.target.result;
			if(cursor){// check cursor
				let value = cursor.value;
				console.log(value);
				cursor.continue();//
			}
		});
		request.onerror = ((event)=>{
			console.error('indexOpenCursor error:', event.target.errorCode || event.target.error);
		});
	},
/*	console.log('----------------------');
	console.log("initDb ...");
	var req = indexedDB.open('test0001', 29);
	req.onsuccess = function (evt) {
		db = evt.target.result;
		console.log("initDb opened");
	};
	req.onerror = function (evt) {
		console.error("initDb error:", evt.target.errorCode || evt.target.error);
	};

	//增加数据库版本号时,会触发onupgradeneeded事件(会在onsuccess之前被调用)
	req.onupgradeneeded = function (evt) {
		console.log("initDb.onupgradeneeded");
		db = evt.currentTarget.result;
		console.log(db);
		//ObjectStore必须在onupgradeneeded里创建，其他地方将会创建失败
		var usersStore = db.createObjectStore("users002", { keyPath : "id" });
		usersStore.createIndex("name", "name", { unique : false });
	};
	*/
};