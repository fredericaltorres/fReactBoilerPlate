import React from "react";
import PropTypes from "prop-types";
import tracer from '../../common/Tracer';
import Button from '../Button';
import Checkbox from '../Checkbox';
import firestoreManager from '../../common/FirestoreManager';
import ComponentUtil from '../../common/ComponentUtil';
import DBLink from './dbLink';
import Tracer from "../../common/Tracer";
import DBLinkComponent from './DBLinkComponent';

const googleFredUID = "105884141315293539957";

class DBLinksComponent extends React.PureComponent {

	static propTypes = {

	};

	state = {

		timeStamp: new Date().getTime(),
		editText :'',
		isLoading: true,
		DBLinks: [],
	};

	constructor(props) {

		super(props);
		this.name = "DBLinksComponent";
		tracer.log('constructor', this);
	}

	googleLogout = () => {

		firestoreManager.logOut().then(() => {
			ComponentUtil.forceRefresh(this); 
		});
	}

	googleLogin = () => {

		firestoreManager.googleLogin().then(() => {
			ComponentUtil.forceRefresh(this); 
			const uid = firestoreManager.getCurrentUserUID();
			if(uid && googleFredUID !== uid) {
				alert(`Current user logged in is not allowed as adminisatrator`);
			}
			// if(uid && googleFredUID == uid) {
			// 	alert(`Adminisatrator`);
			// }

		});
	}

	isAuthenticated() {

		const uid = firestoreManager.getCurrentUserUID();
		// if(uid && googleFredUID !== uid) {
		// 	alert(`Current user logged in is not allowed as adminisatrator`);
		// }
		// Tracer.log(`isAuthenticated ${googleFredUID} === ${uid}=> ${googleFredUID === uid}`);
		return googleFredUID == uid;
	}

	monitorDBLinksCollection() {

		firestoreManager.monitorQuery(
			DBLink.getCollectionName(),
			(records) => { 
				Tracer.log(`collection ${DBLink.getCollectionName()} change detected, ${records.length} record(s)`, this);
				ComponentUtil.forceRefresh(this, { DBLinks: records, isLoading: false } ); 
			}, 
			'createdAt'
		);
	}

	test = () => {

		alert(this.isAuthenticated());
	}

	stopMonitorDBLinksCollection() {

		firestoreManager.stopMonitorQuery(ToDo.getCollectionName());
	}

	componentDidMount() {
	
		this.monitorDBLinksCollection();
	}
	
	addBlankLinks = () => {

		const order = DBLink.getMaxOrder(this.state.DBLinks);
		DBLink.add(DBLink.create('<new>', '', order));
	}

	export = () => {

		const marker = "******************************************************************************************";
		console.log(marker);
		// console.dir(this.state.DBLinks);
		console.log(JSON.stringify(this.state.DBLinks, null, 2));
		console.log(marker);
		alert('See result in browser console');
	}

	getAddButtonAlertJsx = (isLoading, render = true) => {

		if(!render) return null;

		if(this.isAuthenticated()) {
			return <div>
				<Button isLoading={isLoading} text="Log out" onClick={this.googleLogout} />
				&nbsp;
				<Button isLoading={isLoading} text="New" onClick={this.addBlankLinks} />
				&nbsp;
				<Button isLoading={isLoading} text="Export" onClick={this.export} />
				&nbsp;
				<Button isLoading={isLoading} text="Test" onClick={this.test} />
				&nbsp;				
				{/* https://developer.mozilla.org/en-US/docs/Web/API/FileList */}
				<input id="fileItem" multiple type="file"></input>
			</div>;
		}
		else {
			return <div>
			<Button isLoading={isLoading} text="Google Login" onClick={this.googleLogin} />
			&nbsp;
			<Button isLoading={isLoading} text="Test" onClick={this.isAuthenticated} />
			</div>;
		}
	}

	setIsLoading = (isLoading) => {

		ComponentUtil.forceRefresh(this, { isLoading } ); 
	}

	renderDBLinkToJsx = (linkComponent) => {
		
		const fileCount = Object.keys(linkComponent.files).length;
		return <DBLinkComponent 
			fileCount={fileCount}
			dbLink={linkComponent}
			isAuthenticated={this.isAuthenticated()}
			key={linkComponent.id}
			deleteDbLink={DBLink.delete}
			setIsLoading={this.setIsLoading}
		/>;
	}

	renderDBLinksToJsx = (dbLinks) => {

		return dbLinks.map((dbLink) => {
			return this.renderDBLinkToJsx(dbLink);
		});
	}    

	// --- Misc Events ---

	render() {

		Tracer.log(`render isLoading:${this.state.isLoading}`, this);
		const authenticatedUserDisplayName = firestoreManager.getCurrentUserDisplayName();

		const statusMessage = this.state.isLoading ? "Busy. . . " : `${this.state.DBLinks.length} links. User:${authenticatedUserDisplayName}, Ready...`;
		let statusClassName = this.state.isLoading ? "alert alert-warning" : "alert alert-success";

		return (
			<div>
				<h2>DBLinks with Firebase</h2> 

				{this.getAddButtonAlertJsx(this.state.isLoading, true)}
				
				<div className={statusClassName} role="alert" style={{ marginTop:"2px"}}>
					<strong>Status </strong> : {statusMessage}
				</div>
				<ul className="list-group" style={{marginTop:'0px'}}>
					{this.renderDBLinksToJsx(this.state.DBLinks)}
				</ul>
			</div>
		); 
	}
}
export default DBLinksComponent;
