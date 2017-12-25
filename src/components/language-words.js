import React, { Component } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';
import Autosuggest from 'react-autosuggest';
import * as RxDB from 'rxdb';
import { schema } from '../schema';
import { languagesValAndName } from '../pokorny-language';

RxDB.plugin(require('pouchdb-adapter-idb'));
RxDB.plugin(require('pouchdb-adapter-http'));

// vs. the indogermanishes etymologisches worterbuch = pokorny17112501
const dbName = 'pokornyx17121101';
// const indogermDbName = 'pokorny17112501';
// piememoroots17102401 piekeys17102401
const syncURL = 'http://localhost:5984/';
const languages = languagesValAndName();

// Add language/words pair, with: Auto-suggest
export class LanguageWords extends Component {
    constructor(props) {
	super(props);
	// Autosuggest is a controlled component.
	// This means that you need to provide an input value
	// and an onChange handler that updates this value (see below).
	// Suggestions also need to be provided to the Autosuggest,
	// and they are initially empty because the Autosuggest is closed.
	this.state = {
	    value: '',
	    suggestions: [],
	    newWord: '',
	    newLang: '',
	    words: [],
	};
	this.subscriptions = [];
	this.addWord = this.addWord.bind(this);
	this.handleChangeLang = this.handleChangeLang.bind(this);
	this.handleChangeWords = this.handleChangeWords.bind(this);
	this.onTest = this.onTest.bind(this);
    }

    async componentDidMount() {
	this.db = await this.createWordsDatabase();
	// Subscribe to query to get all documents
	const sub = this.db.words.find().sort({id: 1})
	      .$.subscribe(
		  words => {
		      if (!words)
			  return;
		      toast('Reloading words');
		      this.setState({words: words.reverse()});
		      this.props.handleWordsContent(this.state.words);
		  });
	this.subscriptions.push(sub);
    }
    
    async createWordsDatabase() {
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

    setupReplication(collection, subs) {
	const replicationState = collection.sync({
	    remote: syncURL + dbName + '/' });
	this.subscriptions.push(
	    replicationState.change$.subscribe(
		change => {
		    toast('Replication change');
		    console.dir(change)
		})
	);
	this.subscriptions.push(
	    replicationState.docs$.subscribe(
		docData => console.dir(docData))
	);
	this.subscriptions.push(
	    replicationState.active$.subscribe(
		active => toast(`Replication active: ${active}`))
	);
	this.subscriptions.push(
	    replicationState.complete$.subscribe(
		completed => toast(`Replication completed: ${completed}`))
	);
	this.subscriptions.push(
	    replicationState.error$.subscribe(
		error => {
		    toast('Replication Error');
		    console.dir(error)
		})
	);
    }
    
    componentWillUnmount() {
	// Unsubscribe from all subscriptions
	this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    // handlers
    
    handleChangeLang = (event, { newValue }) => {
	this.setState({ value: newValue });
	this.setState({ newLang: newValue });
    };

    handleChangeWords(event) {
	this.setState({newWords: event.target.value});
    }

    async addWord() {
	const id = Date.now().toString();
	const newWord = {
	    id,
	    ieLang: this.state.newLang,
	    ieWords: this.state.newWords
	};
	const wordsCollection = this.db.words;
	await wordsCollection.insert(newWord);	
	this.setState({newLang: '', newWords: ''});
    }

    onTest(event) {
	event.preventDefault();
	const ieWords = this.state.newWords; // words;
	return this.props.onTest(ieWords);
    }
    
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
			     value, onChange: this.handleChangeLang };
	// Finally, render it!
	const langIn = (
		<Autosuggest suggestions={suggestions} inputProps={inputProps}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            getSuggestionValue={this.getSuggestionValue}
            renderSuggestion={this.renderSuggestion}
		/>
	);
	const onChangeWords = this.handleChangeWords;
	const wordsContent = this.state.words;
	const onClickAdd = this.addWord;
	const onClickTest = this.onTest;
	return (
		<table width="100%"><tbody><tr>
		<td style={{verticalAlign:"top", textAlign:"right"}}>
		{langIn}
		</td>
		<td style={{verticalAlign:"top", textAlign:"left"}}>
		<input type="text"
	    value={this.state.newWords} onChange={onChangeWords}
	    style={{width:'30em'}} placeholder="words" />
		<br/>
		<button onClick={onClickAdd}>Add word</button>
		<button onClick={onClickTest}>&gt;&gt; Test</button>
		</td>
		</tr></tbody></table>);
    }
}
