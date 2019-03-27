import React from "react";
import PropTypes from "prop-types";
import Tracer from '../../common/Tracer';
import firestoreManager from "../../common/FirestoreManager";
import DBLink from './dbLink';
import ComponentUtil from '../../common/ComponentUtil';
import { ESCAPE_KEY, ENTER_KEY } from '../../common/ComponentUtil';
import DBLinkFileInfoComponent from './DBLinkFileInfoComponent';
import Collapsible from 'react-collapsible';

// import './DBLinkComponent.css';

class DBLinkComponent extends React.PureComponent {

	static propTypes = {		

		dbLink : DBLink.shape(),
		fileCount		: PropTypes.number.isRequired, // Just passe to force a refresh when we add/remove a file
		deleteDbLink	: PropTypes.func.isRequired,
		setIsLoading	: PropTypes.func.isRequired,
		isAdmin	: PropTypes.bool.isRequired,
	};

	state = {

		isEditing: false,
		editText: null,
		editDescription: null,
		fileMetadatas:[]
	};

	LINK_MAX_LENGTH_FOR_DISPLAY = 55;

	constructor() {

		super();		
		this.name = "DBLinkComponent";
	}

	componentDidMount() {

		ComponentUtil.forceRefresh(this, { isEditing: this.state.isEditing, editText: this.props.link } );
		this.triggerLoadingFileMetaData();		

	}

	uploadSelectedFiles = () => {

		this.props.setIsLoading(true);
		const dbLink = this.props.dbLink;
		Tracer.log(`Uploading files dbLinkId:${dbLink.id}`, this);
		const files = this.getFilesToUpLoad();
		if(files.length) {
			var promises = [];
			files.forEach((file) => {
				dbLink.files[file.name] = file.size;
				promises.push(firestoreManager.uploadFileToStorage(file, dbLink.id));
			});
			Promise.all(promises).then(() => {
				Tracer.log(`Done uploading files`, this);
				DBLink.update(dbLink).then(() => {
					Tracer.log(`Done uploading dbLink ${dbLink.id} with files meta data`, this);
					this.triggerLoadingFileMetaData();
					this.props.setIsLoading(false);
				});
			});
		}
		else Tracer.notifyUser(`No file to upload!`, this);
	}

	triggerLoadingFileMetaData = () => {

		this.props.setIsLoading(true);
		const promises = [];
		const files = Object.keys(this.props.dbLink.files);
		files.forEach((fileName) => {
			promises.push(firestoreManager.GetFileMetaDataFromStorage(fileName, this.props.dbLink.id));
		});		
		Promise.all(promises).then((metadatas) => {
			ComponentUtil.forceRefresh(this, { fileMetadatas : metadatas } );
		}).finally(() => {
			this.props.setIsLoading(false);
		});
		
		const metaDataSample = {
			"type": "file",
			"bucket": "fredtodo-f553b.appspot.com",
			"generation": "1553469831203489",
			"metageneration": "1",
			"fullPath": "DBLinks/05bf0902e73e3/ExportedClient.xml",
			"name": "ExportedClient.xml",
			"size": 805667,
			"timeCreated": "2019-03-24T23:23:51.203Z",
			"updated": "2019-03-24T23:23:51.203Z",
			"md5Hash": "yZVF/2w9KoHaH2rzJe+2AA==",
			"contentDisposition": "inline; filename*=utf-8''ExportedClient.xml",
			"contentEncoding": "identity",
			"contentType": "text/xml"
		}
	}

	onDeleteClick = () => {

		if(confirm(`Delete link?`)) {
			this.props.setIsLoading(true);
			this.props.deleteDbLink(this.props.dbLink.id).finally(() => {
				this.props.setIsLoading(false);
			});
		}
	}

	onEditClick = () => {
		
		const self = this;
		Tracer.log(`Edit link ${this.state.isEditing}`, this);
		ComponentUtil.forceRefresh(this, { isEditing: !this.state.isEditing }, () => {
			if(self.state.isEditing)
				self.editField.focus();
		});
	}

	onOpenClick = () => {
		
		Tracer.log(`Opening link ${this.getLink()}`, this);
		window.open(this.getLink(), "_blank" );// "toolbar=yes,top=0,left=0,width=400,height=400"
	}

	handleLinkChange = (event) => {

		ComponentUtil.forceRefresh(this, { editText : event.target.value });
	}

	handleDescriptionChange = (event) => {

		ComponentUtil.forceRefresh(this, { editDescription : event.target.value });
	}

	handleKeyDown = (event) => {
		
		const self = this;
		if (event.which === ESCAPE_KEY) {
			this.onEditClick();
		}
		else if (event.which === ENTER_KEY) {

			if(this.getLink()) {
				
				var dbLink = this.props.dbLink;
				dbLink.link = this.getLink();
				dbLink.description = this.getDescription();
				DBLink.update(dbLink).then(() => {
					self.onEditClick();
				});
			}
		}
	}

