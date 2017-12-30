import React, { Component } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';
import Autosuggest from 'react-autosuggest';
import * as RxDB from 'rxdb';
import { pokornyWordsSchema, pokornyTranslationSchema } from '../schema';
import { languagesValAndName } from '../pokorny-language';

RxDB.plugin(require('pouchdb-adapter-idb'));
RxDB.plugin(require('pouchdb-adapter-http'));

// v. indogermanishes etymologisches worterbuch pokorny17112501
const wordsDBName = 'pokornyx17121101';
const translationsDBName = 'ietranslations17122704';
// indogermDbName = 'pokorny17112501';
// piememoroots17102401 piekeys17102401

const syncURL = 'http://192.168.0.6:5984/';
const languages = languagesValAndName();

class DBSubscription {
    constructor() {
	this.subscriptions = [];
    }
    
    async createDatabase(dbName, collections, crown) {
	// password must have at least 8 characters
	const db = await RxDB.create(
	    {name: dbName,
	     adapter: 'idb',
	     password: '12345678'}
	);
	console.dir(db);
	// show who's the leader in page's title
	db.waitForLeadership().then(() => {
	    document.title = crown + document.title;
	});
	// create collection
	//	collections.forEach(async ({name, schema}) => {
	const name = collections[0].name;
	const schema = collections[0].schema;
	const collection = await db.collection({
	    name: name,
	    schema: schema
	});
	console.dir(collection);
	// set up replication
	await this.setupReplication(collection, dbName);
//	});
	return db;
    }

    // App is ready for multi-user behavior
    setupReplication(collection, dbName) {
	const replicationState = collection.sync({
	    remote: syncURL + dbName + '/'
	});
	this.subscriptions.push(
	    replicationState.change$.subscribe(
		change => {
		    toast('change');
		    console.dir(change)
		})
	);
	this.subscriptions.push(
	    replicationState.docs$.subscribe(
		docData => console.dir(docData))
	);
	this.subscriptions.push(
	    replicationState.active$.subscribe(
		active => toast(`active:${active}`))
	);
	this.subscriptions.push(
	    replicationState.complete$.subscribe(
		completed => toast(`completed:${completed}`))
	);
	this.subscriptions.push(
	    replicationState.error$.subscribe(
		error => {
		    toast('Error');
		    console.dir(error)
		})
	);
    }

    subscribe(sub) {
	this.subscriptions.push(sub);
    }
    
    unsubscribe() {
	this.subscriptions.forEach(sub => sub.unsubscribe());
    }
}

// New Add line translations with pokorny ie references
// resources: ietranslations* db (export const pokornyLineTranslationSchema)
export class IETranslations extends Component {
    constructor(props) {
	super(props);
	// Autosuggest is a controlled component.
	// This means that you need to provide an input value
	// and an onChange handler that updates this value (see below).
	// Suggestions also need to be provided to the Autosuggest,
	// and they are initially empty because the Autosuggest is closed.
	this.state = this.emptyState();
	this.translationsDBSub = new DBSubscription();
	this.upsertTranslation = this.upsertTranslation.bind(this);
	this.handleChangeIELang = this.handleChangeIELang.bind(this);
	this.handleChangeIEWords = this.handleChangeIEWords.bind(this);
	this.handleChangeIEWork = this.handleChangeIEWork.bind(this);
	this.handleChangeLineLocator = this.handleChangeLineLocator.bind(this);
	this.onEditLine = this.onEditLine.bind(this);
	// this.handleChangeLineTranslation = this.handleChangeLineTranslation.bind(this);
	// this.onTest = this.onTest.bind(this);
    }

    async componentDidMount() {
	const collections = [{name: 'translations',
			      schema: pokornyTranslationSchema}];
	this.translationsDB = await this.translationsDBSub
	    .createDatabase(translationsDBName,
			    collections,
			    '♔ ');
	// Subscribe to query to get all documents
	const sub = this.translationsDB.translations
	      .find().sort({id: 1}).$.subscribe(
		  (lines) => {
		      if (!lines)
			  return;
		      toast('Reloading translations');
		      this.setState({lines: lines}); //.reverse
		      // this.handleTranslationsContent(lines);
		  });
	this.translationsDBSub.subscribe(sub);
    }
    
