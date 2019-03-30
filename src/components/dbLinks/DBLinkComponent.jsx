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
		fileMetadatas : PropTypes.object.isRequired,
		fileCount : PropTypes.number.isRequired, // Just passe to force a refresh when we add/remove a file
		deleteDbLink : PropTypes.func.isRequired,
		setIsLoading : PropTypes.func.isRequired,
		isAdmin	: PropTypes.bool.isRequired,
	};

	state = {

		isEditing: false,
		editText: null,
		editDescription: null,
	};

	LINK_MAX_LENGTH_FOR_DISPLAY = 55;

	constructor() {

		super();		
		this.name = "DBLinkComponent";
	}

	componentDidMount() {

		ComponentUtil.forceRefresh(this, { isEditing: this.state.isEditing, editText: this.props.link } );
	}

	uploadSelectedFiles = () => {

		this.props.setIsLoading(true);
		const dbLink = this.props.dbLink;
		Tracer.log(`Uploading files dbLinkId:${dbLink.id}`, this);
		const files = this.getFilesToUpLoad();
		if(files.length) {
			var promises = [];
			files.forEach((file) => { // Upload all the files
				dbLink.files[file.name] = file.size; // update  the files array in memory only
				promises.push(firestoreManager.uploadFileToStorage(file, dbLink.id));
			});
			Promise.all(promises).then(() => {
				Tracer.log(`Done uploading files`, this);
				DBLink.update(dbLink).then(() => { // Now update the db link instance
					Tracer.log(`Done uploading dbLink ${dbLink.id} with files meta data`, this);
					this.props.setIsLoading(false);
				});
			});
		}
		else Tracer.notifyUser(`No file to upload!`, this);
	}
	
	onDeleteClick = () => {

		if(confirm(`Delete link?`)) {
			this.props.setIsLoading(true);
			this.props.deleteDbLink(this.props.dbLink).finally(() => {
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

	handleCategoryChange = (event) => {

		ComponentUtil.forceRefresh(this, { editCategory : event.target.value });
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
				dbLink.category = this.getCategory();
				debugger;
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

	getCategory() {

		if(this.state.editCategory)
			return this.state.editCategory;
		return this.props.dbLink.category;
	}

	render() {

		let fileMetadatas = [];
		if(this.props.fileMetadatas)
			fileMetadatas = Object.values(this.props.fileMetadatas);
		Tracer.log(`render this.props.fileMetadatas length:${fileMetadatas.length}`, this);

		// Generate jsx for non edit mode
		let inputBoxesJsx  = <button type="button" className="btn btn-link" onClick={this.onOpenClick}>
			<b>{this.props.dbLink.category} - {this.props.dbLink.description}</b>
		</button>;

		let descriptionRendering = null;

		if(this.state.isEditing) { // Jsx for edit mode

			const inpuBoxWidth = '500px';

			inputBoxesJsx =<form>
				<div className="form-group">
					<label htmlFor="inputBoxLinkId">Link (id:{this.props.dbLink.id}) </label>
					<input id="inputBoxLinkId" type="text" style={{ width:inpuBoxWidth}} className="form-control" value={this.getLink()} onChange={this.props.isLoading ? () => {} : this.handleLinkChange}  onKeyDown={this.handleKeyDown} ref={(input) => { this.editField = input; }} />
				</div>
				<div className="form-group">
					<label htmlFor="inputBoxDescriptionId">Description</label>
					<input id="inputBoxDescriptionId" type="text" style={{ width:inpuBoxWidth}} className="form-control"  value={this.getDescription()} onChange={this.props.isLoading ? () => {} : this.handleDescriptionChange} onKeyDown={this.handleKeyDown} ref={(input) => { this.editDescription = input; }}  />
				</div>
				<div className="form-group">
					<label htmlFor="inputBoxCategoryId">Category</label>

					{/* <input id="inputBoxCategoryId" type="text" style={{ width:inpuBoxWidth}} className="form-control"  
					value={this.getCategory()} onChange={this.props.isLoading ? () => {} : this.handleDescriptionChange} onKeyDown={this.handleKeyDown} ref={(input) => { this.editCategory = input; }}  /> */}

					<select id="inputBoxCategoryId" className="form-control" onChange={this.props.isLoading ? () => {} : this.handleCategoryChange}  value={this.getCategory()}  onKeyDown={this.handleKeyDown} ref={(input) => { this.editCategory = input; }} >
						<option value="Hardware">Hardware</option>
						<option value="Software">Software</option>
						<option value="Other">Other</option>
					</select>			   
				</div>
			</form>;
		}

		return (
			<li key={this.props.dbLink.id} id={this.props.dbLink.id} className="list-group-item">
				{this.getButtonsJsx()}
				{inputBoxesJsx}
				<small>
					{this.getDbLinkFilesJsx(fileMetadatas)}
				</small>
			</li>
		);
	}	

	getDbLinkFilesJsx(fileMetadatas) {

		let DBLinkFileCollapsibleComponentJsx = null; // Assume by default that there is no file associated with this dbLink
		let DBLinkFileInfoComponentJsx = <span>No files</span>;
		if (fileMetadatas.length > 0) {
			DBLinkFileInfoComponentJsx = fileMetadatas.map((fileMetaData) => {
				return <DBLinkFileInfoComponent dbLink={this.props.dbLink} setIsLoading={this.props.setIsLoading} key={fileMetaData.name} name={fileMetaData.name} size={fileMetaData.size} fullPath={fileMetaData.fullPath} downloadURL={fileMetaData.downloadURL} isAdmin={this.props.isAdmin} />;
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
