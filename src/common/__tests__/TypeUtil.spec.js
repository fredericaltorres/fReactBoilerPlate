import TypeUtil from '../TypeUtil';
import TypeDefUtil from '../TypeDefUtil';
import { FIRESTORE_TIMESTAMP } from '../TypeUtil';

describe('TypeUtil', () => {

	it('getType', () => {

		expect(TypeUtil.getType("aaa")).toEqual('String');
		expect(TypeUtil.getType(1)).toEqual('Number');
		expect(TypeUtil.getType(true)).toEqual('Boolean');
		expect(TypeUtil.getType(false)).toEqual('Boolean');
		expect(TypeUtil.getType([])).toEqual('Array');
		expect(TypeUtil.getType(new Date())).toEqual('Date');
		expect(TypeUtil.getType(/a/)).toEqual('RegExp');
		expect(TypeUtil.getType(() => {})).toEqual('Function');
		expect(TypeUtil.getType(null)).toEqual('null');
		expect(TypeUtil.getType(undefined)).toEqual('undefined');
		expect(TypeUtil.getType({})).toEqual('Object');
	});

	[
		{ 
			typeDef : { 
				__name:'name',
				__collectionName:'collectionName',
				n:'Number', s:'String', b:'Boolean', o:'Object', nu:'null', date:'Date', array:'Array', func:'Function'
			 }, 
		  	actualObj : { n:1, s:'s', b:true, o:{}, nu:null, date:new Date(), array:[], func:() => {} } 
		},
		{ 
			typeDef : { 
				__name:'name',
				__collectionName:'collectionName',
				 createdAt: FIRESTORE_TIMESTAMP,
			 }, 
			 actualObj : { createdAt: { nanoseconds: 661000000, seconds: 1541389535 }
		} 
		}
	].forEach(
		({typeDef, actualObj}) => {
			it(`verifyType typeDef:${JSON.stringify(typeDef)}`, () => {
				expect(TypeDefUtil.verifyType(typeDef, actualObj, false)).toBe(true);
			});
		}
	);
	
	it('Is XXXXXX', () => {

		expect(TypeUtil.isString("aaa")).toBe(true);

		expect(TypeUtil.isNumber(1)).toBe(true);
		expect(TypeUtil.isNumber(1.0)).toBe(true);
		expect(TypeUtil.isNumber(NaN)).toBe(true);

		expect(TypeUtil.isInteger(1)).toBe(true);
		expect(!TypeUtil.isInteger(1.1)).toBe(true);
		expect(!TypeUtil.isInteger(NaN)).toBe(true);

		expect(TypeUtil.isBoolean(true)).toBe(true);
		expect(TypeUtil.isBoolean(false)).toBe(true);
		expect(TypeUtil.isArray([])).toBe(true);
		expect(TypeUtil.isDate(new Date())).toBe(true);
		expect(TypeUtil.isRegExp(/a/)).toBe(true);
		expect(TypeUtil.isFunction(() => {})).toBe(true);
		expect(TypeUtil.isObject({})).toBe(true);

		expect(TypeUtil.isPromise({})).toBe(false);
		const p = new Promise((resolve, reject) => {
		});
		expect(TypeUtil.isPromise(p)).toBe(true);
	});
});