    componentWillUnmount() {
	// Unsubscribe from all subscriptions
	this.translationsDBSub.unsubscribe();
    }

    handleChangeIELang = (event, { newValue }) => {
	this.setState({ value: newValue });
	this.setState({ ieLang: newValue });
    };

    handleChangeIEWords(event) {
	const val = event.target.value;
	this.setState({ieWords: val});
    }

    // Replication
    handleChangeIEWork(event) {
	const val = event.target.value;
	// do we need to create anew? clear the lineTranslations.
	if (this.state.timestamp !== ""
	    && this.state.lineTranslations.length > 0
	    && this.state.ieLang !== val)
	{
	    this.setState({lineTranslations: []});
	}
	this.setState({ieWork: val});
    }

    handleChangeLineLocator(event) {
	const val = event.target.value;
	// do we need to create anew? clear the lineTranslations.
	if (this.state.timestamp !== ""
	    && this.state.lineTranslations.length > 0
	    && this.state.ieLang !== val)
	{
	    this.setState({lineTranslations: []});
	}
	this.setState({lineLocatorData: val});
    }

    // TODO parse when adding/updating translation
    getLineLocator() {
	let lineLocator = null;
	const value = this.state.lineLocatorData; // event.target.value;
	const locators = value.split(",");
	if (locators.length === 1 && locators[0].trim() !== '') {
	    lineLocator = { line: parseInt(locators[0], 10) };
	} else if (locators.length === 2) {
	    lineLocator = { verse: parseInt(locators[0], 10),
			    line: parseInt(locators[1], 10) };
	} else if (locators.length === 3) {
	    lineLocator = { chapter: parseInt(locators[0], 10),
			    verse: parseInt(locators[1], 10),
			    line: parseInt(locators[2], 10) };
	} else if (locators.length === 2) {
	    lineLocator = { book: locators[0],
			    chapter: parseInt(locators[1], 10),
			    verse: parseInt(locators[2], 10),
			    line: parseInt(locators[3], 10) };
	}
	lineLocator.work = this.state.ieWork;
	return lineLocator; // this.setState({lineLocator: lineLocator});
    }

    handleTranslationsContent(translation) {

    }

    lineToState(line) {
	return {
	    value: line.ieLang,
	    ieLang: line.ieLang,
	    ieWords: line.ieWords,
	    id: line.id,
	    lineLocatorData: line.lineLocator.line, // TODO
	    ieWork: line.lineLocator.work,
	    timestamp: line.timestamp
	}
    }
    
    emptyState() {
	return {
	    timestamp: '',
	    value: '',
	    suggestions: [],
	    ieWork: '',
	    ieLang: '',
	    ieWords: '',
	    lineLocatorData: '',
	    lineTranslations: [],
	    wordEtymonLemmas: []
	};
    }

    updateDoc(doc) {
	doc.timestamp = Date.now().toString();
	doc.ieLang = this.state.ieLang;
	doc.ieWords = this.state.ieWords;
	doc.lineTranslations = this.state.lineTranslations;
	doc.wordEtymonLemmas = [];
    }

    onEditLine(line) {
	return () => {
	    if (line && line.id) {
		this.setState(this.lineToState(line));
	    }
	}
    }
    
