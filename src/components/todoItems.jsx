import React from "react";
import PropTypes from "prop-types";
import tracer from '../common/Tracer';
import TodoItem from './todoItem';

const ESCAPE_KEY = 27;
const ENTER_KEY = 13;

class TodoItems extends React.PureComponent {
    static propTypes = {		
		isLoading: PropTypes.bool.isRequired,
	};
    state = {
		timeStamp: new Date().getTime(),
		editText :'',
		showDate : false,
        mqttNewMessage : null,
        isLoading: true,
        
        todoItems: [
            {
                createdTime:"2018-10-09T19:41:59.272621Z",
                taskDescription:'Description 1',
                isCompleted: false,
                id:'1'
            },
            {
                createdTime:"2018-10-09T19:41:59.272621Z",
                taskDescription:'Description 2',
                isCompleted: false,
                id:'2'
            },
            {
                createdTime:"2018-10-09T19:41:59.272621Z",
                taskDescription:'Description 3',
                isCompleted: false,
                id:'3'
            }
        ],
    };
    constructor() {
		super();
		this.name = "TodoItems";
		tracer.log('constructor', this);
    }
    forceRefresh = (otherState) => {

		const timeStamp = new Date().getTime();
		let newState = null;
		if(otherState) 
			newState = { ...this.state, ...otherState, timeStamp }
		else
			newState = { ...this.state, timeStamp }
		this.setState(newState);
	}
    componentDidMount() {
    }
    handleSubmit = () => {
		var taskDescription = this.state.editText.trim();
		if(taskDescription) {
			alert(this.state.editText);
            this.setState({editText: ''}); // Also trigger a refresh
		}		
	}
    getAddButtonAlertJsx = (isLoading, render = true) => {

		if(!render) {
			return null;
		}
		const message = isLoading ? "Busy . . . " : "Ready . . . ";
		let className = isLoading ? "btn btn-outline-warning" : "btn btn-outline-primary";
		return <div>
            <button disabled={this.props.isLoading} type="button" className="btn btn-primary" 
            onClick = {
                    this.handleSubmit
                }
            >Add</button> &nbsp;
			<button type="button" className={className}>{message}</button>			
			&nbsp;&nbsp;
			
			<input type="checkbox" style={{transform: 'scale(1.75)'}} 
					checked={this.state.showDate}
					id="chkShowDate" 
					onChange={this.onShowDateCheckboxClick} 
				/> Show Date!
		</div>;
    }
    onShowDateCheckboxClick = (e) => {

		const updateState = { showDate: e.target.checked };
		this.forceRefresh(updateState);
		this.editField.blur();
	}
    handleChange = (event) => {

		this.setState({editText: event.target.value});
    }
    renderToDoItemToJsx = (todoItem) => {
        
		let createdTime = todoItem.createdTime;
		if(!this.state.showDate)
			createdTime = null;

		return ( <TodoItem forceRefresh={this.forceRefresh}
			id={todoItem.id} 
			createdTime={createdTime}
			taskDescription={todoItem.taskDescription} 
			isCompleted={todoItem.isCompleted}			
			key={todoItem.id} 
		/> );
	}
	renderToDoItemsToJsx = (todoItems) => {

		return todoItems.map((todoItem) => {

			return this.renderToDoItemToJsx(todoItem);
		});
	}    
    render() {
		tracer.log(`render() timeStamp:${this.state.timeStamp}`, this);
		return (
			<section>
				<div className="input-group" style={{marginBottom:'5px'}}>

					<input disabled={this.props.isLoading} type="text" 
						className="form-control-sm mb-2 mr-sm-2" 
						placeholder=" Enter todo description..." className="edit" 
						value={this.state.editText} 
						onChange={this.props.isLoading ? () => {} : this.handleChange} 
						onKeyDown={this.handleKeyDown}
						ref={(input) => { this.editField = input; }} 
					/> &nbsp;
					{this.getAddButtonAlertJsx(this.props.isLoading, true)}
				</div>	
				
				<ul className="list-group" style={{marginTop:'5px'}}>
					{this.renderToDoItemsToJsx(this.state.todoItems)}
                </ul>
                this.state.timeStamp: {this.state.timeStamp} 
			</section>
		); 
	}
}
export default TodoItems;