import firestoreManager from '../../common/FirestoreManager';
import ComponentUtil from '../../common/ComponentUtil';
import { FIRESTORE_TIMESTAMP } from '../../common/TypeUtil';
import Tracer from '../../common/Tracer';
import { FireStoreDocumentBaseClass}  from '../../common/FireStoreDocumentBaseClass';

// ToDo Type Definition
const TypeDef = {

	__name: 		'ToDo',
	__collectionName:'todoItems',

	id:				'String',
	description:	'String',
	isCompleted: 	'Boolean',
	createdAt: 		FIRESTORE_TIMESTAMP,
	updatedAt: 		FIRESTORE_TIMESTAMP,
	order: 			'Number',
}

// This class allow to add, update, delete document of the type definition ToDo.
export class ToDo extends FireStoreDocumentBaseClass {

	constructor() {

		super(TypeDef);
		this.name = 'ToDo';
		Tracer.log(`constructor`, this);
	}
	create(description, order) {

		const doc = {
			id: ComponentUtil.getNewUniqueId(), // Do not prefix the id with the name of the collection, firebase does not like it
			description,
			isCompleted: false,
			createdAt: firestoreManager.now(),
			updatedAt: firestoreManager.now(),
			order,
		};
		return doc;
	}	

	getMaxOrder = (todoItems) => {

		let maxOrder = 0;
		todoItems.forEach((todo) => {
			if(todo.order > maxOrder)
				maxOrder = todo.order;
		});
		return maxOrder;
	}
};
export default new ToDo();