import React, { Component } from 'react';

import '../App.css';
import { allRootsLink } from '../page-elements';

import { translationsDBName, translationsCollections } from '../schema';
import { wordsDBName, wordsCollections } from '../schema';
// import * as roots from '../pokorny-roots';
import { DBSubscription } from '../db/rxdb-utils';

export class Account extends Component {

    constructor(props) {
	super(props);
	this.state = {
	};
	// this.fetchPokornyRoots = this.fetchPokornyRoots.bind(this);
    }
    
    async componentDidMount() {
	// indogermDatabase
	const completion = () => {
	    this.setState({
		db: [] // roots.
	    });
	    console.log("db " + this.state.db);
	};
/*	roots.userDBsFromTemplate(completion)
	    .then((info) => {
		this.setState({rootDatabaseConnected: true});
		console.log("roots");
	    })
	    .catch((err) => console.log(err));
*/
    }

    componentWillUnmount() {
    }

    render() {
	const createAccount = async () => {
	    // A: simple create locally and connect?
	    // New Recipe B. (versus createDatabase)

	    // callback to sessionStorage
	    const storeUserName = () => {
		sessionStorage.setItem('username', this.state.username)
	    }
	    
	    // result of 2nd db
	    const translationsSubscribed = async (docs) => {
		this.setState({translations: docs});
		storeUserName();
		this.setState({login:true});
	    }
	    const transDB = new DBSubscription(translationsSubscribed);
	    const newTransDB =  () => {
		 transDB.newDbFromTemplate(
		    this.state.username,
		    translationsDBName,
		    translationsCollections, () => {}, "w ");
	    }
	    
	    // result of 1st db
	    const wordsSubscribed =  (docs) => {
		this.setState({words: docs});
		 newTransDB();
	    }
	    const wordsDB = new DBSubscription(wordsSubscribed);
	    await wordsDB.newDbFromTemplate(
		this.state.username,
		wordsDBName,
		wordsCollections, () => {}, "t ");
	}
	return (<div>
		<input value={this.state.username}
		onChange={ event =>
			   this.setState({username:event.target.value})}/>
		<button onClick={createAccount}>login</button>
		</div>)
    }

}
