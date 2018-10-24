import React from "react";
import PropTypes from "prop-types";
import tracer from '../common/Tracer';

const isMobile = false;

class TodoItem extends React.PureComponent {
	static propTypes = {		
		taskDescription : PropTypes.string,
		id 				: PropTypes.string,
		isCompleted 	: PropTypes.bool,
		// forceRefresh	: PropTypes.func.isRequired,
		createdTime 	: PropTypes.string,
	};
	onDeleteClick = () => {
		// const newTodo = {
		// 	id : this.props.id,
		// };
		// store.dispatch(createToDoDeleteAsyncAction(newTodo));
	}
	onCheckClick = (e) => {
		const checked = e.target.checked;	
		const newTodo = {
			id : this.props.id,
			taskDescription: this.props.taskDescription,
			createdTime: this.props.createdTime,
			isCompleted : checked,
        };
        alert(checked);
		// store.dispatch(createToDoUpdateAsyncAction(newTodo));
	}
	getDay (createdTime) {
		createdTime = createdTime.replace("T", " ");
		createdTime = createdTime.replace("Z", " ");
		const index = createdTime.indexOf('.');
		return createdTime.substring(0, index);
	}
	getCreatedTimeJsx() {
		if(this.props.createdTime){
			if(isMobile) {
				return (
					<div>
						<small>
							{this.getDay(this.props.createdTime)}
						</small>
					</div>
				);
			}
			else {
				return ` - ${this.getDay(this.props.createdTime)}`				
			}			
		}
		else return null;
	}
	render() {
		return (
			<li key={this.props.id} id={this.props.id} className="list-group-item">
				<input 
				style={{transform: 'scale(1.75)'}} 
				checked={this.props.isCompleted} type="checkbox" 
					id={this.props.id} onChange={(e) => { this.onCheckClick(e); }} 
				/>
				&nbsp; Done &nbsp;
				<button type="button" className="btn  btn-success" onClick={this.onDeleteClick}>Delete</button>
				&nbsp; {this.props.taskDescription}
				{this.getCreatedTimeJsx()}
			</li>
		);
	}	
}

export default TodoItem;
