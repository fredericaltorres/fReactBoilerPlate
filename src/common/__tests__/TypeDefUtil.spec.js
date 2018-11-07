import TypeUtil from '../TypeUtil';
import TypeDefUtil from '../TypeDefUtil';
import { FIRESTORE_TIMESTAMP } from '../TypeUtil';

describe('TypeDefUtil', () => {
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
	
	
});
