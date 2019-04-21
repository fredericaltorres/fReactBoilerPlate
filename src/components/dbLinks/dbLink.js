import PropTypes from "prop-types";
import firestoreManager from '../../common/FirestoreManager';
import ComponentUtil from '../../common/ComponentUtil';
import { FIRESTORE_TIMESTAMP } from '../../common/TypeUtil';
import Tracer from '../../common/Tracer';
import { FireStoreDocumentBaseClass, FireStorePropertyTypeDefBaseClass }  from '../../common/FireStoreDocumentBaseClass';

// Name of the db entity
const typeDefDBObjectName = 'DBLink';

// Define a the property category as a enum type string
class CategoryPropertyTypeDef extends FireStorePropertyTypeDefBaseClass {

	constructor() {
		super();
		this.__type = 'String';
		this.__values = ['Hardware', 'Software', 'Other'];
	}
};

// Define the DBLink type definition
export const TypeDef = {

	__name: 		  typeDefDBObjectName, // The name of the type definition entity
	__collectionName: typeDefDBObjectName + 's', // The Firebase collection name to use to store the instances

	id:	'String',
	link: 'String',
	description: 'String',
	category: new CategoryPropertyTypeDef(),
	order: 'Number',
	files: 'Object',
	createdAt: FIRESTORE_TIMESTAMP,
	updatedAt: FIRESTORE_TIMESTAMP,
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
			category: TypeDef.category.getDefault(),
			files: {},
			createdAt: firestoreManager.now(),
			updatedAt: firestoreManager.now(),
		};
		return doc;
	}
	// return the react propType definition of a DBLink instance
	shape() {

		return PropTypes.shape({
			id: PropTypes.string.isRequired,
			link: PropTypes.string.isRequired,
			description: PropTypes.string.isRequired,
			category: PropTypes.string.isRequired,
			files: PropTypes.object.isRequired,
			createdAt: PropTypes.object.isRequired, // FIRESTORE_TIMESTAMP
			updatedAt: PropTypes.object.isRequired, // FIRESTORE_TIMESTAMP
		});
	}
	// Return the new order number to use for the next dbLink creation
	// Note the property order is not used yet. dbLink instance are loaded based on the createAt
	// property
	getMaxOrder = (dbLinks) => {

		let maxOrder = 0;
		dbLinks.forEach((todo) => {
			if(todo.order > maxOrder)
				maxOrder = todo.order;
		});
		const r = maxOrder + 1;
		return r;
	}	
	// delete one file associated with the dbLink
	deleteFile = (dbLink, fileName, updateDbLinkInstance = true) => {

		return new Promise((resolve, reject) => {

			firestoreManager.deleteFileFromStorage(fileName, dbLink.id)
				.then(() => {
					if(updateDbLinkInstance) {
						delete dbLink.files[fileName];					
						this.update(dbLink)
							.then(() => { resolve(); })
							.catch((err) => { reject(err); });
					}
					else resolve();
				})
				.catch((err) => { reject(err); });
		});
	}
	// Delete all the file associated with the dbLink instance and then delete the dbLink instance
	deleteWithFiles = (dbLink) => {

		Tracer.log(`deleteWithFiles ${dbLink.id}`, this);

		return new Promise((resolve, reject) => {

			const promises = [];
			Object.keys(dbLink.files).forEach((fileName) => {
				promises.push(this.deleteFile(dbLink, fileName, false));
			});			
			Promise.all(promises) // First delete all the files and wait for it
				.then(() => {
					this.delete(dbLink.id).then(() => { // Then delete the db link instance
						resolve();
					})
					.catch(() => { reject(); });					
				})
				.catch(() => { reject(); });
		});
	}
	// Load all the file metadatas associated with the dbLink instance
	loadFilesMetaData = (dbLink) => {

		return new Promise((resolve, reject) => {

			const promises = [];
			const files = Object.keys(dbLink.files);

			files.forEach((fileName) => {

				promises.push(firestoreManager.getFileMetaDataFromStorage(fileName, dbLink.id));
			});
			Promise.all(promises)
				.then((fileMetadatas) => {

					const fileMap = {};
					fileMetadatas.forEach((fileMetadata) => {
						if(fileMap[dbLink.id] === undefined) fileMap[dbLink.id] = {};
						fileMap[dbLink.id][fileMetadata.name] = fileMetadata;
					});
					resolve(fileMap);
				})
				.catch((err) => {

					reject(err);
				});
		});
	}
};

export default new DBLink();
