import React from "react";
import PropTypes from "prop-types";
import tracer from '../common/Tracer';

import TodoItem from './todoItem';
import Button from './Button';

import firestoreManager from '../common/FirestoreManager';
import {DEFAULT_MAX_RECORD} from '../common/FirestoreManager';

import ComponentUtil from '../common/ComponentUtil';
import ToDo from './todo';
import { ESCAPE_KEY, ENTER_KEY } from '../common/ComponentUtil';
import Tracer from "../common/Tracer";

const TODO_ITEMS_COLLECTION_NAME = 'todoItems';
const USER_NOTIFICATION_COLLECTION_NAME = 'userNotifications'; 

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
		todoOrderDirection: 'desc',
	};
	constructor(props) {

		super(props);
		this.name = "TodoItems";
		tracer.log('constructor', this);
	}
	monitorToDoItemCollection() {

		firestoreManager.monitorQuery(
			TODO_ITEMS_COLLECTION_NAME,
			(records) => { 
				ComponentUtil.forceRefresh(this, { todoItems: records, isLoading: false } ); }, 
			'createdAt', this.state.todoOrderDirection
		);			
	}
	stopMonitorToDoItemCollection() {

		firestoreManager.stopMonitorQuery(TODO_ITEMS_COLLECTION_NAME);
	}
	componentDidMount() {
		
		firestoreManager.monitorQuery(
			USER_NOTIFICATION_COLLECTION_NAME,
			(records) => { ComponentUtil.forceRefresh(this, { userNotifications : records } ); }, 
			'timestamp' 
		);	
		this.monitorToDoItemCollection();
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
	
		return firestoreManager.updateRecord(TODO_ITEMS_COLLECTION_NAME, todo);
	}
	addToDo = (todo) => {

		if(firestoreManager.batchModeOn) {

			firestoreManager.addRecord(TODO_ITEMS_COLLECTION_NAME, todo);
		}
		else {

			firestoreManager.addRecord(TODO_ITEMS_COLLECTION_NAME, todo)
				.then(() => {
					this.clearDescriptionToDoTextBox();
				})			
		}
	}
	deleteToDo = (id) => {

		return firestoreManager.deleteRecord(TODO_ITEMS_COLLECTION_NAME, id);
	}
	markAllAsCompleted = (isCompleted) => {

		return ComponentUtil.executeAsBusy(this,
			() => {
				const promises = [];
				this.state.todoItems.forEach((todo) => {
					todo.isCompleted = isCompleted;
					promises.push(this.updateToDo(todo));
				});
				return Promise.all(promises);
			}
		);					
	}
	markAllAsDone = () => {

		this.markAllAsCompleted(true);
	}
	markAllAsNotDone = () => {

		this.markAllAsCompleted(false);
	}
	deleteAll = () => {

		this.stopMonitorToDoItemCollection();
		ComponentUtil.executeAsBusy(this,
			() => {
				const batch = firestoreManager.startBatch();
				this.state.todoItems.forEach((todo) => {
					this.deleteToDo(todo.id);
				});
				return firestoreManager.commitBatch(batch);
			}
		).then(() => {
			this.monitorToDoItemCollection();
		});
	}
	generateData = () => {

		const maxDefaultValue = 16;
		const maxAsString = prompt('How many todo do you want to create?', maxDefaultValue.toString());
		if(maxAsString === null) 
			return;
		let max = parseInt(maxAsString);
		if(max > DEFAULT_MAX_RECORD) {
			max = DEFAULT_MAX_RECORD;
			alert(`Cannot create this number of records, max value is ${max}`);
		}

		this.stopMonitorToDoItemCollection();
		ComponentUtil.executeAsBusy(this,
			() => {
				console.log(`Creating ${max} todo items...`);
				const batch = firestoreManager.startBatch();
				for(let i = 0; i < max; i++) {
					this.addToDo(ToDo.create(`To do ${i} . . .`));
				}
				return firestoreManager.commitBatch(batch);
			}
		).then(() => {
			this.monitorToDoItemCollection();
		});
	}
	
	// --- Jsx Generation ---

	getAddButtonAlertJsx = (isLoading, render = true) => {

		if(!render) return null;

		const message = isLoading ? "Busy . . . " : "Ready . . . ";
		let className = isLoading ? "btn btn-outline-warning" : "btn btn-outline-primary";

		return <div>
			<Button isLoading={this.props.isLoading} text="Add" onClick={this.handleSubmit} />
			&nbsp;
			<Button isLoading={this.props.isLoading} text={`Sort ${firestoreManager.invertOrderDirection(this.state.todoOrderDirection)}`} onClick={this.revertToDoItemsSortOrder} />
			&nbsp;
			<Button isLoading={this.props.isLoading} text="All Done" onClick={this.markAllAsDone} />
			&nbsp;
			<Button isLoading={this.props.isLoading} text="Reset All" onClick={this.markAllAsNotDone} />
			&nbsp;
			<Button isLoading={this.props.isLoading} text="Delete All" onClick={this.deleteAll} />
			&nbsp;
			<Button isLoading={this.props.isLoading} text="Generate Data" onClick={this.generateData} />
			&nbsp;
			<br/>
			<Button isLoading={this.props.isLoading} text="Google Login" onClick={this.googleLogin} />

			&nbsp; &nbsp;
			<input type="checkbox" style={{transform: 'scale(1.75)'}} id="chkShowDate"
				  checked={this.state.showDate} onChange={this.onShowDateCheckboxClick} 
				/>&nbsp;Show Date
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
			return 'No notifications';
		}
		// return this.state.userNotifications.map((userNotification) => {
		// 	return <div key={userNotification.id}>{userNotification.message}</div>;
		// });
		const userNotification = this.state.userNotifications[0];
		return userNotification.message;
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
		if(description)
			this.addToDo(ToDo.create(description));
	}
	handleKeyDown = (event) => {

		if (event.which === ESCAPE_KEY) {
			this.clearDescriptionToDoTextBox();
		}
		else if (event.which === ENTER_KEY) 
			this.handleSubmit(event);
	}
	revertToDoItemsSortOrder = () => {
		
		ComponentUtil.forceRefresh(this, { 
			todoOrderDirection: firestoreManager.invertOrderDirection(this.state.todoOrderDirection), 
			isLoading: true 
		});
		setTimeout(() => {
			this.monitorToDoItemCollection();
		this.monitorToDoItemCollection();}, 10);
	}
	render() {

		Tracer.log(`render isLoading:${this.state.isLoading}`, this);
		const statusMessage = this.state.isLoading ? "Busy... " : `${this.state.todoItems.length} todo. Ready...`;
		let statusClassName = this.state.isLoading ? "alert alert-warning" : "alert alert-success";

		return (
			<section>
				<div className="input-group" style={{marginBottom:'5px'}}>
					<input
						disabled={this.props.isLoading} 
						type="text"
						className="form-control-sm mb-2 mr-sm-2" 
						style={{color:'red', width:'600px'}}
						placeholder=" Enter todo description..." className="edit" 
						value={this.state.editText} 
						onChange={this.props.isLoading ? () => {} : this.handleChange} 
						onKeyDown={this.handleKeyDown}
						ref={(input) => { this.editField = input; }} 
					/> &nbsp;

					{this.getAddButtonAlertJsx(this.state.isLoading, true)}
				</div>	

				<div className={statusClassName} role="alert">
				<strong>App Status </strong> : {statusMessage}
				</div>
				
				<ul className="list-group" style={{marginTop:'5px'}}>
					{this.renderToDoItemsToJsx(this.state.todoItems)}
				</ul>

				<div  className="alert alert-primary" role="alert">
					<strong>User Notifications</strong> : {this.renderUserNotification()}
				</div>

				<small>
				{/* timeStamp: {this.state.timeStamp} <br/> */}
				Logged on user: {firestoreManager.getCurrentUser() ? firestoreManager.getCurrentUser().displayName: 'None'}
				</small>
			</section>
		); 
	}
}
export default TodoItems;
