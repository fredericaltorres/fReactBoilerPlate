import firestoreManager from '../common/FirestoreManager';
import ComponentUtil from '../common/ComponentUtil';
import Tracer from '../common/Tracer';

export const TODO_ITEMS_COLLECTION_NAME = 'todoItems';

export class ToDo {

	static create(description, order) {

		Tracer.throwIfUndefined(order, `order from ToDo.create`);
		return {
			description, 
			isCompleted: false, 
			createdAt: firestoreManager.now(),
			order,
		}
	}	
	static createFromProps(props, otherProps) {

		const todo = {
			id : props.id,
			description: props.description,
			createdAt: props.createdAt,
			isCompleted : props.isCompleted,
			order: props.order,
			...otherProps
		};
		return todo;
	}
	// If executed in non batch mode return a promise
	static update = (todo) => {
	
		return firestoreManager.updateRecord(TODO_ITEMS_COLLECTION_NAME, todo);
	}
	// If executed in non batch mode return a promise
	static add = (todo) => {

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