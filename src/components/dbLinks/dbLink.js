import firestoreManager from '../../common/FirestoreManager';
import ComponentUtil from '../../common/ComponentUtil';
import { FIRESTORE_TIMESTAMP } from '../../common/TypeUtil';
import Tracer from '../../common/Tracer';
import { FireStoreDocumentBaseClass}  from '../../common/FireStoreDocumentBaseClass';

// ToDo Type Definition
export const TypeDef = {

	__name: 		'DBLink',
	__collectionName:'DBLinks',

	id:				'String',
	link:			'String',
	description:	'String',
	createdAt: 		FIRESTORE_TIMESTAMP,
	updatedAt: 		FIRESTORE_TIMESTAMP,
}

// This class allow to add, update, delete document of the type definition ToDo.
// This class or the instance of this class is not the document created, updated or deleted. 
export class DBLink extends FireStoreDocumentBaseClass {

	constructor() {

		super(TypeDef);
		this.name = 'DBLink';
		Tracer.log(`constructor`, this);
	}
	create(link, description) {

		const doc = {
			id: ComponentUtil.getNewUniqueId(), // Do not prefix the id with the name of the collection, firebase does not like it
			link,
			description,
			createdAt: firestoreManager.now(),
			updatedAt: firestoreManager.now(),
		};
		return doc;
	}	
};
export default new DBLink();