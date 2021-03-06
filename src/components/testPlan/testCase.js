import firestoreManager from '../../common/FirestoreManager';
import ComponentUtil from '../../common/ComponentUtil';
import TypeUtil from '../../common/TypeUtil';
import { FIRESTORE_TIMESTAMP } from '../../common/TypeUtil';
import Tracer from '../../common/Tracer';
import { FireStoreDocumentBaseClass}  from '../../common/FireStoreDocumentBaseClass';

// TestPlan Type Definition
const TypeDef = {

	__name: 			'TestCase',
	__collectionName:	'', // stored in parent object

	id:					'String',
	name:				'String',
	description:		'String',
	createdAt:			FIRESTORE_TIMESTAMP,
	updatedAt:			FIRESTORE_TIMESTAMP,
}

// This class allow to add, update, delete document of the type definition ToDo.
export class TestCase extends FireStoreDocumentBaseClass {

	constructor() {

		super(TypeDef);
		this.name = 'TestCase';
		Tracer.log(`constructor`, this);
	}
	create(name, description) {

		const id = ComponentUtil.getNewUniqueId(); // Do not prefix the id with the name of the collection, firebase does not like it
		if(name === null)
			name = `Name ${id}`;

		const doc = {
			id,
			name,
			description,
			createdAt: firestoreManager.now(),
			updatedAt: firestoreManager.now(),
		}
		return doc;
	}	
};



// TestPlan Type Definition
const TypeDef = {

	__name: 			'TestPlan',
	__collectionName:	'testPlans',

	id:					'String',
	name:				'String',
	description:		'String',
	author:				'String',
	createdAt:			FIRESTORE_TIMESTAMP,
	updatedAt:			FIRESTORE_TIMESTAMP,
}



export default new TestPlan();