    async upsertTranslation() { // addLineAndTranslations() {
	// find?
	const id = this.state.ieWork + "@" + this.state.lineLocatorData;
	const newTranslation = {
	    id: id,
	    timestamp: Date.now().toString(),
	    ieLang: this.state.ieLang,
	    ieWords: this.state.ieWords,
	    lineLocator: this.getLineLocator(),
	    lineTranslations: this.state.lineTranslations,
	    wordEtymonLemmas: []
	};	
	const collection = this.translationsDB.translations;
	var doc = null;
	// try {
	const docs = await collection.find().where('id').equals(id).exec(); // findOne({id: newTranslation.id})
	//} catch (err) { console.log(err); }
	docs.forEach((rowDoc) => {
	    doc = rowDoc;
	});
	if (doc != null) {
	    console.log(doc);
	    if (this.state.lineTranslations.length === 0) {
		this.setState({lineTranslations: doc.lineTranslations});
	    }
	    if (this.state.ieWords.length === 0) {
		this.setState({ieWords: doc.ieWords});
	    }
	    this.updateDoc(doc);
	    await doc.save();
	    // await collection.upsert(newTranslation);
	} else {
	    await collection.insert(newTranslation);
	}
	this.setState({timestamp: newTranslation.timestamp});
	// this.setState({newLang: '', newWords: ''});
	// add?
	// this.setState({newLang: '', newWords: ''});
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

    onSuggestionsFetchRequested = ({ value }) => {
	this.setState({ suggestions: this.getSuggestions(value) });
    };

    onSuggestionsClearRequested = () => {
	this.setState({ suggestions: [] });
    };

    renderSuggestion(suggestion) {
	return (<div>{suggestion.val} ({suggestion.name})</div>);
    }
    
    getSuggestionValue(suggestion) { return suggestion.val; }    

    render() {
	const { value, suggestions } = this.state;
	// Autosuggest will pass through all these props to the input.
	const inputProps = { placeholder: 'Type a language',
			     value, onChange: this.handleChangeIELang };
	// Finally, render it!
	const lang = (
		<Autosuggest suggestions={suggestions} inputProps={inputProps}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            getSuggestionValue={this.getSuggestionValue}
            renderSuggestion={this.renderSuggestion} />
	);
	const onChangeWork = this.handleChangeIEWork;
	const onChangeLang = this.handleChangeIELang;
	const onChangeWords = this.handleChangeIEWords;
	const onChangeLocator = this.handleChangeLineLocator;
	const wordsContent = this.state.ieWords;
	const onClickAdd = this.upsertTranslation;
	const onClickClear = () => this.setState(this.emptyState());
	const onClickNewLine = () => {
	    const empty = [{ timestamp:  Date.now().toString() }];
	    this.setState({
		lineTranslations: this.state.lineTranslations.concat(empty)
	    });
	};
	// const onClickTest = this.onTest;
	return (
		<table width="100%"><tbody><tr>
		<td style={{verticalAlign:"top", textAlign:"right"}}>
		{lang}
		</td>
		<td style={{verticalAlign:"top", textAlign:"left"}}>
		<input type="text" value={this.state.ieWork}
	    onChange={onChangeWork} style={{width:'30em'}}
	    placeholder="title etc" />
		<input type="text" value={this.state.ieWords}
	    onChange={onChangeWords} style={{width:'30em'}}
	    placeholder="line words" />
		<input type="text" value={this.state.lineLocatorData}
	    onChange={onChangeLocator} style={{width:'30em'}}
	    placeholder="locator (line #)" />
		<br/>
		<button onClick={onClickAdd}>Add/Update Trans.</button>
		<button onClick={onClickClear}>—— Clear</button>
		<button onClick={onClickNewLine}>+++ Add Line</button>
		<br/>
		<TranslationLineList lines={this.state.lineTranslations}/>
		</td></tr>
		<tr><td colSpan="2">
		<hr/>
		<Lines lines={this.state.lines} onEdit={this.onEditLine}
	    onSearch={this.props.onSearchLine}/>
		</td>
		</tr></tbody></table>);
    }
}

class Line extends Component {
    constructor(props) {
	super(props);
    }

    render() {
	const line = this.props.line;
	return (<div>({line.ieLang}) {line.id}
		<button onClick={this.props.onEdit}>✎</button>
		<button onClick={this.props.onSearch}>✇</button>
		{line.ieWords}
		<button onClick={() => line.remove()}>✖</button></div>)
    }

    onDelete(line) {
	// await
	return () => line.remove();
    }
}

class Lines extends Component {
    constructor(props) {
	super(props);
    }

