import React from "react";
import PropTypes from "prop-types";
import tracer from '../../common/Tracer';
import Button from '../Button';
import Checkbox from '../Checkbox';
import firestoreManager from '../../common/FirestoreManager';
import ComponentUtil from '../../common/ComponentUtil';
import { ESCAPE_KEY, ENTER_KEY } from '../../common/ComponentUtil';
import DBLink from './dbLink';
import Tracer from "../../common/Tracer";
import DBLinkComponent from './DBLinkComponent';

//const googleFredUID = "WmPSqmDxokewWJsybaUMwoDmuoE2";
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
		this.name = "DBLinks.jsx";
		tracer.log('constructor', this);
	}

	googleLogin() {

		firestoreManager.googleLogin();
	}

	isAuthenticated() {

		return googleFredUID == firestoreManager.getCurrentUserUID();
	}

	monitorDBLinksCollection() {

		firestoreManager.monitorQuery(
			DBLink.getCollectionName(),
			(records) => { 
				Tracer.log(`collection ${DBLink.getCollectionName()} change detected, ${records.length} record(s)`);
				ComponentUtil.forceRefresh(this, { DBLinks: records, isLoading: false } ); 
			}, 
			'createdAt'
		);
	}

	test = () => {
		ComponentUtil.forceRefresh(this); 
	}

	stopMonitorDBLinksCollection() {

		firestoreManager.stopMonitorQuery(ToDo.getCollectionName());
	}

	componentDidMount() {
	
		this.monitorDBLinksCollection();
	}
	
	// addLinks = () => {

	// 	const link = prompt('New link?', undefined);
	// 	if(link !== null) {
	// 		debugger;
	// 		const description = prompt('Description?', undefined);
	// 		const order = DBLink.getMaxOrder(this.state.DBLinks);
	// 		DBLink.add(DBLink.create(link, description, order));
	// 	}
	// }
	
	addBlankLinks = () => {

		const order = DBLink.getMaxOrder(this.state.DBLinks);
		DBLink.add(DBLink.create('<new>', '', order));
	}

	export = () => {

		console.dir(this.state.DBLinks);
		console.log(JSON.stringify(this.state.DBLinks));
	}

	uploadSelectedFiles = (dbLinkId) => {

		const dbLink = this.state.DBLinks.find((dbLink) => { return dbLink.id === dbLinkId});
		if(dbLink) {
			
			Tracer.log(`Uploading files dbLinkId:${dbLinkId}`);
			const files = Object.values(document.getElementById('fileItem').files);
			var promises = [];
			files.forEach((file) => {
				
				dbLink.files[file.name] = file.size;
				promises.push(firestoreManager.uploadFileToStorage(file, dbLinkId));
			});
			Promise.all(promises).then(() => {
				Tracer.log(`Done uploading files`);
				DBLink.update(dbLink).then(() => {
					Tracer.log(`Done uploading dbLink ${dbLinkId} with files meta data`);
					ComponentUtil.forceRefresh(this);  // Force to refresh, I do not know why it does not
				});
			});
		}
		else {
			alert(`Cannot find dblink:${dbLinkId}`);
		}
	}

	getAddButtonAlertJsx = (isLoading, render = true) => {

		if(!render) return null;

		if(this.isAuthenticated()) {
			return <div>
				<Button isLoading={isLoading} text="New" onClick={this.addBlankLinks} />
				&nbsp;
				<Button isLoading={isLoading} text="Export" onClick={this.export} />
				&nbsp;
				<Button isLoading={isLoading} text="Test" onClick={this.test} />
				&nbsp;				
				{/* https://developer.mozilla.org/en-US/docs/Web/API/FileList */}
				<input id="fileItem" type="file"></input>
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

	renderDBLinkToJsx = (linkComponent) => {
		
		const fileCount = Object.keys(linkComponent.files).length;
		return <DBLinkComponent 
			fileCount={fileCount}
			dbLink={linkComponent}
			key={linkComponent.id}
			deleteDbLink={DBLink.delete}
			uploadSelectedFiles={this.uploadSelectedFiles}
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

		const statusMessage = this.state.isLoading ? "Busy... " : `${this.state.DBLinks.length} links. User:${authenticatedUserDisplayName}, Ready...`;
		let statusClassName = this.state.isLoading ? "alert alert-warning" : "alert alert-success";

		return (
			<div>
				<h2>DBLinks (Firebase)</h2>

				{this.getAddButtonAlertJsx(this.state.isLoading, true)}
				
				<div className={statusClassName} role="alert">
					<strong>Status </strong> : {statusMessage}
				</div>
				
				<ul className="list-group" style={{marginTop:'5px'}}>
					{this.renderDBLinksToJsx(this.state.DBLinks)}
				</ul>
			</div>
		); 
	}
}
export default DBLinksComponent;
