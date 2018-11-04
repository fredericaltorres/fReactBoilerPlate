import firestoreManager from '../common/FirestoreManager';
import ComponentUtil from '../common/ComponentUtil';
import TypeUtil from '../common/TypeUtil';
import Tracer from '../common/Tracer';

export const TODO_ITEMS_COLLECTION_NAME = 'todoItems';

const ToDoTypeDef = {

	__name: 'ToDo',

	description:	'String', 
	isCompleted: 	'Boolean', 
	createdAt: 		'Object',
	order: 			'Number',
}

export class ToDo {

	static create(description, order) {

		const todo = {
			description, 
			isCompleted: false,
			createdAt: firestoreManager.now(),
			order,
		}
		TypeUtil.verifyType(ToDoTypeDef, todo);
		return todo;
	}	
	static createFromProps(props, otherProps) {

		const todo = {
			id 			: props.id,
			description	: props.description,
			createdAt	: props.createdAt,
			isCompleted : props.isCompleted,
			order		: props.order,
			...otherProps
		};
		TypeUtil.verifyType(ToDoTypeDef, todo);
		return todo;
	}
	// If executed in non batch mode return a promise
	static update = (todo) => {
	
		TypeUtil.verifyType(ToDoTypeDef, todo);
		return firestoreManager.updateRecord(TODO_ITEMS_COLLECTION_NAME, todo);
	}
	// If executed in non batch mode return a promise
	static add = (todo) => {

		TypeUtil.verifyType(ToDoTypeDef, todo, true);
		return firestoreManager.addRecord(TODO_ITEMS_COLLECTION_NAME, todo);
	}
	// If executed in non batch mode return a promise
	static delete = (id) => {

		return firestoreManager.deleteRecord(TODO_ITEMS_COLLECTION_NAME, id);
	}	
	static getMaxOrder = (todoItems) => {

		let maxOrder = 0;
		todoItems.forEach((todo) => {
			if(todo.order > maxOrder)
				maxOrder = todo.order;
		});
		return maxOrder;
	}
}
export default ToDo;