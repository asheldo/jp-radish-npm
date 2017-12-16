import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
// for pokorny roots db
import * as roots from './pokorny-roots';
import * as rootParser from './pokorny-root-parser';

import * as RxDB from 'rxdb';
import {QueryChangeDetector} from 'rxdb';
import { schema } from './schema';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';
import * as moment from 'moment';

QueryChangeDetector.enable();
QueryChangeDetector.enableDebugging();

RxDB.plugin(require('pouchdb-adapter-idb'));
RxDB.plugin(require('pouchdb-adapter-http'));

const syncURL = 'http://localhost:5984/';
// vs. the indogermanishes etymologisches worterbuch = pokorny17112501
const dbName = 'pokornyx17121101';
// const indogermDbName = 'pokorny17112501';
// piememoroots17102401 piekeys17102401

class Links extends Component {
    render() {
	const map = this.props.wordsAndLinks;
	if (map == null) {
	    return (<div
		    className="App-root-table-scroll"
		    dangerouslySetInnerHTML={{__html: '<pre>...</pre>'}} />);

	} else {
	    console.log("31: " + map.size);
	    var contents = (<div>...</div>);
	    map.forEach((contentVal, ieWordsKey, map) => {
		// console.log("37: " + contentVal);
		console.log(contentVal);
		// console.log(map);
		const id = ieWordsKey;
		const parts = contentVal.split(":");
		const engl = parts[2];
		const last = parts[parts.length-1];		
		contents = (
			<div key={id}
		    className="App-root-table-scroll"
		    dangerouslySetInnerHTML={{__html: contentVal}} />);
   	    });			
	    return contents; // (<div>{areas}</div>);
	}
    }
}

class Words extends Component {
    render() {
	const wordProcess = this.props.onClickWord;
	const words = this.props.words;
	return words.map(
	    ({id, ieLang, ieWords}) => {
		console.log("34: " + ieWords);
		const wordProcessOne = wordProcess(ieWords);
		return (<Word key={id} id={id}
			ieLang={ieLang} ieWords={ieWords}
			onClickWord={wordProcessOne} />)
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
	const db = null;
	roots.syncAndConnect()
	    .then((info) => {
		// this.indogermDb = roots.database();
		this.rootDatabaseConnected = 1;
	    })
	    .catch((err) => {
		console.log(err);
	    });
	// await RxDB.create({name: indogermDbName, adapter: 'idb'});
	console.dir("indogerm");
	// return db;	
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
	// this.indogermDb = await
	this.indogermDatabase();
    }

    componentWillUnmount() {
	// Unsubscribe from all subscriptions
	this.subs.forEach(sub => sub.unsubscribe());
    }

    render() {
	// const linksContent = this.renderAndBuildLinks();
	const ieLinks = this.state.ieLinks;
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

	        <table width="100%"><tbody><tr><td>
		<Links wordsAndLinks={ieLinks} /></td>

		<td>
		<Words words={wordsContent} onClickWord={onClickWord} />
		</td></tr></tbody></table>
		
		<hr/>
		
		<div id="add-word-div">
		<h3>Add Word</h3>
		<input type="text" value={newLang} onChange={onChangeLang} placeholder="language" />
		<input type="text" value={newWords} onChange={onChangeWords} placeholder="words" />
		<button onClick={onClick}>Add word</button>
		</div>

		</div>
	);
    }

    renderAndBuildLinks() {
	const links = this.state.ieLinks; // .get(this.newWords);
	console.log("201: " + links.size);
	if (links == null) {
	    return (<div>...</div>);
	} else {
	    const contents = [];
	    links.forEach((content, ieWords, map) => {
		const id = ieWords;
		const parts = content.split(":");
		const engl = parts[2];
		const line = parts[parts.length-1];		
		contents[contents.length] 
		    = (<div key={id}>({id}) {engl} ... {line}</div>);
		// (<div dangerouslySetInnerHTML={{__html: data}} />);
	    });
	    return contents;
	}
    }
/*	
	      : links.forEach((ieWords, content, map) => {
		  return ieWords;
	      });
*/
	      // : (<div>{links}</div>);
	  /*  : links.forEach((ieWords, content, map) => {
		const id = ieWords;
		const parts = content.split(":");
		const engl = parts[2];
		const line = parts[parts.length-1];		
		return (
			<div key={id}>({id}) {engl} ... {line}</div>
		);
	    });
	  */
//	return (<div>Links<br/> {contents}</div>)


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

    handleWordProcessor(ieWords) {
	return (event) => {
	    event.preventDefault();
	    this.fetchPokornyRoots(ieWords);
	}
    }

    fetchPokornyRoots(ieWords) {
	const re = ";";
	const words = ieWords.split(re);
	console.log("240: " + words);
	words.forEach((word) => {
	    if (this.rootsDatabaseConnected)
		console.log("rootsDatabaseConnected");
	    const tokens = word.split("=");
	    tokens.forEach((token) => {
		const results = [];
		this.fetchRoot(token, results)
		    .then((info) => {
			console.log("255: " + results.length);
			this.setRootContent(ieWords, results);
		    });
	    });
	});
    }

    setRootContent(ieWords, results) {
	results.forEach((result) => {
	    // map = ieLinks ?
	    const rootId = result[0];
	    const content = result[1];
	    const map = new Map();
	    map.set(ieWords, content);
	    console.log("257: " + content.substring(0, 50));
	    // if (ieLinks.size > 0) {
	    this.setState({ieLinks: map});
	    return;
	});
    }
    
    fetchRoot(proposed, results) {
	let rootId = proposed;
	const remoteDatabase = roots.database();
	return remoteDatabase.get(rootId)
	    .then( (result) => {
		const content = rootParser.parseContent(result.content);
		results[results.length] = [rootId, content];
		// return content;
		// outParsed.innerHTML = content;
	    }).catch((err) => {
		console.log(err);
		rootId = rootId + "*";
		return remoteDatabase.get(rootId).then( function(result) {
		    const content = rootParser.parseContent(result.content);
		    results[results.length] = [rootId, content];
		    console.log("289");
		    console.log(results);
		    // return content;
		    // outParsed.innerHTML = content;
		}).catch(function(err) {		    
		    console.log("Get failed");
		});
		// return "";
	    });
    }

    
}

export default App;
