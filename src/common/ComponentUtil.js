import React from "react";

export const ESCAPE_KEY = 27;
export const ENTER_KEY  = 13;

class ComponentUtil  {

	static forceRefresh (reactComponent, otherState) {

		const state = reactComponent.state;
		const timeStamp = new Date().getTime();
		let newState = null;
		if(otherState) 
			newState = { ...state, ...otherState, timeStamp }
		else
			newState = { ...state, timeStamp }
			reactComponent.setState(newState);
	}
	static setIsLoading(reactComponent, state) {

		ComponentUtil.forceRefresh(reactComponent, { isLoading: state });
	}

}

export default ComponentUtil;
