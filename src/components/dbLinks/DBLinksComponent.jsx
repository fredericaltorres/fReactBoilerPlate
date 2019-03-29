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
		fileMetadatas: {}, // Map with key is dbLinkId containing a map where the key is the filename
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

			this.loadAuthorizationRoles();
		});
	}

	// Return true if we have a google logged in user which may or may not be an admin
	isAuthenticated () {

		return firestoreManager.isCurrentUserLoaded();		
	}

	// Return true if the current user loaded is authenticated and an admin
	isCurrentUserLoadedAdmin() {

		return firestoreManager.getCurrentUserLoadedIsAdmin();
	}
	
	monitorDBLinksCollection() {

		firestoreManager.monitorQuery(
			DBLink.getCollectionName(),
			(records) => { 

				Tracer.log(`collection ${DBLink.getCollectionName()} change detected, ${records.length} record(s)`, this);

				// Force a first refresh now that we have the DBLinks, we still need to load the file metadata
				ComponentUtil.forceRefresh(this, { DBLinks: records },  () => {

						// Load the file metadata
						const promises = this.state.DBLinks.map((dbLink) => {

							return DBLink.loadFilesMetaData(dbLink);
						});
						Promise.all(promises).then((fileMetadatas) => {

							// Reshaffle the file metadata structure before storing it into the componenent state
							const fileMetadatasMap = {};
							fileMetadatas.forEach((fileMetadataObject) => {

								const dbLinkId = Object.keys(fileMetadataObject)[0];
								const fileMetadata = fileMetadataObject[dbLinkId];
								fileMetadatasMap[dbLinkId] = fileMetadata;
							});
							
							ComponentUtil.forceRefresh(this, { fileMetadatas:fileMetadatasMap, isLoading: false } );
						});
					}
				); 
			}, 
			'createdAt'
		);
	}

	test = () => {

		this.loadAuthorizationRoles();
	}
	
	stopMonitorDBLinksCollection() {

		firestoreManager.stopMonitorQuery(ToDo.getCollectionName());
	}

	loadAuthorizationRoles = () => {

		if(firestoreManager.isCurrentUserLoaded()) {

			return firestoreManager.currentUserHasRole(firestoreManager.ADMIN_ROLE).then((isAdmin) => {

				
				if(isAdmin) {
					Tracer.warn(`Admin mode detected for current user:${firestoreManager.getCurrentUserDisplayName()}`, this);
				}
				else {
					Tracer.warn(`Admin mode NOT detected for current user:${firestoreManager.getCurrentUserDisplayName()}`, this);
				}
				this.monitorDBLinksCollection();
			});
		}
		else {
			Tracer.log(`Current user not loaded, waiting for it, execution mode Anonymous`, this);
			this.monitorDBLinksCollection();
			firestoreManager.onCurrentUserLoadedCallBack = this.loadAuthorizationRoles;
		}
	}

	componentDidMount() {

		this.loadAuthorizationRoles();	
	}
	
	addBlankLinks = () => {

		const order = DBLink.getMaxOrder(this.state.DBLinks);
		DBLink.add(DBLink.create('<new>', '<description>', order));
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

		const logOutButtonJsx = <Button isLoading={isLoading} text="Log out" onClick={this.googleLogout}  />;
		if(this.isCurrentUserLoadedAdmin()) {
			return <div>
				{logOutButtonJsx}
				&nbsp;
				<Button isLoading={isLoading} text="New" onClick={this.addBlankLinks} />
				&nbsp;
				<Button isLoading={isLoading} text="Export" onClick={this.export} />
				&nbsp;
				{/* <Button isLoading={isLoading} text="Test" onClick={this.test} /> &nbsp; */}
				{/* https://developer.mozilla.org/en-US/docs/Web/API/FileList */}
				<input id="fileItem" multiple type="file"></input>
			</div>;
		}
		else {
			if(this.isAuthenticated()) {
				return logOutButtonJsx
			}
			else {
				return <Button text="Google Login" onClick={this.googleLogin} />;
			}
		}
	}

	setIsLoading = (isLoading) => {

		ComponentUtil.forceRefresh(this, { isLoading } ); 
	}

	renderDBLinkToJsx = (linkComponent) => {

		// if(Object.keys(this.state.fileMetadatas).length>0)
		// 	debugger;

		let fileMetadata = this.state.fileMetadatas[linkComponent.id];
		if(!fileMetadata) 
			fileMetadata = {};
		
		const fileCount = Object.keys(linkComponent.files).length;
		return <DBLinkComponent 
			fileCount={fileCount} // pass fileCount to force a refresh if the number of file changed
			dbLink={linkComponent}
			fileMetadatas={fileMetadata}
			isAdmin={this.isCurrentUserLoadedAdmin()}
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
