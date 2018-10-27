import React from "react";
import PropTypes from "prop-types";
import tracer from '../common/Tracer';
import TodoItem from './todoItem';
import firestoreManager from '../common/FirestoreManager';
import ComponentUtil from '../common/ComponentUtil';
import { ESCAPE_KEY, ENTER_KEY } from '../common/ComponentUtil';

const TODO_ITEMS_COLLECTION_NAME = 'todoItems';
const USER_NOTIFICATION_COLLECTION_NAME = 'userNotifications'; 

class ToDo {
	static create(description) {
		return { description, isCompleted: false, createdAt: firestoreManager.now() }
	}	
}

class TodoItems extends React.PureComponent {

	static propTypes = {

	};
	state = {

		timeStamp: new Date().getTime(),
		editText :'',
		showDate : false,
		mqttNewMessage : null,
		isLoading: true,
		todoItems: [
			// { createdAt:"2018-10-09T19:41:59.272621Z", description:'Description 1', isCompleted: false, id:'1' },
			// { createdAt:"2018-10-09T19:41:59.272621Z", description:'Description 2', isCompleted: false, id:'2' }
		],
		userNotifications:[],
	};
	constructor(props) {

		super(props);
		this.name = "TodoItems";
		tracer.log('constructor', this);
	}
	componentDidMount() {

		firestoreManager.monitorQuery(
			USER_NOTIFICATION_COLLECTION_NAME, 
			(records) => {
				ComponentUtil.forceRefresh(this, { userNotifications : records } );
			}, 
			'timestamp'
		);
		firestoreManager.monitorQuery(
			TODO_ITEMS_COLLECTION_NAME, 
			(records) => {
				ComponentUtil.forceRefresh(this, { todoItems: records} );
			}, 
			'createdAt'
		);
	}
	// ___loadToDoItemsFromDatabase = () => {

	// 	ComponentUtil.executeAsBusy(this,
	// 		() => {
	// 			return firestoreManager.loadDataFromCollection(TODO_ITEMS_COLLECTION_NAME, 'createdAt')
	// 				.then((items) => {
	// 					ComponentUtil.forceRefresh(this, { todoItems: items} );
	// 				});
	// 		}
	// 	);
	// }
	googleLogin() {
		firestoreManager.googleLogin();
	}
	// --- Entity operations ---

	updateToDo = (todo) => {
	
		ComponentUtil.executeAsBusy(this,
			() => { return firestoreManager.updateRecord(TODO_ITEMS_COLLECTION_NAME, todo); }
		);				
	}
	addToDo = (todo) => {

		ComponentUtil.executeAsBusy(this,
			() => {
				return firestoreManager.addRecord(TODO_ITEMS_COLLECTION_NAME, todo)
						.then(() => {
							this.clearDescriptionToDoTextBox();
						})
			}
		);			
	}
	deleteToDo = (id) => {

		ComponentUtil.executeAsBusy(this,
			() => { return firestoreManager.deleteRecord(TODO_ITEMS_COLLECTION_NAME, id); }
		);
	}
	
	// --- Jsx Generation ---

	getAddButtonAlertJsx = (isLoading, render = true) => {

		if(!render) return null;

		const message = isLoading ? "Busy . . . " : "Ready . . . ";
		let className = isLoading ? "btn btn-outline-warning" : "btn btn-outline-primary";

		return <div>
			<button disabled={this.props.isLoading} type="button" className="btn btn-primary" 
					onClick = {this.handleSubmit}>Add
			</button> 
			&nbsp;
			<button type="button" className={className}>{message}</button>			

			<button disabled={this.props.isLoading} type="button" className="btn btn-primary" 
				onClick = {this.googleLogin}>Login
			</button> 

			&nbsp;&nbsp;			
			<input type="checkbox" style={{transform: 'scale(1.75)'}} id="chkShowDate"
				  checked={this.state.showDate} onChange={this.onShowDateCheckboxClick} 
				/> Show Date
		</div>;
	}
	renderToDoItemToJsx = (todoItem) => {

		return <TodoItem 
			id={todoItem.id} 
			createdAt={todoItem.createdAt}
			description={todoItem.description} 
			isCompleted={todoItem.isCompleted}
			key={todoItem.id}
			updateToDo={this.updateToDo}
			deleteToDo={this.deleteToDo}
			showDate={this.state.showDate}
		/>;
	}
	renderToDoItemsToJsx = (todoItems) => {

		return todoItems.map((todoItem) => {
			return this.renderToDoItemToJsx(todoItem);
		});
	}    
	renderUserNotification = () => {

		if(this.state.userNotifications.length === 0) {
			return <span>No notifications</span>;
		}
		return this.state.userNotifications.map((userNotification) => {
			return <li key={userNotification.id}>{userNotification.message}</li>;
		});
	}

	// --- Misc Events ---

    onShowDateCheckboxClick = (e) => {

		ComponentUtil.forceRefresh(this, { showDate: e.target.checked });
	}
	clearDescriptionToDoTextBox() {

		ComponentUtil.forceRefresh(this, { editText : '' });
	}
    handleChange = (event) => {

		ComponentUtil.forceRefresh(this, { editText : event.target.value });
	}
	handleSubmit = () => {

		var description = this.state.editText.trim();
		if(description) {
			this.addToDo(ToDo.create(description));
		}
	}
	handleKeyDown = (event) => {

		if (event.which === ESCAPE_KEY) {
			this.clearDescriptionToDoTextBox();
		}
		else if (event.which === ENTER_KEY) 
			this.handleSubmit(event);
	}
	render() {

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
					{this.getAddButtonAlertJsx(this.state.isLoading, true)}
				</div>	
				
				<ul className="list-group" style={{marginTop:'5px'}}>
					{this.renderToDoItemsToJsx(this.state.todoItems)}
				</ul>

				<hr/>
					<ul>
						{this.renderUserNotification()}
					</ul>
				<hr/>

				<small>
				timeStamp: {this.state.timeStamp} <br/>
				Logged on user: {firestoreManager.getCurrentUser() ? firestoreManager.getCurrentUser().displayName: 'None'}
				</small>
			</section>
		); 
	}
}
export default TodoItems;