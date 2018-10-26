import Tracer from './Tracer';
import moment from "moment"; // http://momentjs.com/
import { runInNewContext } from 'vm';

const firestoreManagerConfig = {

	apiKey: "AIzaSyDZwgZ8wGSbfstXLuvr9iROHTL5YUVzJ34",
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
			Tracer.log('FirestoreManager init', this);
			firebase.initializeApp(firestoreManagerConfig);
			FirestoreManager._initialized = true;
		}
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
					Tracer.error(`updateRecord ${idFieldName}:${longId} failed ${error}`);
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
					Tracer.error(`deleteRecord  id:${id} failed ${error}`);
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
					Tracer.error(`addRecord ${idFieldName}:${id} failed ${error}`);
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