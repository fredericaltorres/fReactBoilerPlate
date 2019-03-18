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
	shape() {
		return PropTypes.shape({
			id: PropTypes.string.isRequired,
			link: PropTypes.string.isRequired,
			description: PropTypes.string.isRequired,
			createdAt: PropTypes.object.isRequired, // FIRESTORE_TIMESTAMP
			updatedAt: PropTypes.object.isRequired, // FIRESTORE_TIMESTAMP
		});
	}
};
export default new DBLink();
