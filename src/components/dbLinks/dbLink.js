import PropTypes from "prop-types";
import firestoreManager from '../../common/FirestoreManager';
import ComponentUtil from '../../common/ComponentUtil';
import { FIRESTORE_TIMESTAMP } from '../../common/TypeUtil';
import Tracer from '../../common/Tracer';
import { FireStoreDocumentBaseClass, FireStorePropertyTypeDefBaseClass }  from '../../common/FireStoreDocumentBaseClass';

const typeDefDBObjectName = 'DBLink';

class CategoryPropertyTypeDef extends FireStorePropertyTypeDefBaseClass {

	constructor() {
		super();
		this.__type = 'String';
		this.__values = ['Hardware', 'Software', 'Other'];
	}
};

export const TypeDef = {

	__name: 		  typeDefDBObjectName,
	__collectionName: typeDefDBObjectName+'s',

	id:				  'String',
	link:			  'String',
	description:	  'String',
	category:	  	  new CategoryPropertyTypeDef(),
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
			category: TypeDef.category.getDefault(),
			files: {},
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
	loadFilesMetaData = (dbLink) => {

		return new Promise((resolve, reject) => {

			const promises = [];
			const files = Object.keys(dbLink.files);
			files.forEach((fileName) => {
				promises.push(firestoreManager.GetFileMetaDataFromStorage(fileName, dbLink.id));
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
