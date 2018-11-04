import React from "react";
import TypeUtil from './TypeUtil';

export const ESCAPE_KEY = 27;
export const ENTER_KEY  = 13;

class ComponentUtil  {

	static forceRefresh (reactComponent, statePropertiesToUpdate) {

		const state = reactComponent.state;
		const timeStamp = new Date().getTime();
		let newState = null;
		if(statePropertiesToUpdate) 
			newState = { ...state, ...statePropertiesToUpdate, timeStamp }
		else
			newState = { ...state, timeStamp }
			reactComponent.setState(newState);
	}
	static setIsLoading(reactComponent, state) {
		console.log(`setIsLoading : ${state}`);
		ComponentUtil.forceRefresh(reactComponent, { isLoading: state });
	}
	// static executeAsBusy__(reactComponent, func) {
		
	// 	if(!TypeUtil.isFunction(func))
	// 		TypeUtil.throwInvalidParameterType('func', 'function');

	// 	const isAlreadyLoading = reactComponent.state.isLoading;

	// 	if(!isAlreadyLoading)
	// 		ComponentUtil.setIsLoading(reactComponent, true);

	// 	const r = func();
	// 	if(r && r.then) { // If it is a Promise
	// 		return r.then(() => {
	// 			if(!isAlreadyLoading)
	// 				ComponentUtil.setIsLoading(reactComponent, false);
	// 		});
	// 	}
	// 	else {
	// 		if(!isAlreadyLoading)
	// 			ComponentUtil.setIsLoading(reactComponent, false);
	// 	}
	// }
	static executeAsBusy(reactComponent, func, onDoneFunc = null) {
		
		if(!TypeUtil.isFunction(func))
			TypeUtil.throwInvalidParameterType('func', 'function');

		const isAlreadyLoading = reactComponent.state.isLoading;
		ComponentUtil.setIsLoading(reactComponent, true);

		return new Promise((resolve, reject) => {

			// setTimeout(() => {
				const r = func();
				if(r && TypeUtil.isPromise(r)) {
					return r.then(() => {
						ComponentUtil.setIsLoading(reactComponent, false);
						if(onDoneFunc) {
							onDoneFunc();
						}
						resolve();
					});
				} 
				else {
					ComponentUtil.setIsLoading(reactComponent, false);
				}
				resolve();
			// }, 100);
		});
	}	
	static getNewUniqueId() {
		
		return Math.random().toString(16).substr(2, 16);
	}
}

export default ComponentUtil;
