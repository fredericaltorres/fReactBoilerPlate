import React from "react";
import PropTypes from "prop-types";
import tracer from '../common/Tracer';
import Button from './Button';
import firestoreManager from '../common/FirestoreManager';
import ComponentUtil from '../common/ComponentUtil';
import ToDo from './todo';
import TestPlan from './testPlan';
import Tracer from "../common/Tracer";

class TestPlans extends React.PureComponent {

	static propTypes = {

	};
	state = {

		timeStamp: new Date().getTime(),
		editText :'',
		showDate : false,
		mqttNewMessage : null,
		isLoading: true,
		testPlans: [
			// { createdAt:"2018-10-09T19:41:59.272621Z", description:'Description 1', isCompleted: false, id:'1' },
			// { createdAt:"2018-10-09T19:41:59.272621Z", description:'Description 2', isCompleted: false, id:'2' }
		],
		testPlansOrderDirection: 'asc'
	};
	constructor(props) {

		super(props);
		this.name = "TestPlans";
		tracer.log('constructor', this);
	}
	monitorToTestPlansCollection() {

		// Load the testPlans and its steps
		// firestoreManager.loadDocument('testPlans','829378c31320a', ['steps'])
		// 	.then((doc) => {
		// 		alert(JSON.stringify(doc));
		// 	});

		// // Load a specific TestPlan Step
		// firestoreManager.loadDocument('testPlans/829378c31320a/steps','ITFC9eJd8U13AimEkon7')
		// .then((doc) => {
		// 	alert(JSON.stringify(doc));
		// });

		firestoreManager.monitorQuery(
			TestPlan.getCollectionName(),
			(records) => { 
				Tracer.log(`collection ${TestPlan.getCollectionName()} change detected`);
				ComponentUtil.forceRefresh(this, { testPlans: records, isLoading: false } ); 
			}, 
			'createdAt', this.state.testPlansOrderDirection
		);
	}
	stopMonitorToDoItemsCollection() {

		firestoreManager.stopMonitorQuery(ToDo.getCollectionName());
	}
	componentDidMount() {
		
		this.monitorToTestPlansCollection();
	}
	// ___loadToDoItemsFromDatabase = () => {

	googleLogin() {

		firestoreManager.googleLogin();
	}

	// --- Entity operations ---
	
	
	generateData = () => {

		const maxDefaultValue = 4;
		const maxAsString = prompt('How many test plans do you want to create?', maxDefaultValue.toString());
		if(maxAsString === null) 
			return;

		let max = parseInt(maxAsString);
		if(max > maxDefaultValue) {
			max = maxDefaultValue;
			alert(`Cannot create this number of records, max value is ${max}`);
		}

		this.stopMonitorToDoItemsCollection();
		ComponentUtil.executeAsBusy(this,
			() => {
				Tracer.log(`Creating ${max} test plans...`, this);
				const batch = firestoreManager.startBatch();
				for(let i = 0; i < max; i++) {
					let r = Math.random().toString(36).substring(7);
					TestPlan.add(TestPlan.create(`Test plan ${r} . . .`));
				}
				return firestoreManager.commitBatch(batch);
			},
			() => {
				this.monitorToTestPlansCollection();
			}
		);
	}
	
	// --- Jsx Generation ---

	getMainButtonsJsx = (isLoading, render = true) => {

		if(!render) return null;

		const message = isLoading ? "Busy . . . " : "Ready . . . ";
		let className = isLoading ? "btn btn-outline-warning" : "btn btn-outline-primary";

		return <div>

			<div className="btn-group btn-group-sm" role="group" aria-label="Basic example">
				<button type="button" className="btn btn-secondary">Add</button>
				<button 
					disabled={this.props.isLoading} 
					onClick={this.generateData} 
					type="button" className="btn btn-secondary">Generate
				</button>
			</div>
		</div>;
	}

	deleteTestPlan(id) {
		// No need to execute any syncronisation after the delete
		// since we monitor the testPlans collection
		TestPlan.delete(id);
	}

	renderTestPlanItemToJsx = (testPlan) => {
		
		return <li className="list-group-item" key={testPlan.id}>
			
			<div className="card">
				<div className="card-body">
					<h4 className="card-title">
						{testPlan.name}
					</h4>
					<p className="card-text">
						{testPlan.description}
					</p>
					<div className="btn-group btn-group-sm" role="group" aria-label="Basic example">
						<button type="button" className="btn btn-secondary">Edit</button>
						<button type="button" className="btn btn-secondary">Execute</button>
						<button 
							onClick={() => { this.deleteTestPlan(`${testPlan.id}`); }} 
							type="button" className="btn btn-secondary">Delete
						</button>
					</div>
				</div>
			</div>
		</li>;
	}
	renderTestPlanItemsToJsx = (testPlans) => {

		if(testPlans.length == 0) 
			return <div>No Test Plans</div>;
			
		return testPlans.map((testPlan) => {
			return this.renderTestPlanItemToJsx(testPlan);
		});
	}    

	// --- Misc Events ---
	
	render() {

		Tracer.log(`render isLoading:${this.state.isLoading} ${this.state.testPlans.length} test plans`, this);
		const statusMessage = this.state.isLoading ? "Busy... " : `${this.state.testPlans.length} test plans. Ready...`;
		let statusClassName = this.state.isLoading ? "alert alert-warning" : "alert alert-success";

		return (
			<div>
				<h2>Test Plans</h2>

				{this.getMainButtonsJsx(this.state.isLoading, true)}

				<div style={{ marginTop:'3px', padding:'0px'}} className={statusClassName} role="alert">
					{statusMessage}
				</div>
				
				<ul className="list-group" style={{marginTop:'5px'}}>
					{this.renderTestPlanItemsToJsx(this.state.testPlans)}
				</ul>

				<small>
					Logged on user: {firestoreManager.getCurrentUser() ? firestoreManager.getCurrentUser().displayName: 'None'}<br/>
					Try	the app from 2 different browsers.<br/>
					<a target="top" href="https://github.com/fredericaltorres/fReactBoilerPlate">Source Code</a>
				</small>
			</div>
		); 
	}
}
export default TestPlans;
