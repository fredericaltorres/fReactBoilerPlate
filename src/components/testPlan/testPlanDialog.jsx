import React from "react";
import PropTypes from "prop-types";
import tracer from '../../common/Tracer';
import TypeUtil from '../../common/TypeUtil';
import TypeDefUtil from '../../common/TypeDefUtil';
import ComponentUtil from '../../common/ComponentUtil';
import firestoreManager from '../../common/FirestoreManager';

import TestPlan from './testPlan';
import Tracer from "../../common/Tracer";

class testPlanDialog extends React.PureComponent {

	static propTypes = {
		// testPlan : PropTypes.object.isRequired
	};
	state = {

		timeStamp: new Date().getTime(),
		isLoading: false,
		testPlan: null,
	};
	constructor(props) {

		super(props);
		this.name = "testPlanDialog";
		tracer.log('constructor', this);
	}	
	componentDidMount() {
		// Load the testPlans and its steps		
		const testPlanId = "08673fdfced26";
		Tracer.log(`Loading test plan id:${testPlanId}`);
		firestoreManager.loadDocument(TestPlan.getCollectionName(), testPlanId)
			.then((testPlan) => {
				Tracer.log(`Edit TestPlan:${JSON.stringify(testPlan)}`);
				ComponentUtil.forceRefresh(this, { testPlan })
			});
	}	
	render() {
		const testPlan = this.state.testPlan;
		if(testPlan === null)
			return <div>Loading...</div>;

		Tracer.log(`render name:'${testPlan.name}'`, this);

		return (
			<div id={testPlan.id}>
				<h2>Test Plan</h2>
				Name: {testPlan.name}
				{
					TypeDefUtil.renderEditControlsJsx(TestPlan._typeDef, testPlan)
				}
			</div>
		);
	}
}
export default testPlanDialog;
