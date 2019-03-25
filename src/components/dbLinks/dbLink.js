import PropTypes from "prop-types";
import firestoreManager from '../../common/FirestoreManager';
import ComponentUtil from '../../common/ComponentUtil';
import { FIRESTORE_TIMESTAMP } from '../../common/TypeUtil';
import Tracer from '../../common/Tracer';
import { FireStoreDocumentBaseClass}  from '../../common/FireStoreDocumentBaseClass';

const typeDefDBObjectName = 'DBLink';

const TypeDef = {

	__name: 		  typeDefDBObjectName,
	__collectionName: typeDefDBObjectName+'s',

	id:				  'String',
	link:			  'String',
	description:	  'String',
	order:			  'Number',
	files:			  'Object',
	createdAt: 		  FIRESTORE_TIMESTAMP,
	updatedAt: 		  FIRESTORE_TIMESTAMP,
};

// This class allow to add, update, delete document of the type definition DBLink.
export class DBLink extends FireStoreDocumentBaseClass {

	constructor() {

		super(TypeDef);
		this.name = typeDefDBObjectName;
		Tracer.log(`constructor`, this);
	}
	create(link, description, order) {
		const doc = {
			id: ComponentUtil.getNewUniqueId(), // Do not prefix the id with the name of the collection, firebase does not like it
			link,
			description,
			order,
			files:{},
			createdAt: firestoreManager.now(),
			updatedAt: firestoreManager.now(),
		};
		return doc;
	}	
	shape() {
		return PropTypes.shape({
			id: PropTypes.string.isRequired,
			link: PropTypes.string.isRequired,
			description: PropTypes.string.isRequired,
			files: PropTypes.object.isRequired,
			createdAt: PropTypes.object.isRequired, // FIRESTORE_TIMESTAMP
			updatedAt: PropTypes.object.isRequired, // FIRESTORE_TIMESTAMP
		});
	}
	getMaxOrder = (dbLinks) => {

		let maxOrder = 0;
		dbLinks.forEach((todo) => {
			if(todo.order > maxOrder)
				maxOrder = todo.order;
		});
		const r = maxOrder + 1;
		return r;
	}	
	deleteFile = (dbLink, fileName) => {

		return new Promise((resolve, reject) => {

			firestoreManager.deleteFileFromStorage(fileName, dbLink.id)
				.then(() => {
					delete dbLink.files[fileName];					
					this.update(dbLink)
						.then(() => { resolve(); })
						.catch((err) => { reject(err); });
				})
				.catch((err) => { reject(err); });
		});
	}
};
export default new DBLink();
