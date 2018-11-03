import firestoreManager from '../common/FirestoreManager';
import ComponentUtil from '../common/ComponentUtil';

export class ToDo {
	static create(description) {
		return { description, isCompleted: false, createdAt: firestoreManager.now() }
	}	
}
export default ToDo;