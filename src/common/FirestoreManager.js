/*
	Firebase / Cloud Firestore helper class

	Auth: https://firebase.google.com/docs/auth/web/manage-users?authuser=0
	Pricing: https://firebase.google.com/pricing/?authuser=0
	Database operation
		Query
			https://firebase.google.com/docs/firestore/query-data/get-data
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
import TypeUtil from './TypeUtil';

const DEFAULT_MAX_RECORD = 400;
const DEFAULT_ID_FIELD_NAME = "id";
const UPDATE_AT_PROPERTY_NAME = "updatedAt";

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
		if(!data)
			return null; // The document does not exist
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
	monitorQuery(collection, callBack, orderByColumn = null, orderDirection = 'desc', maxRecord = DEFAULT_MAX_RECORD
			// , filterFunc = null
		) {
		
		Tracer.log(`monitorQuery ${collection}, orderByColumn:${orderByColumn}/${orderDirection}, maxRecord:${maxRecord}`, this);
		this.stopMonitorQuery(collection);

		let query = null;
		if(orderByColumn) {
			query = this.getCollection(collection)
				.orderBy(orderByColumn, orderDirection)
					.limit(maxRecord);
		}
		else {
			query = this.getCollection(collection).limit(maxRecord);
		}

		// Return a function handler that can unsubscribe the snapshot 
		FirestoreManager._monitoredSnapshot[collection] = query.onSnapshot((querySnapshot) => {

			let records = this.__rebuildDocuments(querySnapshot)
			try {
				// if(filterFunc) {
				// 	records = records.filter(filterFunc);
				// }
				if(callBack) callBack(records);
			}
			catch(ex) {
				Tracer.error(`monitorQuery ${collection} failed '${ex}' calling callback`);
			}
		});
		return true;
	}
	loadDocument(collection, documentId, subCollections = null) {

		Tracer.log(`loadDocument(${collection}, ${documentId})`, this);
		return new Promise((resolve, reject) => {
			
			const docRef = this.getCollection(collection).doc(documentId);
			docRef.get().then(doc =>  {

				const item = this.__rebuildDocument(doc);
				if(item === null) {
					Tracer.throw(`loadDocument(${collection}, ${documentId}) failed`);
				}

				if(TypeUtil.isArray(subCollections)) {  // Load sub collections

					const promises = [];

					subCollections.forEach((subCol) => {

						const subColQuery = `${item.id}/${subCol}`;
						Tracer.log(`loadDocument(${collection}, ${documentId}, SubCollection:(${subColQuery}) )`, this);
						promises.push(this.loadDocuments(subColQuery, null, null, DEFAULT_MAX_RECORD, subCol));
					});
					Promise.all(promises).then((results) => {

						results.forEach((result) => {

							const key = Object.keys(result)[0];
							const val = result[key];
							item[key] = val;
						});
						resolve(item);
					});
				}
				else {
					resolve(item);
				}
			});
		});
	}
	loadDocuments(collection, orderByColumn = null, orderDirection = 'desc', maxRecord = DEFAULT_MAX_RECORD, nameResult = null) {

		Tracer.log(`loadDocuments(${collection}, ${orderByColumn}, ${orderDirection}, ${maxRecord})`, this);

		return new Promise((resolve, reject) => {

			const dbToDoItems = this.getCollection(collection);
			let query = null;
			if(orderByColumn)
				query = dbToDoItems.orderBy(orderByColumn, orderDirection).limit(maxRecord);
			else				
				query = dbToDoItems.limit(maxRecord);

			query.get().then(todoItems => {

				const items = this.__rebuildDocuments(todoItems)
				Tracer.log(`loadDocuments(${items.length} records loaded)`, this);
				if(nameResult) {
					resolve( { [nameResult]:items } );
				}
				else {
					resolve(items);
				}	
			});
		});
	}
	// https://firebase.google.com/docs/database/web/read-and-write
	updateRecord(collection, oData, idFieldName = DEFAULT_ID_FIELD_NAME, overWriteDoc = true) {
		
		// Update property updateAt if exist
		if(oData[UPDATE_AT_PROPERTY_NAME])
			oData[UPDATE_AT_PROPERTY_NAME] = this.now();

		// Duplicate the object for now, trying to removed and add the
		// id property created some problems
		const data = Object.assign({}, oData);
		const longId = data[idFieldName];
		const idStringForTracing = `${idFieldName}:${longId}`;
		Tracer.log(`updateRecord ${idStringForTracing}`, this);				
		const id = this.extractId(longId);
		// The id property is stored twice as the document key and as the property id
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

		// The id property is stored twice as the document key and as the property id
		let id = data[idFieldName];
		if(!id) {
			id = ComponentUtil.getNewUniqueId();
		}
			
		if(this.batchModeOn) {

			this.getCollection(collection).doc(id).set(data);			
		}
		else { 

			return new Promise((resolve, reject) => {
				
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

		return TypeUtil.formatFirebaseTimestamp(timestamp, format);
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