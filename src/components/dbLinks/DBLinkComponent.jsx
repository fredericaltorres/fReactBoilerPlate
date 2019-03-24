import React from "react";
import PropTypes from "prop-types";
import Tracer from '../../common/Tracer';
import firestoreManager from "../../common/FirestoreManager";
import DBLink from './dbLink';
import ComponentUtil from '../../common/ComponentUtil';
import { ESCAPE_KEY, ENTER_KEY } from '../../common/ComponentUtil';

const isMobile = false;

class DBLinkComponent extends React.PureComponent {

	static propTypes = {		

		dbLink : DBLink.shape(),
		deleteDbLink	: PropTypes.func.isRequired,
		uploadSelectedFiles: PropTypes.func.isRequired,
	};

	state = {

		isEditing: false,
		editText: null,
		editDescription: null,
	};

	constructor() {
		super();		
	}

	componentDidMount() {
		ComponentUtil.forceRefresh(this, { isEditing: this.state.isEditing, editText: this.props.link } );
	}

	onDeleteClick = () => {
		
		this.props.deleteDbLink(this.props.dbLink.id);
	}

	uploadSelectedFiles = () => {
		
		this.props.uploadSelectedFiles(this.props.dbLink.id);
	}

	onEditClick = () => {
		
		const self = this;
		Tracer.log(`Edit link ${this.state.isEditing}`);
		ComponentUtil.forceRefresh(this, { isEditing: !this.state.isEditing }, () => {
			if(self.state.isEditing)
				self.editField.focus();
		});
	}

	onOpenClick = () => {
		
		Tracer.log(`Opening link ${this.getLink()}`);
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

	getLink() {

		if(this.state.editText)
			return this.state.editText;
		return this.props.dbLink.link;			
	}

	getDescription() {

		if(this.state.editDescription)
			return this.state.editDescription;
		return this.props.dbLink.description;
	}

	render() {

		let linkRendering = <button type="button" className="btn btn-link" onClick={this.onOpenClick}>
			<b>{this.getLink()}</b>
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

		return (
			<li key={this.props.id} id={this.props.id} className="list-group-item">
				<button type="button" className="btn btn-info btn-sm" onClick={this.onDeleteClick}>Delete</button>
				&nbsp;
				<button type="button" className="btn btn-info btn-sm" onClick={this.onEditClick}>Edit</button>
				&nbsp;
				<button type="button" className="btn btn-info btn-sm" onClick={this.uploadSelectedFiles}>Upload</button>

				{linkRendering}

				<div style={{marginTop:"3px"}}>
					{descriptionRendering}
				</div>
				<small>
					Files:{this.props.dbLink.files}
				</small>
			</li>
		);
	}	
}

export default DBLinkComponent;
