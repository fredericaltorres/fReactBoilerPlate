import Tracer from './Tracer';
import moment from "moment"; // http://momentjs.com/
import FirestoreManagerConfig from './FirestoreManagerConfig';

const DEFAULT_MAX_RECORD = 128;

class FirestoreManager {

	static _initialized = false;
	
	constructor() {

		if(!FirestoreManager._initialized) {            
			
			this.name = 'FirestoreManager';
			Tracer.log(`FirestoreManager init`, this);
			firebase.initializeApp(FirestoreManagerConfig);
			FirestoreManager._initialized = true;
			this.__setUpOnAuthStateChanged();
		}
	}
	__setUpOnAuthStateChanged () {

		firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				if (user != null) {
					// let name = user.displayName;
					// let email = user.email;
					// let photoUrl = user.photoURL;
					// let emailVerified = user.emailVerified;
					// let uid = user.uid;  // The user's ID, unique to the Firebase project. Do NOT use
					// 				 // this value to authenticate with your backend server, if
					// 				 // you have one. Use User.getToken() instead.
					Tracer.log(`FirestoreManager currentUser:${this.getCurrentUser().displayName}`, this);
				}
			} else {
				console.log('No user change');
			}
		});		
	}
	getCurrentUser() {
		return firebase.auth().currentUser;
	}
	// https://firebase.google.com/docs/auth/web/manage-users?authuser=0
	googleLogin() {

		const provider = new firebase.auth.GoogleAuthProvider();
		firebase.auth().signInWithPopup(provider).then((result) => {
			const user = result.user;
			console.dir(user);
			alert(`Hello ${user.displayName}`);
		}).catch((error) => {
			console.error(error);
		});
	}
	getFirestoreDB() {

		const app = firebase.app();
		const firestore = firebase.firestore();
		const settings = { timestampsInSnapshots: true };
		firestore.settings(settings);
		return firestore;
	}
	getStorageRef() {

		return firebase.storage().ref();
	}
	getCollection(name) {

		return new FirestoreManager().getFirestoreDB().collection(name);
	}
	showErrorToUser(msg) {
		Tracer.error(msg, this);
		alert(`ERROR: ${msg}`);
	}
	__rebuildDocument(doc) {
		const data = doc.data();
		data.id = doc._key.toString();
		return data;
	}
	// https://firebase.google.com/docs/database/web/lists-of-data
	// https://firebase.google.com/docs/firestore/query-data/listen
	monitorQuery(collection, callBack, orderByColumn = null, orderDirection = 'desc', maxRecord = DEFAULT_MAX_RECORD) {
		
		Tracer.log(`monitorQuery ${collection}`, this);

		this.getCollection(collection)
		.orderBy(orderByColumn, orderDirection)
		.limit(maxRecord)
		.onSnapshot((querySnapshot) => {
			var records = [];
			querySnapshot.forEach((doc) => { 
				records.push(this.__rebuildDocument(doc)); 
			});
			try {
				if(callBack) callBack(records);
			}
			catch(ex) {
				Tracer.error(`monitorQuery ${collection} failed calling callback`);
			}
		});
	}
	loadDataFromCollection(collection, orderByColumn = null, orderDirection = 'desc', maxRecord = DEFAULT_MAX_RECORD) {

		Tracer.log(`loadDataFromCollection(${collection}, ${orderByColumn}, ${orderDirection}, ${maxRecord})`, this);

		return new Promise((resolve, reject) => {

			const dbToDoItems = this.getCollection(collection);
			const query = dbToDoItems.orderBy(orderByColumn, orderDirection).limit(maxRecord);
			query.get().then(todoItems => {

				let items = [];
				todoItems.forEach(doc => {

					items.push(this.__rebuildDocument(doc));
				});
				Tracer.log(`loadDataFromCollection(${items.length} records loaded)`, this);
				resolve(items);
			});
		});
	}
	// https://firebase.google.com/docs/database/web/read-and-write
	updateRecord(collection, data, idFieldName = "id", overWriteDoc = true) {

		return new Promise((resolve, reject) => {

			Tracer.log(`updateRecord data:${JSON.stringify(data)}`, this);
			const longId = data[idFieldName];
			const id 	 = this.extractId(longId);
			delete data[idFieldName];

			const docRef = this.getCollection(collection).doc(id);
			let p = null;
			if(overWriteDoc)
				p = docRef.set(data);
			else				
				p = docRef.update(data);

			p.then(() => {
					Tracer.log(`updateRecord ${idFieldName}:${longId} succeeded`, this);
					resolve(longId);
				}).catch((error) => {
					this.showErrorToUser(`updateRecord ${idFieldName}:${longId} failed ${error}`);
					reject(error);
				});
		});
	}
	// https://firebase.google.com/docs/firestore/manage-data/delete-data
	deleteRecord(collection, id) {

		return new Promise((resolve, reject) => {

			Tracer.log(`deleteRecord id:${id}`, this);
			id = this.extractId(id);
			const docRef = this.getCollection(collection).doc(id);
			docRef.delete()
				.then(() => {
					Tracer.log(`deleteRecord  id:${id} succeeded`, this);
					resolve(id);
				}).catch((error) => {
					this.showErrorToUser(`deleteRecord  id:${id} failed ${error}`);
					reject(error);
				});
		});
	}
	// https://firebase.google.com/docs/firestore/manage-data/add-data
	addRecord(collection, data, idFieldName = "id") {

		return new Promise((resolve, reject) => {

			Tracer.log(`addRecord data:${JSON.stringify(data)}`, this);
			const id = this.getNewUniqueId();
			this.getCollection(collection).doc(id).set(data)
				.then(() => {
					Tracer.log(`addRecord ${idFieldName}:${id} succeeded`, this);
					resolve({ ...data, [idFieldName]:`${collection}/${id}` });
				}).catch((error) => {
					this.showErrorToUser(`addRecord ${idFieldName}:${id} failed ${error}`);
					reject(error);
				});
		});
	};
	// https://firebase.google.com/docs/reference/js/firebase.firestore.Timestamp
	formatTimestamp(timestamp, format = 'YYYY/MM/DD h:mm:ss a') {

		const m = moment(timestamp.toDate());
		const s = m.format(format);
		return s;
	}
	extractId(refId) {

		const parts = refId.split('/');
		if(parts.length > 0) {
			return parts[parts.length-1];
		}
		return refId;
	}
	now() {

		return firebase.firestore.Timestamp.now();
	}
	getNewUniqueId() {
		
		return Math.random().toString(16).substr(2, 16);
	}	
}  

export default new FirestoreManager();