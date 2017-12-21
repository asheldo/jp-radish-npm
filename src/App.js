import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
// for pokorny roots db
import * as roots from './pokorny-roots';
import * as rootParser from './pokorny-root-parser';
import * as rootSearch from './pokorny-root-search';
import * as language from './pokorny-language';

import * as RxDB from 'rxdb';
import {QueryChangeDetector} from 'rxdb';
import { schema } from './schema';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';
import * as moment from 'moment';
import Autosuggest from 'react-autosuggest';

QueryChangeDetector.enable();
QueryChangeDetector.enableDebugging();

RxDB.plugin(require('pouchdb-adapter-idb'));
RxDB.plugin(require('pouchdb-adapter-http'));

const syncURL = 'http://localhost:5984/';
// vs. the indogermanishes etymologisches worterbuch = pokorny17112501
const dbName = 'pokornyx17121101';
// const indogermDbName = 'pokorny17112501';
// piememoroots17102401 piekeys17102401

const languages = language.languagesValAndName();

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
		console.log(contentVal.substring(0,20));
		// console.log(map);
		const id = ieWordsKey;
		const parts = contentVal.split(":");
		const engl = parts[2];
		const last = parts[parts.length-1];		
		contents = (
			<div key={id}
		    className="App-root-table-scroll"
		    dangerouslySetInnerHTML={{__html: contentVal}} />);
		return;
   	    });			
	    return contents; // (<div>{areas}</div>);
	}
    }
}

class LinksList extends Component {
    render() {
	const map = this.props.wordsAndLinksList;
	if (map == null) {
	    return (<select></select>);
	} else {
	    const onChange = this.props.onChange(map);
	    console.log(map.keys());
	    const options = [];
	    // options[0] = (<option key="0" value=""></option>);
	    map.forEach((contentVal, ieWordsKey, map) => {
		options[options.length] =
		    (<option key={options.length} value={ieWordsKey}>
		     {options.length+1}: {ieWordsKey}
		     </option>)
	    });
	    return (<select onChange={onChange}>{options}</select>);
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
		<a href='' onClick={this.props.onClickWord}>&lt;&lt;</a>
		({this.props.ieLang})&nbsp;
		<span>{this.props.ieWords} ... {date}</span>
		</p>
		</div>
	);	    
    }
}
    
// Auto-suggest
class Language extends Component {
    constructor(props) {
	super(props);
	// Autosuggest is a controlled component.
	// This means that you need to provide an input value
	// and an onChange handler that updates this value (see below).
	// Suggestions also need to be provided to the Autosuggest,
	// and they are initially empty because the Autosuggest is closed.
	this.state = {
	    value: '',
	    suggestions: []
	};
    }
    onChange = (event, { newValue }) => {
	this.setState({ value: newValue });
	this.props.onChangeLanguage(event);
    };
    // Teach Autosuggest how to calculate suggestions for any given input value.
    getSuggestions(value) {
	const inputValue = value == null ? "" : value.trim().toLowerCase();
	const inputLength = inputValue.length;	
	return inputLength === 0 ? []
	    : languages.filter(
		lang =>
		    lang.name.toLowerCase().slice(0, inputLength)
		    === inputValue
		    || lang.val.toLowerCase().slice(0, inputLength)
		    === inputValue);
    }
    // When suggestion is clicked, Autosuggest needs to populate the input
    // based on the clicked suggestion. Teach Autosuggest how to calculate the
    // input value for every given suggestion.

    // Autosuggest will call this every time you need to update suggestions.
    // You already implemented this logic above, so just use it.
    onSuggestionsFetchRequested = ({ value }) => {
	this.setState({ suggestions: this.getSuggestions(value) });
    };
    // Autosuggest will call this every time you need to clear suggestions.
    onSuggestionsClearRequested = () => {
	this.setState({ suggestions: [] });
    };
    // Use your imagination to render suggestions.
    renderSuggestion(suggestion) {
	return (<div>{suggestion.val} ({suggestion.name})</div>);
    }
    getSuggestionValue(suggestion) { return suggestion.val; }
    //
    render() {
	const { value, suggestions } = this.state;
	// Autosuggest will pass through all these props to the input.
	const inputProps = { placeholder: 'Type a language',
			     value, onChange: this.onChange };
	// Finally, render it!
	return (
		<Autosuggest
            suggestions={suggestions}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            getSuggestionValue={this.getSuggestionValue}
            renderSuggestion={this.renderSuggestion}
            inputProps={inputProps}
		/>
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
	    searchLimit: 2,
	    ieLinks: new Map(),
	    ieLinksList: new Map()
	};
	this.subs = [];
	this.addWord = this.addWord.bind(this);
	this.handleChangeLang = this.handleChangeLang.bind(this);
	this.handleChangeWords = this.handleChangeWords.bind(this);
	this.handleChangeLink = this.handleChangeLink.bind(this);
	this.handleWordProcessor = this.handleWordProcessor.bind(this);
	this.handleWordLink = this.handleWordLink.bind(this);
    }

    async indogermDatabase() {
	const db = null;
	roots.syncAndConnect()
	    .then((info) => this.rootDatabaseConnected = 1)
	    .catch((err) => console.log(err));
	// await RxDB.create({name: indogermDbName, adapter: 'idb'});
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
	const sub = this.db.words.find().sort({id: 1})
	      .$.subscribe(
		  words => {
		      if (!words)
			  return;
		      toast('Reloading words');
		      this.setState({words: words.reverse()});
		  });
	this.subs.push(sub);
	this.indogermDatabase();
    }

