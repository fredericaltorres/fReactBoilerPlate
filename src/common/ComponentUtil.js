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

		ComponentUtil.forceRefresh(reactComponent, { isLoading: state });
	}
	static executeAsBusy(reactComponent, func) {
		
		if(!TypeUtil.isFunction(func))
			TypeUtil.throwInvalidParameterType('func', 'function');

		ComponentUtil.setIsLoading(reactComponent, true);
		func().then(() => {
			ComponentUtil.setIsLoading(reactComponent, false);
		});
	}
}

export default ComponentUtil;
