import React from "react";

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
