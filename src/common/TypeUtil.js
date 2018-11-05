import Tracer from './Tracer';

export const FIRESTORE_TIMESTAMP = 'Firestore.Timestamp';

class TypeUtil {
	
	getType (v) {

		var type;
		if (v === null)
			return "null";
		if (typeof v === 'undefined')
			return "undefined";

		type = Object.prototype.toString.call(v);
		type = type.replace("[object ", "");
		type = type.replace("]", "");
		return type;
	}

    isFunction(v) { return this.getType(v) === "Function";  }
    isString  (v) { return this.getType(v) === "String";    }
    isBoolean (v) { return this.getType(v) === "Boolean";   }
    isNumber  (v) { return this.getType(v) === "Number";    }
    isDate    (v) { return this.getType(v) === "Date";      }
    isArray   (v) { return this.getType(v) === "Array";     }
    isObject  (v) { return this.getType(v) === "Object";    }
	isRegExp  (v) { return this.getType(v) === "RegExp";    }
	isPromise (v) { return !!(v.then) }

    isInteger (x) {

        if(this.isNumber(x)) {
            var y = parseInt(x);
            if (isNaN(y)) return false;
            return x===y && x.toString()==y.toString();
        }
	}	
	throwInvalidParameterType (parameterName, parameterValue, expectedType) {
		if(this.getType(parameterValue)!==expectedType)
			Tracer.throw(Error(`Parameter:${parameterName} must be of type:${expectedType}`));
	}

/// TypeDef methods

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
			const actualType = this.getType(actualValue);

			if(expectedType === FIRESTORE_TIMESTAMP) {

				if(!(this.isNumber(actualValue.nanoseconds) && this.isNumber(actualValue.seconds))) {
					//nanoseconds: 661000000, seconds: 1541389535
					const errMsg = `TypeUtil.verifyType error on property:${property}, expectedType:${expectedType}, actualType:${actualType}`;
					r = false;
					if(throwEx) Tracer.throwEx(errMsg);
				}				
			}
			else {

				if(expectedType !== actualType) {
					const errMsg = `TypeUtil.verifyType error on property:${property}, expectedType:${expectedType}, actualType:${actualType}`;
					r = false;
					if(throwEx) Tracer.throwEx(errMsg);
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
}

export default new TypeUtil();