	getFilesToUpLoad() {

		return Object.values(document.getElementById('fileItem').files);
	}

	getLink() {

		if(this.state.editText)
			return this.state.editText;
		return this.props.dbLink.link;			
	}

	getLinkForDisplay() {

		const link = this.getLink();
		if(link.length > this.LINK_MAX_LENGTH_FOR_DISPLAY)
			return `${link.substring(0, this.LINK_MAX_LENGTH_FOR_DISPLAY)} . . .`;

		return link;
	}

	getDescription() {

		if(this.state.editDescription)
			return this.state.editDescription;
		return this.props.dbLink.description;
	}

	render() {

		const fileMetadatas = Object.values(this.state.fileMetadatas);
		Tracer.log(`render this.state.fileMetadatas length:${this.state.fileMetadatas.length}`, this);

		// Generate jsx for non edit mode
		let linkRendering = <button type="button" className="btn btn-link" onClick={this.onOpenClick}>
			<b>{this.props.dbLink.description}</b>
		</button>;

		let descriptionRendering = null;

		if(this.state.isEditing) { // Jsx for edit mode

			linkRendering = <span>
				<br/> Link: <input type="text" style={{color:'red', width:'400px'}} className="edit" value={this.getLink()} onChange={this.props.isLoading ? () => {} : this.handleLinkChange}  onKeyDown={this.handleKeyDown} ref={(input) => { this.editField = input; }} />
			</span>;

			descriptionRendering = <span>
				Description: <input type="text" style={{color:'red', width:'400px'}} className="edit"  value={this.getDescription()} onChange={this.props.isLoading ? () => {} : this.handleDescriptionChange} onKeyDown={this.handleKeyDown} ref={(input) => { this.editDescription = input; }}  />
			</span>;
		}

		let DBLinkFileCollapsibleComponentJsx = this.getDbLinkFilesJsx(fileMetadatas);
		let buttonsJsx = this.getButtonsJsx();

		return (
			<li key={this.props.dbLink.id} id={this.props.dbLink.id} className="list-group-item">
				{buttonsJsx}
				{linkRendering}
				<div style={{marginTop:"3px"}}>
					{descriptionRendering}
				</div>
				<small>
					{DBLinkFileCollapsibleComponentJsx}
				</small>
			</li>
		);
	}	

	getDbLinkFilesJsx(fileMetadatas) {

		let DBLinkFileCollapsibleComponentJsx = null; // Assume by default that there is no file associated with this dbLink
		let DBLinkFileInfoComponentJsx = <span>No files</span>;
		if (fileMetadatas.length > 0) {
			DBLinkFileInfoComponentJsx = fileMetadatas.map((fileMetaData) => {
				return <DBLinkFileInfoComponent setIsLoading={this.props.setIsLoading} dbLink={this.props.dbLink} key={fileMetaData.name} name={fileMetaData.name} size={fileMetaData.size} fullPath={fileMetaData.fullPath} downloadURL={fileMetaData.downloadURL} isAdmin={this.props.isAdmin} triggerParentRefresh={this.triggerLoadingFileMetaData} />;
			});
			DBLinkFileCollapsibleComponentJsx = this.getDBLinkFileCollapsibleComponentJsx(fileMetadatas, DBLinkFileInfoComponentJsx);
		}
		return DBLinkFileCollapsibleComponentJsx;
	}

	getButtonsJsx() {

		const buttonStyle = { paddingTop: '1px', paddingBottom: '0px', paddingLeft: '4px', paddingRight: '4px' };
		let buttonsJsx = <span></span>;
		if (this.props.isAdmin) {
			buttonsJsx = <span>
				<button type="button" style={buttonStyle} className="btn btn-info btn-sm" onClick={this.onEditClick}>Edit</button>
				&nbsp;
				<button type="button" style={buttonStyle} className="btn btn-info btn-sm" onClick={this.uploadSelectedFiles}>Upload</button>
				&nbsp;
				<button type="button" style={buttonStyle} className="btn btn-info btn-sm" onClick={this.onDeleteClick}>Delete</button>
				<input type="hidden" value={this.props.dbLink.id}></input>
			</span>;
		}
		return buttonsJsx;
	}

	getDBLinkFileCollapsibleComponentJsx(fileMetadatas, DBLinkFileInfoComponentJsx) {

		{ /* https://github.com/glennflanagan/react-collapsible */ }
		const DBLinkFileCollapsibleComponentJsx = <Collapsible trigger={`${fileMetadatas.length} Files`} open={false}>
			<table className="table table-sm">
				<thead>
					<tr>
						<th>File</th>
						<th>Size</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{DBLinkFileInfoComponentJsx}
				</tbody>
			</table>
		</Collapsible>;
		return DBLinkFileCollapsibleComponentJsx;
	}
}

export default DBLinkComponent;
