import Tracer from './Tracer';
import moment from "moment"; // http://momentjs.com/
import { runInNewContext } from 'vm';

const firestoreManagerConfig = {

	// https://console.developers.google.com/apis/credentials? 
	// https://console.developers.google.com/apis/credentials?pli=1&project=api-project-272201949745&folder&organizationId

	apiKey: "AIzaSyDZwgZ8wGSbfstXLuvr9iROHTL5YUVzJ34",

	// apiKey: "AIzaSyB3BLrGo3Y0qlMDJqvuP9JqYIHeDG5Ty-w",	

	legacyServerKey : "AIzaSyBW4rDtW7IKIIQWF31ak8bRgfrUyWwRZbU",	

	authDomain: "fredtodo-f553b.firebaseapp.com",
	databaseURL: "https://fredtodo-f553b.firebaseio.com",
	projectId: "fredtodo-f553b",
	storageBucket: "fredtodo-f553b.appspot.com",
	messagingSenderId: "308390253585"
};

class FirestoreManager {

	static _initialized = false;
	
	constructor() {

		if(!FirestoreManager._initialized) {            
			
			this.name = 'FirestoreManager';
			Tracer.log(`FirestoreManager init`, this);
			firebase.initializeApp(firestoreManagerConfig);
			FirestoreManager._initialized = true;
			this.__setUpOnAuthStateChanged();
		}
		// Tracer.log(`FirestoreManager currentUser:${firebase.auth().currentUser} ==========`, this);
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
					Tracer.log(`FirestoreManager currentUser:${this.getCurrentUser().displayName} ==========`, this);
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
		Tracer.error(msg);
		alert(`ERROR: ${msg}`);
	}
	loadDataFromTable(collection, orderByColumn = null, orderDirection = 'desc', maxRecord = 100) {

		Tracer.log(`loadDataFromTable(${collection}, ${orderByColumn}, ${orderDirection}, ${maxRecord})`, this);

		return new Promise((resolve, reject) => {

			const dbToDoItems = this.getCollection(collection);
			const query = dbToDoItems.orderBy(orderByColumn, orderDirection).limit(maxRecord);
			query.get().then(todoItems => {

				let items = [];
				todoItems.forEach(doc => {

					const data = doc.data();
					data.id = doc._key.toString();
					items.push(data);
				});
				Tracer.log(`loadDataFromTable(${items.length} records loaded)`, this);
				resolve(items);
			});
		});
	}
	// https://firebase.google.com/docs/database/web/read-and-write
	updateRecord(collection, data, idFieldName = "id", overWriteDoc = true) {

		return new Promise((resolve, reject) => {

			Tracer.log(`updateRecord data:${JSON.stringify(data)}`);
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
					Tracer.log(`updateRecord ${idFieldName}:${longId} succeeded`);
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

			Tracer.log(`deleteRecord id:${id}`);
			id = this.extractId(id);
			const docRef = this.getCollection(collection).doc(id);
			docRef.delete()
				.then(() => {
					Tracer.log(`deleteRecord  id:${id} succeeded`);
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

			Tracer.log(`addRecord data:${JSON.stringify(data)}`);
			const id = this.getNewUniqueId();
			this.getCollection(collection).doc(id).set(data)
				.then(() => {
					Tracer.log(`addRecord ${idFieldName}:${id} succeeded`);
					resolve({ ...data, [idFieldName]:`${collection}/${id}` });
				}).catch((error) => {
					this.showErrorToUser(`addRecord ${idFieldName}:${id} failed ${error}`);
					reject(error);
				});
		});
	};
	// https://firebase.google.com/docs/reference/js/firebase.firestore.Timestamp
	formatTimestamp(timestamp, format = 'YYYY/MM/DD h:mm:ss a') {

		return moment(timestamp).format(format);
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