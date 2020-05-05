import React from 'react';

import {
	BrowserRouter as Router,
	Route,
	Switch,
	Link,
} from 'react-router-dom';

import HomePage from './home/HomePage';
import Login from './login/Login'; 
import Register from './register/Register'; 
import ProfessorHomePage from './ProfessorHomePage/PHomePage';
import ProfessorAssignments from './ProfessorAssignment/ProfessorAssignments';
import PAssignmentView from './ProfessorAssignmentView/PAssignmentView';
import StudentHomePage from './StudentHomePage/StudentHomePage';
import PSettings from './ProfessorSettings/PSettings';
import SSettings from './StudentSettings/SSettings';
import Grade from './grade/Grade'; 
import Submit from './submit/Submit'; 
import axios from 'axios';

import './App.scss';
// import { useHistory } from "react-router-dom";
class App extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			isStudent: true,
			isMenuHidden: true,
			email: '',
			typeOfUser: '',
			name: '', 
		};
	
		this.toggleMenu = this.toggleMenu.bind(this);
		this.menu = this.menu.bind(this);
		this.menuHidden = this.menuHidden.bind(this);
		this.menuStudent = this.menuStudent.bind(this);
		this.menuProfessor = this.menuProfessor.bind(this);
		this.VerifyUser = this.VerifyUser.bind(this); 
		this.VerifyUser(); 
	}
	VerifyUser(){
		
		const token = localStorage.getItem("jwtToken")
		// localStorage.clear();
		if(token){
			axios({
				method: 'get',
				url: 'https://rwlautograder.herokuapp.com/api/token/verify',
				headers: {
				  'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
				  'Authorization': token,
				}
			  }).then ( res =>{
				  if(res.data.error === false){	 
					  this.state.email = res.data.user.email; 
				  	  this.state.typeOfUser = res.data.user.type;
					  this.state.name = res.data.user.name;
					 
					  if(this.state.typeOfUser === 'professor'){
						  this.state.isStudent = false; 
					
					  }else{
						this.state.isStudent = true; 
					  }
				     
				  }
			  }).catch((error) =>{
				  if(error.response){
					console.log(error.response.data);
				  } else if (error.request){
					  console.log(error.request); 
				  }else {
					  console.log(error.message);
				  }
			  })
			
		}

	}

	toggleMenu(){
		this.setState({
			isMenuHidden: !this.state.isMenuHidden
		});
	}
	
	menuHidden(){
		return (
			<i className="material-icons" onClick={this.toggleMenu}>menu</i>
		);
	}

	menu(){
		return (
			<nav>
				{
					this.state.isStudent ? this.menuStudent() : this.menuProfessor()
				}
				<div className="closeMenu"onClick={this.toggleMenu}></div>

			</nav>
		);
	}

	menuStudent(){
		return (
				<ul className="menuContainer">
				  <li className="listItemMenu">
				  		<p>{this.state.email}</p>
				  </li>
				  <li className="listitemmenu">
					<Link to="/student/home">
						<i className="material-icons">Home</i>
						<p>Home</p>
					</Link>
				  </li>
				  <li className="listitemmenu">
					<Link to="/student/grades">
						<i className="material-icons">assessment</i>
						<p>Grades</p>
					</Link>
				  </li>
				  <li className="listitemmenu">
					<Link to="/student/settings">
						<i className="material-icons">settings</i>
						<p>Settings</p>
					</Link>
				  </li>
				</ul>
			);
	}
	menuProfessor(){
		return (
				<ul className="menuContainer">
				  <li className="listItemMenu">
				  		<p>{this.state.email}</p>
				  </li>
				  <li className="listitemmenu">
					<Link to="/professor">
						<i className="material-icons">home</i>
						<p>Home</p>
					</Link>
				  </li>
				  <li className="listitemmenu">
					<Link to="/professor/classes">
						<i className="material-icons">assignment</i>
						<p>Classes</p>
					</Link>
				  </li>
				  <li className="listitemmenu">
					<Link to="/professor/settings">
						<i className="material-icons">settings</i>
						<p>Settings</p>
					</Link>
				  </li>
				</ul>
			);
	}

	render() {
	  return (
		<Router>
			
			<div>
				 <div className="header">
					<div className={this.state.isMenuHidden?"headerContent-hidden":"headerContent"}>
						{
							this.state.isMenuHidden ? this.menuHidden() : this.menu()
						}
						<h1> {this.state.name}</h1>
					</div>
					
				</div> 

				<Switch>
					<Route exact path="/" component={Login} />
					<Route exact path="/register" component={Register} />
					<Route exact path="/professor/classes" component={ProfessorHomePage} />
					<Route exact path="/professor/settings" component={PSettings} />
					<Route exact path="/student/grades" component={HomePage} />
					<Route exact path="/student/settings" component={SSettings} />
					<Route exact path="/student/grade/:rubricID" component={Grade} />
					<Route exact path="/student/submit/:rubricID" component={Submit} />
					<Route exact path="/student" component={HomePage} />
					<Route exact path="/professor/class/:classId/assignment/create" component={ProfessorAssignments} />
					<Route exact path="/professor/assignmentsview" component={PAssignmentView} />
					<Route exact path="/professor" component={HomePage} />
					<Route exact path="/student/home" component={StudentHomePage} />
				</Switch>
			</div>
		</Router>
	  );
	}
}


export default App;
