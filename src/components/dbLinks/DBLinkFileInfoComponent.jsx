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

		let buttonJsx = <span></span>;
		if(this.props.isAuthenticated) {
			buttonJsx = <span>
				<button type="button" onClick={() => { this.onDeleteClick(this.props.fullPath); }}>Delete</button>
			</span>;
		}

		return <span>
			<a href={this.props.downloadURL} target="top">{this.props.name}</a>
			&nbsp;
			{Math.round(this.props.size/1024)} Kb
			&nbsp;
			{buttonJsx}
		</span>;
	}	
}

export default DBLinkFileInfoComponent;
