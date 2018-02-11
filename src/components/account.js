import React, { Component } from 'react'

import '../App.css'
import { allRootsLink } from '../page-elements'

import { databases, DBSubscription } from '../db/rxdb-utils'
import { translationsDBName, translationsCollections,
	 wordsDBName, wordsCollections } from '../db/schema'
import history from '../history'

export class Account extends Component {

    constructor(props) {
	super(props);
	this.state = {
	};
	// this.fetchPokornyRoots = this.fetchPokornyRoots.bind(this);
    }
    
    async componentDidMount() {
	const completion = () => {
	    this.setState({
		db: [] // roots.
	    });
	    console.log("db " + this.state.db);
	};
    }

    componentWillUnmount() {
    }

    render() {
	// A: simple create locally and connect?
	// New Recipe B. (versus createDatabase)
	// const history = this.props.junction.?.navigation.history
	const translationsSubscribed = (docs) => {
	    this.setState({translations: docs,
			   dbUser: this.state.username});
	    sessionStorage.setItem('username', this.state.username)
	    console.dir(sessionStorage.getItem('username'))
	    // Now back to main
	    history.push('/')
	}
	const wordsSubscribed = async (docs) => {
	    this.setState({words: docs});
            const name = translationsDBName + this.state.username;
	    if (databases[name]) {
		console.dir(name)
	    } else {
		const db = await new DBSubscription(translationsSubscribed)
		      .newDbFromTemplate(this.state.username,
					 translationsDBName,
					 translationsCollections,
					 () => {}, "w ")
		databases[name] = db
	    }
	}
	const createAccount = async () => {
            const name = wordsDBName + this.state.username;
	    if (databases[name]) {
		console.dir(name)
	    } else {
		const db = await new DBSubscription(wordsSubscribed)
		    .newDbFromTemplate(this.state.username,
				       wordsDBName,
				       wordsCollections,
				       () => {}, "t ")
		databases[name] = db
	    }
	}
	return (<div><input value={this.state.username}
		onChange={ event =>
			   this.setState({username: event.target.value})}/>
		<button onClick={createAccount}>login</button>
		</div>)
    }
}
