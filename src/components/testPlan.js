import firestoreManager from '../common/FirestoreManager';
import ComponentUtil from '../common/ComponentUtil';
import TypeUtil from '../common/TypeUtil';
import { FIRESTORE_TIMESTAMP } from '../common/TypeUtil';
import Tracer from '../common/Tracer';
import { FireStoreDocumentBaseClass}  from '../common/FireStoreDocumentBaseClass';

// TestPlan Type Definition
export const TypeDef = {

	__name: 		'TestPlan',
	__collectionName:'testPlans',

	id:				'String',
	name:			'String',
	description:	'String',
	author:			'String',
	createdAt: 		FIRESTORE_TIMESTAMP,
	updatedAt: 		FIRESTORE_TIMESTAMP,
}

// This class allow to add, update, delete document of the type definition ToDo.
// This class or the instance of this class is not the document created, updated or deleted. 
export class TestPlan extends FireStoreDocumentBaseClass {

	constructor() {

		super(TypeDef);
		this.name = 'TestPlan';
		Tracer.log(`constructor`, this);
	}
	create(name, description, author) {

		const id = ComponentUtil.getNewUniqueId(); // Do not prefix the id with the name of the collection, firebase does not like it
		if(name === null)
			name = `Name ${id}`;

		const doc = {
			id,
			name,
			description,
			author,
			createdAt: firestoreManager.now(),
			updatedAt: firestoreManager.now(),
		}
		return doc;
	}	
};
export default new TestPlan();