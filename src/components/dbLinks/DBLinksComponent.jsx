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

	stopMonitorDBLinksCollection() {

		firestoreManager.stopMonitorQuery(ToDo.getCollectionName());
	}

	componentDidMount() {
	
		this.monitorDBLinksCollection();
	}
	
	addLinks () {
		const link = prompt('New link?', undefined);
		if(link !== null) {
			const description = prompt('Description?', undefined);
			DBLink.add(DBLink.create(link, description));
		}
	}

	getAddButtonAlertJsx = (isLoading, render = true) => {

		if(!render) return null;
		return <div>
			<Button isLoading={isLoading} text="Add" onClick={this.addLinks} />
		</div>;
	}

	renderDBLinkToJsx = (linkComponent) => {
		
		return <DBLinkComponent 
			dbLink={linkComponent}
			key={linkComponent.id}
			deleteDbLink={DBLink.delete}
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
		const statusMessage = this.state.isLoading ? "Busy... " : `${this.state.DBLinks.length} links. Ready...`;
		let statusClassName = this.state.isLoading ? "alert alert-warning" : "alert alert-success";

		return (
			<div>
				<h2>DBLinks (Firebase)</h2>

				{this.getAddButtonAlertJsx(this.state.isLoading, true)}
				
				<div className={statusClassName} role="alert">
					<strong>App Status </strong> : {statusMessage}
				</div>
				
				<ul className="list-group" style={{marginTop:'5px'}}>
					{this.renderDBLinksToJsx(this.state.DBLinks)}
				</ul>
			</div>
		); 
	}
}
export default DBLinksComponent;
