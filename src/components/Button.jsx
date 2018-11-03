import React from "react";
import PropTypes from "prop-types";
import ComponentUtil from '../common/ComponentUtil';

class Button extends React.PureComponent {

	static propTypes = {
		isLoading: PropTypes.bool.isRequired,
		onClick: PropTypes.func.isRequired,
		text: PropTypes.string.isRequired,
		id: PropTypes.string,
	};
	getId(prefix) {

		if(this.props.id)
			return this.props.id;
		return `${prefix}_${ComponentUtil.getNewUniqueId()}`;
	}
	render() {

		return <button style={{ marginTop:'2px', marginBottom:'2px'}} type="button" className="btn btn-primary" 
			disabled={this.props.isLoading} 
			onClick={this.props.onClick}
			id={this.getId('but')}
			>
				{this.props.text}
			</button> 
	}
}

export default Button;