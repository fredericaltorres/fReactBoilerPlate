import React from "react";
import PropTypes from "prop-types";
import Tracer from "../common/Tracer";

class Button extends React.PureComponent {

	static propTypes = {
		isLoading: PropTypes.bool.isRequired,
		onClick: PropTypes.func.isRequired,
		text: PropTypes.string.isRequired,
	};

	render() {
		return <button style={{ marginTop:'2px', marginBottom:'2px'}} type="button" className="btn btn-primary" 
			disabled={this.props.isLoading} 
			onClick = {this.props.onClick}>
				{this.props.text}
			</button> 
	}
}

export default Button;