/*
	Firebase / Cloud Firestore helper class

	Auth: https://firebase.google.com/docs/auth/web/manage-users?authuser=0
	Pricing: https://firebase.google.com/pricing/?authuser=0
	Database operation
		Query
			https://firebase.google.com/docs/database/web/lists-of-data
			https://firebase.google.com/docs/firestore/query-data/listen
			https://firebase.google.com/docs/database/web/read-and-write
		Delete
			https://firebase.google.com/docs/firestore/manage-data/delete-data
		Add			
			https://firebase.google.com/docs/firestore/manage-data/add-data
			https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes

	Torres Frederic 2018			
*/
import Tracer from './Tracer';
import moment from "moment"; // http://momentjs.com/
import FirestoreManagerConfig from './FirestoreManagerConfig';
import ComponentUtil from './ComponentUtil';

const DEFAULT_MAX_RECORD = 400;
const DEFAULT_ID_FIELD_NAME = "id";

const getSettings = () => {

	return { timestampsInSnapshots: true };
}

// This class is exported as a singleton.
// Therefore static members could be just members
class FirestoreManager {

	static _initialized = false;

	// Static object to store snapshot unsusbcribe method, to be able to 
	// unsubscribe and stop monitoring data
	static _monitoredSnapshot = {

	};
	
