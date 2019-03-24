import React from "react";
import Tracer from './Tracer';
import moment from "moment"; // http://momentjs.com/
import TypeUtil from '../common/TypeUtil';
import {FIRESTORE_TIMESTAMP} from '../common/TypeUtil';

class TypeDefUtil {
	
	getTypeDefProperties(typeDef) {

		const properties = Object.keys(typeDef).filter(
			(property) => {
				return !property.startsWith("__");
			}			
		);
		return properties;
	}
	// Verify that the type definition contains allthe required meta data properties
	verifyTypeDef(typeDef) {

		if(!typeDef.__name) Tracer.throw(Error(`property __name in typeDef missing`));
		if(!typeDef.__collectionName) Tracer.throw(Error(`property __collectionName in typeDef ${typeDef.__name} missing`));
	}
	// Verify that document doc match the type definition
	verifyType(typeDef, doc, throwEx = true) {

		this.verifyTypeDef(typeDef);
		Tracer.log(`verifyType ${typeDef.__name}`);
		let r = true;
		this.getTypeDefProperties(typeDef).forEach((property) => {

			const expectedType = typeDef[property];
			const actualValue = doc[property];
			const actualType = TypeUtil.getType(actualValue);

			if(expectedType === FIRESTORE_TIMESTAMP) {

				if(!(TypeUtil.isNumber(actualValue.nanoseconds) && TypeUtil.isNumber(actualValue.seconds))) {
					//nanoseconds: 661000000, seconds: 1541389535
					const errMsg = `TypeUtil.verifyType error on property:${property}, expectedType:${expectedType}, actualType:${actualType}`;
					r = false;
					if(throwEx) Tracer.throw(errMsg);
				}				
			}
			else {

				if(expectedType !== actualType) {
					const errMsg = `TypeUtil.verifyType error on property:${property}, expectedType:${expectedType}, actualType:${actualType}`;
					r = false;
					if(throwEx) Tracer.throw(errMsg);
				}
			}
		});
		return r;
	}
	createFromProps(typeDef, props, otherProps) {

		let newDoc = {};
		// get the list of property from the typeDef and copy the name/value
		// from the props into a new document. Then add otherProps
		this.getTypeDefProperties(typeDef).forEach((property) => {

			const actualValue = props[property];
			newDoc[property] = actualValue;
		});
		newDoc = { ...newDoc, ...otherProps};
		return newDoc;
	}
	// https://firebase.google.com/docs/reference/js/firebase.firestore.Timestamp
	formatFirebaseTimestamp(timestamp, format = 'YYYY/MM/DD h:mm:ss a') {

		const m = moment(timestamp.toDate());
		const s = m.format(format);
		return s;
	}
	renderEditControlsJsx(typeDef, entity) {

		const l = [];
		this.getTypeDefProperties(typeDef).forEach((property, index) => {
			
			let v = entity[property];
			const expectedType = typeDef[property];
			if(expectedType === FIRESTORE_TIMESTAMP) {
				v = this.formatFirebaseTimestamp(v);
			}
			l.push(
				<div key={`key_${property}`}>
					{property} : {v} <br/>
				</div>
			);
		});
		return l;
	}
}

export default new TypeDefUtil();
