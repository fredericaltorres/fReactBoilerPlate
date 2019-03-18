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
	};

	state = {

		isEditing: false,
		editText: null,
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

	handleChange = (event) => {

		ComponentUtil.forceRefresh(this, { editText : event.target.value });
	}

	handleKeyDown = (event) => {
		const self = this;
		if (event.which === ESCAPE_KEY) {
			this.onEditClick();
		}
		else if (event.which === ENTER_KEY) {
			var link = this.state.editText.trim();
			if(link) {
				var dbLink = this.props.dbLink;
				dbLink.link = link;
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

	render() {

		let linkRendering = <button type="button" className="btn btn-link" onClick={this.onOpenClick}>
			<b>{this.getLink()}</b>
		</button>;

		if(this.state.isEditing) {
			linkRendering = 
			<span>
				&nbsp;&nbsp;<input
				type="text"
				style={{color:'red', width:'400px'}}
				className="edit" 
				value={this.getLink()}
				onChange={this.props.isLoading ? () => {} : this.handleChange} 
				onKeyDown={this.handleKeyDown}
				ref={(input) => { this.editField = input; }} 
				/>
			</span>
		}

		return (
			<li key={this.props.id} id={this.props.id} className="list-group-item">
				<button type="button" className="btn btn-info btn-sm" onClick={this.onDeleteClick}>Delete</button>
				&nbsp;
				<button type="button" className="btn btn-info btn-sm" onClick={this.onEditClick}>Edit</button>

				{linkRendering}

				<br/>
				<i>{this.props.dbLink.description}</i>
			</li>
		);
	}	
}

export default DBLinkComponent;
