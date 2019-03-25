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
		size	: PropTypes.number.isRequired,
	};

	constructor() {
		super();		
	}

	onDeleteClick = (fullPath) => {
		
		Tracer.log(`Delete ${fullPath}, ${this.props.dbLink.id}`);
		DBLink.deleteFile(this.props.dbLink, this.props.name).then(() => {
			Tracer.log(`Deleted ${fullPath}, ${this.props.dbLink.id}`);
		});
	}

	render() {

		return <span>
			{this.props.name}, {Math.round(this.props.size/1024)} Kb
			&nbsp;
			<button type="button" 
			onClick={ () => {
				this.onDeleteClick(this.props.fullPath);
			} }
			>Delete</button>
		</span>;
	}	
}

export default DBLinkFileInfoComponent;