    componentWillUnmount() {
	// Unsubscribe from all subscriptions
	this.subs.forEach(sub => sub.unsubscribe());
    }

    render() {
	const ieLinks = this.state.ieLinks;
	const ieLinksList = this.state.ieLinksList;
	const newLang = this.state.newLang;
	const newWords = this.state.newWords;
	const onChangeLang = this.handleChangeLang;
	const onChangeWords = this.handleChangeWords;
	const wordsContent = this.state.words;
	const onClickWord = this.handleWordProcessor;
	const onClickAdd = this.addWord;
	const onClickTest = this.handleWordLink;
	const onChangeLink = this.handleChangeLink;
	const limitOptions = [1,2,3,4,5].map(
	    (i) => (<option key={i} value={i}>{i}</option>));
	return (
		<div className="App">
		
		<ToastContainer autoClose={3000} />
		<div className="App-header">
		<img src={logo} className="App-logo" alt="logo" />
		<h2>JPokornyX</h2>
		</div>

	        <table width="100%"><tbody><tr>
		<td width="50%">
	        <table width="100%"><tbody><tr>
		<td></td>
		<td><h3>PIE Root</h3></td>
		<td><LinksList wordsAndLinksList={ieLinksList}
	    onChange={onChangeLink}/></td>		
		</tr><tr><td colSpan="3">
		<Links wordsAndLinks={ieLinks} />
		</td></tr></tbody></table>
		</td>

		<td width="50%" style={{verticalAlign:'top'}}>
		<div className="add-word-div">
		<h3>Add Word</h3>		
		<table width="100%"><tbody><tr>
		<td style={{verticalAlign:"top", textAlign:"right"}}>
		<Language onChangeLanguage={onChangeLang} /></td>
		<td style={{verticalAlign:"top", textAlign:"left"}}>
		<input type="text" value={newWords} style={{width:'30em'}}
	    onChange={onChangeWords} placeholder="words" />
		<br/>
		<button onClick={onClickAdd}>Add word</button>
		<button onClick={onClickTest}>&gt;&gt; Test</button></td>
		</tr></tbody></table>
		
		</div>		
		<hr/>
		
		<table width="100%"><tbody><tr><td>
		Limit:<br/><select>{limitOptions}</select>
		</td><td>
		<Words words={wordsContent} onClickWord={onClickWord} /></td>
		</tr></tbody></table>
		
		</td>
		</tr></tbody></table>
		
		<hr/>

		</div>
	);
    }

    handleChangeLink(map) {
	return (event) => {
	    const oneMap = new Map();
	    const key = event.target.value;
	    const content = map.get(key);
	    oneMap.set(key, content);
	    this.setState({ieLinks: oneMap});
	}
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

    // like handleWordProcessor(ieWords);
    handleWordLink(event) {
	event.preventDefault();
	const ieWords = this.state.newWords; // words;
	// console.log("310: " + ieWords);
	this.fetchPokornyRoots(ieWords);
    }    

    handleWordProcessor(ieWords) {
	return (event) => {
	    event.preventDefault();
	    this.fetchPokornyRoots(ieWords);
	}
    }

    fetchPokornyRoots(ieWords) {
	const wordDefinitions = ieWords.split(";");
	var allwords = [];
	wordDefinitions.forEach((wordDef) => {
	    wordDef.split("=").forEach(
		(token) => allwords[allwords.length] = [wordDef, token]);
	});
	const rootSetResolves = allwords.map(async ([wordDef, token]) => {
	    var rootSet = [];
	    try {
		// console.log("352: " + token);
		rootSet = await this.fetchRoot(token);
	    } catch (err) {
		try {
		    rootSet = await this.fetchRoot(token + "*");
		} catch (err) {
		    try {
			rootSet = await this.searchRoots(wordDef);
		    } catch (err) {
			console.log("nothing found");
		    }
		}
	    }
	    return rootSet;
	});
	this.setRootContent(ieWords, rootSetResolves);
	console.log("354: " + rootSetResolves.length);
    }

    setRootContent(ieWords, rootSetResolves) {
	Promise.all(rootSetResolves).then((rootSets) => {
	    // console.log(results);
	    const mapOne = new Map();
	    const mapMore = new Map();
	    rootSets.forEach((rootSet) => {
		if (rootSet) {
		    console.log(rootSet.length);
		    rootSet.forEach((root) => {
			if (root && root.length) {
			    console.log(root);
			    const rootId = root[0];
			    const content = root[1];
			    mapMore.set(rootId, content);
			    if (mapOne.size == 0) {
				mapOne.set(ieWords, content);
				this.setState({ieLinks: mapOne});
			    }
			}
		    });
		}
	    });
	    this.setState({ieLinksList: mapMore});
	});
    }
    
    async fetchRoot(proposed) {
	let rootId = proposed;
	const remoteDatabase = roots.database();
	const result = await remoteDatabase.get(rootId);
	const content = rootParser.parseContent(result.content);
	const results = [[rootId, content]];
	return results;
    }

    
    async searchRoots(words) {
	const db = roots.database();
	const results = await rootSearch.search(db, words,
					       this.state.searchLimit);
	if (results && results.length) {
	    return results.map((result) => {
		const content = rootParser.parseContent(result.content);
		return [result._id, content];
	    });
	}
	return [];
    }    
}

export default App;
