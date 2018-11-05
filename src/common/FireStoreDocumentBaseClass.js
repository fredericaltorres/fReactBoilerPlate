import firestoreManager from '../common/FirestoreManager';
import ComponentUtil from '../common/ComponentUtil';
import TypeUtil from '../common/TypeUtil';
import Tracer from '../common/Tracer';

//////////////////////////////////////////////////////////
/// FireStoreDocumentBaseClass
/// Base class for Firestore document
export class FireStoreDocumentBaseClass {

	constructor(typeDef) {

		this._typeDef = typeDef;
	}
	getCollectionName() {

		return this._typeDef.__collectionName;
	};
	// Verify that the document doc match the type definition
	verify(doc) {

		TypeUtil.verifyType(this._typeDef, doc);
	}
	createFromProps(props, otherProps) {

		const doc = TypeUtil.createFromProps(this._typeDef, props, otherProps);
		return doc;
	}
	// If executed in non batch mode return a promise
	update = (doc) => {

		this.verify(doc);
		return firestoreManager.updateRecord(this._typeDef.__collectionName, doc);
	}
	// If executed in non batch mode return a promise
	add = (doc) => {

		this.verify(doc);
		return firestoreManager.addRecord(this._typeDef.__collectionName, doc);
	}
	// If executed in non batch mode return a promise
	delete = (id) => {

		return firestoreManager.deleteRecord(this._typeDef.__collectionName, id);
	}		
};


