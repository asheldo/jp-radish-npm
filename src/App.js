import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import * as RxDB from 'rxdb';
import {QueryChangeDetector} from 'rxdb';
import { schema } from './schema';

import * as roots from './pokorny-roots';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';

import * as moment from 'moment';


QueryChangeDetector.enable();
QueryChangeDetector.enableDebugging();

RxDB.plugin(require('pouchdb-adapter-idb'));
RxDB.plugin(require('pouchdb-adapter-http'));

const syncURL = 'http://localhost:5984/';
const dbName = 'pokornyx17121101';

// const indogermDbName = 'pokorny17112501';
// piememoroots17102401 piekeys17102401
class Words extends Component {
    render() {
	const onClickWord = this.props.onClickWord;
	const onClick = this.onClickWord;
	return this.props.words.map(
	    ({id, ieLang, ieWords}) => {
		return (<Word key={id} id={id}
			ieLang={ieLang} ieWords={ieWords}
			onClickWord={onClickWord} />)
	    });
    }
}

class Word extends Component {
    render() {
		const date = moment(this.props.id, 'x').fromNow();
		return (
			<div key={this.props.id}>
			<p>
			({this.props.ieLang})&nbsp;
			<span>{this.props.ieWords} ... {date}</span>
			<a href='' onClick={this.props.onClickWord}>&gt;&gt;</a>
			</p>
			</div>
		);	    
    }

    
}

class App extends Component {

    constructor(props) {
	super(props);
	// db, indogermDb
	this.state = {
	    newWord: '',
	    words: [],
	    ieLinks: new Map()
	};
	this.subs = [];
	this.addWord = this.addWord.bind(this);
	this.handleChangeLang = this.handleChangeLang.bind(this);
	this.handleChangeWords = this.handleChangeWords.bind(this);
	this.handleWordProcessor = this.handleWordProcessor.bind(this);
    }

    async indogermDatabase() {
	/*
	const db = await RxDB.create(
	    {name: indogermDbName,
	     adapter: 'idb'
	    }
	);
	console.dir(db);
//	const 
	return db;
	*/
    }
    
    async createDatabase() {
	// password must have at least 8 characters
	const db = await RxDB.create(
	    {name: dbName,
	     adapter: 'idb',
	     password: '12345678'}
	);
	console.dir(db);
	// show who's the leader in page's title
	db.waitForLeadership().then(() => {
	    document.title = '♛ ' + document.title;
	});
	// create collection
	const wordsCollection = await db.collection({
	    name: 'words',
	    schema: schema
	});
	// set up replication
	this.setupReplication(wordsCollection);
	return db;
    }

    setupReplication(collection) {
	const replicationState = collection.sync({
	    remote: syncURL + dbName + '/' });
	this.subs.push(
	    replicationState.change$.subscribe(
		change => {
		    toast('Replication change');
		    console.dir(change)
		})
	);
	this.subs.push(
	    replicationState.docs$.subscribe(
		docData => console.dir(docData))
	);
	this.subs.push(
	    replicationState.active$.subscribe(
		active => toast(`Replication active: ${active}`))
	);
	this.subs.push(
	    replicationState.complete$.subscribe(
		completed => toast(`Replication completed: ${completed}`))
	);
	this.subs.push(
	    replicationState.error$.subscribe(
		error => {
		    toast('Replication Error');
		    console.dir(error)
		})
	);
    }
    
    async componentDidMount() {
	this.db = await this.createDatabase();
	// Subscribe to query to get all documents
	const sub = this.db.words.find().sort({id: 1}).$.subscribe(
	    words => {
		if (!words)
		    return;
		toast('Reloading words');
		this.setState({words: words});
	    });
	this.subs.push(sub);
	// iew
	// this.indogermDb = await this.indogermDatabase();
    }

    componentWillUnmount() {
	// Unsubscribe from all subscriptions
	this.subs.forEach(sub => sub.unsubscribe());
    }

    render() {
	const linksContent = this.renderAndBuildLinks();	
	const newLang = this.state.newLang;
	const newWords = this.state.newWords;
	const onChangeLang = this.handleChangeLang;
	const onChangeWords = this.handleChangeWords;
	const onClick = this.addWord;
	const wordsContent = this.state.words;
	const onClickWord = this.handleWordProcessor;
	return (
		<div className="App">
		<ToastContainer autoClose={3000} />
		<div className="App-header">
		<img src={logo} className="App-logo" alt="logo" />
		<h2>JPokornyX</h2>
		</div>

		<Words words={wordsContent} onClickWord={onClickWord} />
	    
		<hr/>
		
		<div id="add-word-div">
		<h3>Add Word</h3>
		<input type="text" value={newLang} onChange={onChangeLang} placeholder="language" />
		<input type="text" value={newWords} onChange={onChangeWords} placeholder="words" />
		<button onClick={onClick}>Add word</button>
		</div>

		<div>{linksContent}</div>
		
		</div>
	);
    }

    renderAndBuildLinks() {
	const links = this.state.ieLinks.get(this.newWords);
	return links==null ? (<div>...</div>) : links.map(
	    ({id, engl, germ, content, word, line}) => {
		return (
			<div key={id}>({id}) {engl} ... {line}</div>
		);
	    }
	);
    }

    handleWordProcessor(event) {
	event.preventDefault();
	this.setState({ieLinks: new Map()});
    }
    
    handleChangeWords(event) {
	this.setState({newWords: event.target.value});
    }

    handleChangeLang(event) {
	this.setState({newLang: event.target.value});
    }

    async addWord() {
	const id = Date.now().toString();
	const newWord = {
	    id,
	    ieLang: this.state.newLang,
	    ieWords: this.state.newWords
	};
	await this.db.words.insert(newWord);	
	this.setState({newLang: '', newWords: ''});
    }

}

export default App;