	constructor() {

		this._settings = getSettings();
		this.batchModeOn = false;

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
		firebase.auth().signInWithPopup(provider)
			.then((result) => {
				const user = result.user;
				alert(`Hello ${user.displayName}`);
			})
			.catch((error) => {
				Tracer.error(error, this);
			});
	}
	getFirestoreDB() {

		if(this._firestoreDb) 
			return this._firestoreDb;

		const firestore = firebase.firestore();
		firestore.settings(this._settings);
		this._firestoreDb = firestore;
		return this._firestoreDb;
	}
	getStorageRef() {

		return firebase.storage().ref();
	}
	getCollection(name) {

		return this.getFirestoreDB().collection(name);
	}
	startBatch() {
		
		Tracer.log(`startBatch`, this);
		this.batchModeOn = true;
		return this.getFirestoreDB().batch();
	}
	commitBatch(batch) {

		Tracer.log(`commitBatch`, this);
		console.log('batch', batch);
		this.batchModeOn = false;
		return batch.commit();
	}
	showErrorToUser(msg) {

		Tracer.error(msg, this);
		alert(`ERROR: ${msg}`);
	}
	__rebuildDocument(doc,  idFieldName = DEFAULT_ID_FIELD_NAME) {

		const data = doc.data();
		data[idFieldName] = doc._key.toString();
		return data;
	}
	__rebuildDocuments(documents) {

		const records = [];
		documents.forEach((doc) => { 
			records.push(this.__rebuildDocument(doc)); 
		});
		return records;
	}
	__unsubscribeMonitoredSnapshot(unsubscribe) {

		unsubscribe();
	}
	stopMonitorQuery(collection) {
		
		if(FirestoreManager._monitoredSnapshot[collection]) {

			Tracer.log(`Unsubscribe monitored snapshot:${collection}`);
			this.__unsubscribeMonitoredSnapshot(FirestoreManager._monitoredSnapshot[collection]);
			delete FirestoreManager._monitoredSnapshot[collection];
		}
	} 
	// https://firebase.google.com/docs/database/web/lists-of-data
	// https://firebase.google.com/docs/firestore/query-data/listen
	monitorQuery(collection, callBack, orderByColumn = null, orderDirection = 'desc', maxRecord = DEFAULT_MAX_RECORD) {
		
		Tracer.log(`monitorQuery ${collection}, orderByColumn:${orderByColumn}/${orderDirection}, maxRecord:${maxRecord}`, this);
		this.stopMonitorQuery(collection);

		// Return a function handler that can unsubscribe the snapshot 
		FirestoreManager._monitoredSnapshot[collection] = this.getCollection(collection)
		.orderBy(orderByColumn, orderDirection)
		.limit(maxRecord)
		.onSnapshot((querySnapshot) => {
			const records = this.__rebuildDocuments(querySnapshot)
			try {
				if(callBack) callBack(records);
			}
			catch(ex) {
				Tracer.error(`monitorQuery ${collection} failed '${ex}' calling callback`);
			}
		});
		return true;
	}
	loadDataFromCollection(collection, orderByColumn = null, orderDirection = 'desc', maxRecord = DEFAULT_MAX_RECORD) {

		Tracer.log(`loadDataFromCollection(${collection}, ${orderByColumn}, ${orderDirection}, ${maxRecord})`, this);

		return new Promise((resolve, reject) => {

			const dbToDoItems = this.getCollection(collection);
			const query = dbToDoItems.orderBy(orderByColumn, orderDirection).limit(maxRecord);
			query.get().then(todoItems => {

				const items = this.__rebuildDocuments(todoItems)
				Tracer.log(`loadDataFromCollection(${items.length} records loaded)`, this);
				resolve(items);
			});
		});
	}
	// https://firebase.google.com/docs/database/web/read-and-write
	updateRecord(collection, oData, idFieldName = DEFAULT_ID_FIELD_NAME, overWriteDoc = true) {

		// Duplicate the object for now, trying to removed and add the
		// id property created some problems
		const data = Object.assign({}, oData);
		const longId = data[idFieldName];
		const idStringForTracing = `${idFieldName}:${longId}`;
		Tracer.log(`updateRecord ${idStringForTracing}`, this);				
		const id = this.extractId(longId);
		delete data[idFieldName];
		const docRef = this.getCollection(collection).doc(id); // Load the record

		let p = null;
		if(overWriteDoc)
			p = docRef.set(data); // overwrite mode
		else				
			p = docRef.update(data); // Merge mode

		if(this.batchModeOn) {

		}
		else {
			return new Promise((resolve, reject) => {

				p.then(() => {

					Tracer.log(`updateRecord ${idStringForTracing} succeeded`, this);
					resolve(longId);

				}).catch((error) => {

					this.showErrorToUser(`updateRecord ${idStringForTracing} failed ${error}`);
					reject(error);
				});
			});
		}
	}
	// https://firebase.google.com/docs/firestore/manage-data/delete-data
	deleteRecord(collection, id) {

		if(this.batchModeOn) {
			Tracer.log(`deleteRecord batch id:${id}`, this);
			id = this.extractId(id);
			const docRef = this.getCollection(collection).doc(id);
			docRef.delete();
		}
		else {

			return new Promise((resolve, reject) => {

				Tracer.log(`deleteRecord id:${id}`, this);
				id = this.extractId(id);
				const docRef = this.getCollection(collection).doc(id);
				docRef.delete()
					.then(() => {
	
						Tracer.log(`deleteRecord  id:${id} succeeded`, this);
						resolve(id);
					})
					.catch((error) => {
	
						this.showErrorToUser(`deleteRecord  id:${id} failed ${error}`);
						reject(error);
					});
			});			
		}
	}
	// https://firebase.google.com/docs/firestore/manage-data/add-data
	// https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes
	addRecord(collection, data, idFieldName = DEFAULT_ID_FIELD_NAME) {

		if(this.batchModeOn) {

			// Tracer.log(`addRecord batch`, this);
			const id = ComponentUtil.getNewUniqueId();
			this.getCollection(collection).doc(id).set(data);
		}
		else { 

			return new Promise((resolve, reject) => {

				const id = ComponentUtil.getNewUniqueId();
				const idStringForTracing = `${idFieldName}:${id}`;
				Tracer.log(`addRecord ${idStringForTracing}`, this);
				this.getCollection(collection).doc(id).set(data)
					.then(() => {

						Tracer.log(`addRecord ${idStringForTracing} succeeded`, this);
						resolve({ ...data, [idFieldName]:`${collection}/${id}` });
					})
					.catch((error) => {

						this.showErrorToUser(`addRecord ${idStringForTracing} failed ${error}`);
						reject(error);
					});
			});
		}
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
	invertOrderDirection(d) {

		return d === 'desc' ? 'asc' : 'desc';
	}
	orderDirectionIcon(d) {
		return d === 'desc' ? "D" : "A";
	}
}  

export default new FirestoreManager();