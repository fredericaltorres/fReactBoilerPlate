import React from "react";
import PropTypes from "prop-types";
import tracer from '../common/Tracer';
import TodoItem from './todoItem';
import Button from './Button';
import Checkbox from './Checkbox';
import firestoreManager from '../common/FirestoreManager';
import ComponentUtil from '../common/ComponentUtil';
import { ESCAPE_KEY, ENTER_KEY } from '../common/ComponentUtil';
import ToDo from './todo';
import Tracer from "../common/Tracer";

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
	monitorToDoItemsCollection() {

		firestoreManager.monitorQuery(
			ToDo.getCollectionName(),
			(records) => { 
				Tracer.log(`collection ${ToDo.getCollectionName()} change detected`);
				ComponentUtil.forceRefresh(this, { todoItems: records, isLoading: false } ); 
			}, 
			'createdAt', this.state.todoOrderDirection
		);
	}
	stopMonitorToDoItemsCollection() {

		firestoreManager.stopMonitorQuery(ToDo.getCollectionName());
	}
	componentDidMount() {
		
		firestoreManager.monitorQuery(
			USER_NOTIFICATION_COLLECTION_NAME,
			(records) => { ComponentUtil.forceRefresh(this, { userNotifications : records } ); }, 
			'timestamp' 
		);	
		this.monitorToDoItemsCollection();
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
	
	// Update multiple todo using an array of promise, each promise
	// Update one todo. Do not use the batch mode here
	markAllAsCompleted = (isCompleted) => {

		this.stopMonitorToDoItemsCollection();
		return ComponentUtil.executeAsBusy(this,
			() => {
				const promises = [];
				this.state.todoItems.forEach((todo) => {
					todo.isCompleted = isCompleted;
					promises.push(ToDo.update(todo));
				});
				return Promise.all(promises);
			},
			() => {
				this.monitorToDoItemsCollection();
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

		this.stopMonitorToDoItemsCollection();
		ComponentUtil.executeAsBusy(this,
			() => {
				const batch = firestoreManager.startBatch();
				this.state.todoItems.forEach((todo) => {
					ToDo.delete(todo.id);
				});
				return firestoreManager.commitBatch(batch);
			},
			() => {
				this.monitorToDoItemsCollection();
			}
		);
	}
	generateData = () => {

		const maxDefaultValue = 10;
		const maxAsString = prompt('How many todo do you want to create?', maxDefaultValue.toString());
		if(maxAsString === null) 
			return;

		let max = parseInt(maxAsString);
		if(max > maxDefaultValue) {
			max = maxDefaultValue;
			alert(`Cannot create this number of records, max value is ${max}`);
		}

		this.stopMonitorToDoItemsCollection();
		ComponentUtil.executeAsBusy(this,
			() => {
				Tracer.log(`Creating ${max} todo items...`, this);
				const batch = firestoreManager.startBatch();
				const maxOrder = ToDo.getMaxOrder(this.state.todoItems);
				for(let i = 0; i < max; i++) {
					ToDo.add(ToDo.create(`To do ${i} . . .`, maxOrder + i ));
				}
				return firestoreManager.commitBatch(batch);
			},
			() => {
				this.monitorToDoItemsCollection();
			}
		);
	}
	
	// --- Jsx Generation ---

	getAddButtonAlertJsx = (isLoading, render = true) => {

		if(!render) return null;

		const message = isLoading ? "Busy . . . " : "Ready . . . ";
		let className = isLoading ? "btn btn-outline-warning" : "btn btn-outline-primary";

		return <div>
			<Button isLoading={isLoading} text="Add" onClick={this.handleSubmit} />
			&nbsp;
			<Button isLoading={isLoading} text={`Sort ${
				firestoreManager.orderDirectionIcon(
					firestoreManager.invertOrderDirection(this.state.todoOrderDirection)
				)
				}`} onClick={this.revertToDoItemsSortOrder} />
			&nbsp;
			<Button isLoading={isLoading} text="All Done" onClick={this.markAllAsDone} />
			&nbsp;
			<Button isLoading={isLoading} text="Reset All" onClick={this.markAllAsNotDone} />
			&nbsp;
			<Button isLoading={isLoading} text="Delete All" onClick={this.deleteAll} />
			&nbsp;
			<Button isLoading={isLoading} text="Generate Data" onClick={this.generateData} />
			&nbsp;
			<br/>
			<Button isLoading={isLoading} text="Google Login" onClick={this.googleLogin} />
			&nbsp; &nbsp;
			<Checkbox
				isLoading={isLoading}
				text="Show Date"
				checked={this.state.showDate} 
				onChange={this.onShowDateCheckboxClick} 
			/>
		</div>;
	}
	renderToDoItemToJsx = (todoItem) => {

		return <TodoItem 
			id={todoItem.id}
			order={todoItem.order}
			createdAt={todoItem.createdAt}
			description={todoItem.description} 
			isCompleted={todoItem.isCompleted}
			key={todoItem.id}
			updateToDo={ToDo.update}
			deleteToDo={ToDo.delete}
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
			ToDo.add(ToDo.create(description, ToDo.getMaxOrder(this.state.todoItems)+1))
			.then(() => {
				this.clearDescriptionToDoTextBox();
			});
			
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
		this.monitorToDoItemsCollection();
	}
	render() {

		Tracer.log(`render isLoading:${this.state.isLoading}`, this);
		const statusMessage = this.state.isLoading ? "Busy... " : `${this.state.todoItems.length} todo. Ready...`;
		let statusClassName = this.state.isLoading ? "alert alert-warning" : "alert alert-success";

		return (
			<div>
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
					{/* MaxOrder: { ToDo.getMaxOrder(this.state.todoItems)} */}
					{/* &nbsp; --  */}
					Logged on user: {firestoreManager.getCurrentUser() ? firestoreManager.getCurrentUser().displayName: 'None'}<br/>
					Try	the app from 2 different browsers.<br/>
					<a target="top" href="https://github.com/fredericaltorres/fReactBoilerPlate">Source Code</a>
				</small>
			</div>
		); 
	}
}
export default TodoItems;
