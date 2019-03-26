import React from "react";
import PropTypes from "prop-types";
import Tracer from '../../common/Tracer';
import firestoreManager from "../../common/FirestoreManager";
import DBLink from './dbLink';
import ComponentUtil from '../../common/ComponentUtil';
import { ESCAPE_KEY, ENTER_KEY } from '../../common/ComponentUtil';
import DBLinkFileInfoComponent from './DBLinkFileInfoComponent';

class DBLinkComponent extends React.PureComponent {

	static propTypes = {		

		dbLink : DBLink.shape(),
		fileCount		: PropTypes.number.isRequired, // Just passe to force a refresh when we add/remove a file
		deleteDbLink	: PropTypes.func.isRequired,
		setIsLoading	: PropTypes.func.isRequired,
		isAuthenticated	: PropTypes.bool.isRequired,
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
		Tracer.log(`isAuthenticated:${this.props.isAuthenticated} >>>>>>>>>>>>>`, this)
	}

	uploadSelectedFiles = () => {

		this.props.setIsLoading(true);
		const dbLink = this.props.dbLink;
		Tracer.log(`Uploading files dbLinkId:${dbLink.id}`, this);
		const files = this.getFilesToUpLoad();
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
		})
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
		
		Tracer.log(`render`, this);

		let linkRendering = <button type="button" className="btn btn-link" onClick={this.onOpenClick}>
			<b>{this.getLinkForDisplay()}</b>
		</button>;

		let descriptionRendering = <i>{this.props.dbLink.description}</i>;

		if(this.state.isEditing) {

			linkRendering = <span>
				&nbsp;&nbsp;<input
				type="text"
				style={{color:'red', width:'400px'}}
				className="edit" 
				value={this.getLink()}
				onChange={this.props.isLoading ? () => {} : this.handleLinkChange} 
				onKeyDown={this.handleKeyDown}
				ref={(input) => { this.editField = input; }} 
				/>
			</span>

			descriptionRendering = <span>
				&nbsp;&nbsp;<input
				type="text"
				style={{color:'red', width:'400px'}}
				className="edit" 
				value={this.getDescription()}
				onChange={this.props.isLoading ? () => {} : this.handleDescriptionChange} 
				onKeyDown={this.handleKeyDown}
				ref={(input) => { this.editDescription = input; }} 
				/>
			</span>
		}

		let DBLinkFileInfoComponentJsx = <span>No files</span>;
		const fileMetadatas = Object.values(this.state.fileMetadatas);

		Tracer.log(`this.state.fileMetadatas length:${this.state.fileMetadatas.length}`, this);

		if(fileMetadatas.length > 0) {

			DBLinkFileInfoComponentJsx = fileMetadatas.map((fileMetaData) => {
				return <li key={fileMetaData.name} >
					<DBLinkFileInfoComponent setIsLoading={this.props.setIsLoading} 
						dbLink={this.props.dbLink} 
						key={fileMetaData.name} 
						name={fileMetaData.name} 
						size={fileMetaData.size} 
						fullPath={fileMetaData.fullPath} 
						downloadURL={fileMetaData.downloadURL} 
						isAuthenticated={this.props.isAuthenticated}
						triggerParentRefresh={this.triggerLoadingFileMetaData} />
				</li>
				 
			});
		}

		let buttonsJsx = <span></span>;
		if(this.props.isAuthenticated) {
			buttonsJsx = <span>
				<button type="button" className="btn btn-info btn-sm" onClick={this.onEditClick}>Edit</button>
				&nbsp;
				<button type="button" className="btn btn-info btn-sm" onClick={this.uploadSelectedFiles}>Upload</button>
				&nbsp;
				<button type="button" className="btn btn-info btn-sm" onClick={this.onDeleteClick}>Delete</button>
				<input type="hidden" value={this.props.dbLink.id}></input>
			</span>;
		}

		return (
			<li key={this.props.dbLink.id} id={this.props.dbLink.id} className="list-group-item">

				{buttonsJsx}
				{linkRendering}

				<div style={{marginTop:"3px"}}>
					{descriptionRendering}
				</div>
				<small>
					<ul count={this.props.fileCount}>
						{DBLinkFileInfoComponentJsx}
					</ul>
				</small>
			</li>
		);
	}	
}

export default DBLinkComponent;
