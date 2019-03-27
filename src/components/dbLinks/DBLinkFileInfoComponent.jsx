import React from "react";
import PropTypes from "prop-types";
import Tracer from '../../common/Tracer';
import firestoreManager from "../../common/FirestoreManager";
import DBLink from './dbLink';
import ComponentUtil from '../../common/ComponentUtil';

class DBLinkFileInfoComponent extends React.PureComponent {

	static propTypes = {		

		dbLink  : PropTypes.object.isRequired,
		fullPath: PropTypes.string.isRequired,
		name	: PropTypes.string.isRequired,
		downloadURL : PropTypes.string.isRequired,
		size	: PropTypes.number.isRequired,
		triggerParentRefresh : PropTypes.func.isRequired,
		setIsLoading	: PropTypes.func.isRequired,
		isAuthenticated	: PropTypes.bool.isRequired,
	};

	constructor() {
		
		super();		
		this.name = "DBLinkFileInfoComponent";
	}

	onDeleteClick = (fullPath) => {

		this.props.setIsLoading(true);
		Tracer.log(`Delete ${fullPath}, ${this.props.dbLink.id}`);

		DBLink.deleteFile(this.props.dbLink, this.props.name).then(() => {
			Tracer.log(`Deleted ${fullPath}, ${this.props.dbLink.id}`);
			this.props.triggerParentRefresh();
		}).finally(() => {
			this.props.setIsLoading(false);
		});
	}

	render() {

		Tracer.log(`render`, this);

		const buttonStyle = { paddingTop:'0px', paddingBottom:'0px',paddingLeft:'2px',paddingRight:'2px' };
		let buttonJsx = <span></span>;
		if(this.props.isAuthenticated) {
			buttonJsx = <span>
				<button type="button" style={buttonStyle}  onClick={() => { this.onDeleteClick(this.props.fullPath); }}>Delete</button>
			</span>;
		}

		// window.open(this.href, 'mywin','left=20,top=20,width=500,height=500,toolbar=1,resizable=0'); 
		
		return <tr>
			<td><a href={this.props.downloadURL} target="_blank">{this.props.name}</a></td>
			<td>{Math.round(this.props.size/1024)} Kb</td>
			<td>{buttonJsx}</td>			
		</tr>;
	}	
}

export default DBLinkFileInfoComponent;
