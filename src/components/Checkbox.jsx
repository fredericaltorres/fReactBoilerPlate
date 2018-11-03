import React from "react";
import PropTypes from "prop-types";
import ComponentUtil from '../common/ComponentUtil';

class Checkbox extends React.PureComponent {

	static propTypes = {
		isLoading: PropTypes.bool.isRequired,
		onChange: PropTypes.func.isRequired,
		text: PropTypes.string.isRequired,
		id: PropTypes.string,
		checked: PropTypes.bool.isRequired,
		scale: PropTypes.number,
	};
	static defaultProps = {
		scale: 1.65
	};	
	getId(prefix) {

		if(this.props.id)
			return this.props.id;
		return `${prefix}_${ComponentUtil.getNewUniqueId()}`;
	}
	render() {
		return <span>
			<input 
				type="checkbox" 
				style={{transform: `scale(${this.props.scale})`}} 
				id={this.getId('chk')}
				checked={this.props.checked} 
				onChange={this.props.onChange} 
			/>
			&nbsp;&nbsp;{this.props.text}
	  	</span>;
	}
}

export default Checkbox;