    render() {
	if (this.props.lines && this.props.lines.length) {
	    var i = 0;
	    return this.props.lines.map((line) => {
		return (
			<div key={++i}>
			<Line line={line}
		    onEdit={this.props.onEdit(line)}
		    onSearch={this.props.onSearch(line)}/>
			</div>
		)
	    });
	} else {
	    return (<div>...</div>)
	}
    }
}

class TranslationLine extends Component {
    constructor(props) {
	super(props);
    }

    render() {
	const onChangeLang = (event) =>
	      this.props.line.transLang = event.target.value;
	const onChangeWords = (event) =>
	      this.props.line.transWords = event.target.value;
	const onChangeRefer = (event) =>
	      this.props.line.references = event.target.value;
	return (
		<div>
	    	<input type="text"
	    value={this.props.line.transLang} onChange={onChangeLang}
	    style={{width:'10em'}} placeholder="lang" />
	    	<input type="text"
	    value={this.props.line.transWords} onChange={onChangeWords}
	    style={{width:'30em'}} placeholder="translation" />
		<br/>
	    	<input type="text"
	    value={this.props.line.references} onChange={onChangeRefer}
	    style={{width:'30em'}} placeholder="references" />
		</div>
	)
    }
}

class TranslationLineList extends Component {
    constructor(props) {
	super(props);
    }
    
    render() {
	var i = 0;
	// const { value, suggestions } = this.state;
	return this.props.lines.map((line) => {
	    if (line && line.timestamp) {
		return (<TranslationLine key={++i} line={line}/>)
	    } else {
		return (<span>...</span>)
	    }
	});
    }
}

// Add language/words pair, with: Auto-suggest
// resources: pokornyx* db
export class LanguageWords extends Component {
    constructor(props) {
	super(props);
	// Autosuggest is a controlled component.
	// This means that you need to provide an input value
	// and an onChange handler that updates this value (see below).
	// Suggestions also need to be provided to the Autosuggest,
	// and they are initially empty because the Autosuggest is closed.
	let newWords = '';
	let newLang = '';
	this.state = {
	    value: newLang,
	    suggestions: [],
	    newWords: newWords,
	    newLang: newLang,
	    words: [],
	};
	this.wordsDBSub = new DBSubscription();
	this.addWord = this.addWord.bind(this);
	this.handleChangeLang = this.handleChangeLang.bind(this);
	this.handleChangeWords = this.handleChangeWords.bind(this);
	this.onTest = this.onTest.bind(this);
    }

    async componentDidMount() {
	this.wordsDB = await this.wordsDBSub
	    .createDatabase(wordsDBName,
			    [{name: 'words', schema: pokornyWordsSchema}],
			    '♛ ');
	// Subscribe to query to get all documents
	const sub = this.wordsDB.words.find().sort({id: 1})
	      .$.subscribe(
		  words => {
		      if (!words)
			  return;
		      toast('Reloading words');
		      this.setState({words: words.reverse()});
		      this.props.handleWordsContent(this.state.words);
		  });
	this.wordsDBSub.subscribe(sub);
    }
    
    componentWillUnmount() {
	// Unsubscribe from all subscriptions
	this.wordsDBSub.unsubscribe();
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
	const wordsCollection = this.wordsDB.words;
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
	let newWords = this.state.newWords;
	let newLang = value;
	if (this.props.searchLine) {
	    // console.log(props.searchLine);
	    newWords = this.props.searchLine.ieWords;
	    newLang = this.props.searchLine.ieLang;
	}

	const inputProps = { placeholder: 'Type a language',
			     value: newLang,
			     onChange: this.handleChangeLang };
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
	    value={newWords} onChange={onChangeWords}
	    style={{width:'30em'}} placeholder="words" />
		<br/>
		<button onClick={onClickAdd}>Add word</button>
		<button onClick={onClickTest}>&gt;&gt; Test</button>
		</td>
		</tr></tbody></table>);
    }
}
