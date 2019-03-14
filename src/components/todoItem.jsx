import React from "react";
import PropTypes from "prop-types";
import tracer from '../common/Tracer';
import firestoreManager from "../common/FirestoreManager";
import ToDo from './todo';

const isMobile = false;

class TodoItem extends React.PureComponent {

	static propTypes = {		

		description 	: PropTypes.string,
		id 				: PropTypes.string.isRequired,
		isCompleted 	: PropTypes.bool.isRequired,
		createdAt 		: PropTypes.object.isRequired,
		updatedAt 		: PropTypes.object.isRequired,
		showDate		: PropTypes.bool.isRequired,
		order			: PropTypes.number.isRequired,
		updateToDo		: PropTypes.func.isRequired,
		deleteToDo		: PropTypes.func.isRequired,
	};

	onDeleteClick = () => {
		
		this.props.deleteToDo(this.props.id);
	}
	
	onCheckClick = (e) => {

		const isCompleted = e.target.checked;	
		const todo = ToDo.createFromProps(this.props, { isCompleted });
		this.props.updateToDo(todo);
	}	

	getDay (createdTime) {

		return firestoreManager.formatTimestamp(createdTime)
	}

	getCreatedTimeJsx() {

		if(this.props.showDate){
			if(isMobile) {
				return (
					<div>
						<small>
							{this.getDay(this.props.createdAt)}
						</small>
					</div>
				);
			}
			else {
				return ` - ${this.getDay(this.props.createdAt)}`				
			}			
		}
		else return null;
	}

	render() {

		return (
			<li key={this.props.id} id={this.props.id} order={this.props.order} className="list-group-item">
				<input 
				style={{transform: 'scale(1.75)'}} 
				checked={this.props.isCompleted} type="checkbox" 
					id={this.props.id} onChange={(e) => { this.onCheckClick(e); }} 
				/>
				&nbsp; Done &nbsp;
				<button type="button" className="btn  btn-success" onClick={this.onDeleteClick}>Delete</button>
				&nbsp; {this.props.description}
				 {/* - ({this.props.order}) */}
				{this.getCreatedTimeJsx()}
			</li>
		);
	}	
}

export default TodoItem;
