import React from "react";
import PropTypes from "prop-types";
import tracer from '../common/Tracer';
import TodoItem from './todoItem';
import firestoreManager from '../common/FirestoreManager';
import ComponentUtil from '../common/ComponentUtil';

const ESCAPE_KEY = 27;
const ENTER_KEY  = 13;

const TODO_ITEMS_COLLECTION_NAME = 'todoItems';

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
	};
	constructor(props) {

		super(props);
		this.name = "TodoItems";
		tracer.log('constructor', this);
    }
    componentDidMount() {

		this.loadToDoItemsFromDatabase();
	}
	updateToDo = (todo) => {

		ComponentUtil.setIsLoading(this, true);
		firestoreManager.updateRecord(TODO_ITEMS_COLLECTION_NAME, todo)
			.then(() => {
				this.loadToDoItemsFromDatabase();
			}).catch((error) => {
				tracer.error(error);
			})
			.then(() => {
				ComponentUtil.setIsLoading(this, false);
			});
	}
	// https://firebase.google.com/docs/firestore/manage-data/add-data
	addToDo = (todo) => {
		
		ComponentUtil.setIsLoading(this, true);
		firestoreManager.addRecord(TODO_ITEMS_COLLECTION_NAME, todo)
			.then(() => {
				this.loadToDoItemsFromDatabase();
			}).catch((error) => {
				tracer.error(error);
			})
			.then(() => {
				ComponentUtil.setIsLoading(this, false);
			});
	}
	// https://firebase.google.com/docs/firestore/manage-data/delete-data
	deleteToDo = (id) => {

		ComponentUtil.setIsLoading(this, true);
		firestoreManager.deleteRecord(TODO_ITEMS_COLLECTION_NAME, id)
			.then(() => {
				this.loadToDoItemsFromDatabase();
			}).catch((error) => {
				tracer.error(error);
			})
			.then(() => {
				ComponentUtil.setIsLoading(this, false);
			});
	}
	loadToDoItemsFromDatabase = () => {

		ComponentUtil.setIsLoading(this, true);
		firestoreManager.loadDataFromTable(TODO_ITEMS_COLLECTION_NAME, 'createdAt').then((items) => {			
			
			ComponentUtil.forceRefresh(this, { todoItems: items} );
			ComponentUtil.setIsLoading(this, false);
		});
	}
    handleSubmit = () => {

		var description = this.state.editText.trim();
		if(description) {
			this.addToDo({ description, isCompleted: false, createdAt: firestoreManager.now() });
            this.setState({editText: ''}); // Also trigger a refresh
		}
	}
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
			&nbsp;&nbsp;			
			<input type="checkbox" style={{transform: 'scale(1.75)'}} id="chkShowDate"
				  checked={this.state.showDate} onChange={this.onShowDateCheckboxClick} 
				/> Show Date
		</div>;
    }
    onShowDateCheckboxClick = (e) => {

		ComponentUtil.forceRefresh(this, { showDate: e.target.checked });
	}
    handleChange = (event) => {

		this.setState({ editText: event.target.value });
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
    render() {

		// tracer.log(`render() timeStamp:${this.state.timeStamp}`, this);
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
                this.state.timeStamp: {this.state.timeStamp} 
			</section>
		); 
	}
}
export default TodoItems;