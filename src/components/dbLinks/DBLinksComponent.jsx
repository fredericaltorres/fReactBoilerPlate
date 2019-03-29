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
import { max } from "moment";

class DBLinksComponent extends React.PureComponent {

	static propTypes = {

	};

	state = {

		timeStamp: new Date().getTime(),
		editText :'',
		isLoading: true,
		DBLinks: [],
		fileMetadatas: [],
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

			this.LoadAuthorisationRoles();
		});
	}

	isAuthenticated () {

		return firestoreManager.getCurrentUser() != null;
	}

	isAdmin() {

		return firestoreManager.getCurrentIsAdmin();
	}
	
	monitorDBLinksCollection() {

		firestoreManager.monitorQuery(
			DBLink.getCollectionName(),
			(records) => { 
				Tracer.log(`collection ${DBLink.getCollectionName()} change detected, ${records.length} record(s)`, this);
				ComponentUtil.forceRefresh(this, { DBLinks: records, isLoading: false }, 
					() => {
						const promises = this.state.DBLinks.map((dbLink) => {
							return DBLink.loadFileMetaData(dbLink);
						});
						Promise.all(promises).then((fileMetadatas) => {
							ComponentUtil.forceRefresh(this, { fileMetadatas }, () => {
								console.log(`APP STATE:${JSON.stringify(this.state)}`);
							});
						});
					}
				); 
			}, 
			'createdAt'
		);
	}

	test = () => {

		this.LoadAuthorisationRoles();
	}
	
	stopMonitorDBLinksCollection() {

		firestoreManager.stopMonitorQuery(ToDo.getCollectionName());
	}

	LoadAuthorisationRoles = () => {

		if(firestoreManager.isCurrentUserLoaded()) {

			return firestoreManager.currentUserHasRole(firestoreManager.ADMIN_ROLE).then((isAdmin) => {

				Tracer.log(`Admin mode detected for current user @@@@@@@@@@@@`, this);
				this.monitorDBLinksCollection();
			});
		}
		else {
			Tracer.log(`Current user not loaded, waiting for it, execution mode Anonymous`, this);
			this.monitorDBLinksCollection();
			firestoreManager.onCurrentUserLoadedCallBack = this.LoadAuthorisationRoles;
		}
	}

	componentDidMount() {

		this.LoadAuthorisationRoles();	
	}
	
	addBlankLinks = () => {

		const order = DBLink.getMaxOrder(this.state.DBLinks);
		DBLink.add(DBLink.create('<new>', '', order));
	}

	export = () => {

		const marker = "*****************************************";
		console.log(marker);
		console.log(JSON.stringify(this.state.DBLinks, null, 2));
		console.log(marker);
		alert('See result in browser console');
	}

	getAddButtonAlertJsx = (isLoading, render = true) => {

		if(!render) return null;

		if(this.isAuthenticated()) {
			return <div>
				<Button isLoading={isLoading} text="Log out" onClick={this.googleLogout}  />
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
			<Button text="Google Login" onClick={this.googleLogin} />			
			</div>;
		}
	}

	setIsLoading = (isLoading) => {

		ComponentUtil.forceRefresh(this, { isLoading } ); 
	}

	renderDBLinkToJsx = (linkComponent) => {
		
		let fileMetadata = this.state.fileMetadatas[linkComponent.id];
		if(!fileMetadata) 
			fileMetadata = [];
		else
			console.log(`PASS FILEMETADATA ${JSON.stringify(fileMetadata)}`);
			
		const fileCount = Object.keys(linkComponent.files).length;
		return <DBLinkComponent 
			fileCount={fileCount} // pass fileCount to force a refresh if the number of file changed
			dbLink={linkComponent}
			fileMetadata={fileMetadata}
			isAdmin={this.isAdmin()}
			key={linkComponent.id}
			deleteDbLink={DBLink.deleteWithFiles}
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
		const authenticatedUserDisplayName = firestoreManager.isCurrentUserLoaded() ? firestoreManager.getCurrentUserDisplayName() : "Anonymous";
		const statusMessage = this.state.isLoading ? "Busy. . . " : `${this.state.DBLinks.length} links. User: ${authenticatedUserDisplayName},  Ready . . .`;
		let statusClassName = this.state.isLoading ? "alert alert-warning" : "alert alert-success";

		return (
			<div>
				<h2>DBLinks with Firebase</h2> 

				{this.getAddButtonAlertJsx(this.state.isLoading, true)}
				
				<div className={statusClassName} role="alert" style={{ marginTop:"2px", padding:'2px'}}>
					<strong>&nbsp;Status </strong> : {statusMessage}
				</div>
				<ul className="list-group" style={{marginTop:'0px'}}>
					{this.renderDBLinksToJsx(this.state.DBLinks)}
				</ul>
			</div>
		); 
	}
}
export default DBLinksComponent;
