import React, { Component } from 'react'
import Autosuggest from 'react-autosuggest'

import { databases, DBSubscription } from '../db/rxdb-utils'
import { translationsDBName, translationsCollections } from '../db/schema'
import { languagesValAndName } from '../pokorny-language'
import history from '../history.js'

// v. indogermanishes etymologisches worterbuch pokorny17112501

// indogermDbName = 'pokorny17112501';
// piememoroots17102401 piekeys17102401

const languages = languagesValAndName();

// Verse Lines and their ie translations, idg pokorny et al references
export class IETranslations extends Component {
    constructor(props) {
	super(props);
	// Autosuggest is a controlled component.
	// This means that you need to provide an input value
	// and an onChange handler that updates this value (see below).
	// Suggestions also need to be provided to the Autosuggest,
	// and they are initially empty because the Autosuggest is closed.
	this.state = this.startingState();
	const docsSubscribed = lines => this.setState({lines: lines});
	this.translationsDBSub = new DBSubscription(docsSubscribed);
	this.upsertTranslation = this.upsertTranslation.bind(this);
	this.handleChangeIELang = this.handleChangeIELang.bind(this);
	this.handleChangeIEWords = this.handleChangeIEWords.bind(this);
	this.handleChangeIEWork = this.handleChangeIEWork.bind(this);
	this.handleChangeLineLocator = this.handleChangeLineLocator.bind(this);
	this.onEditLine = this.onEditLine.bind(this);
	this.mountDB = this.mountDB.bind(this);
	this.unboundDB = this.unmountDB.bind(this);
    }

    componentWillReceiveProps(newProps) {
    }

    getSessionUser() {
	const u = sessionStorage.getItem('username') // set by account login
	return u && u !== undefined ? u : ''
    }
    
    async componentDidMount() {
	this.mountDB(this.getSessionUser());
        this.setState({
	    removeListener:
            history.listen(async (location) => {
		const username = this.getSessionUser()
		if (this.state.username !== username) {

		    await this.unmountDB()
		    await this.mountDB(username)
		}
	    })
	})
    }

    // TODO "RxDB" bug? or missing feature more likely...
    // Maybe does not support reconnect (i.e. re-createDatabase)
    // during session, so save in case try to re-connect
    async mountDB(username) {
	const name = translationsDBName + username
	var db = databases[name]
	// TODO Probably need to unsubscribe from previous DB's subs
	if (!db) {
	    db = await this.translationsDBSub
		.createDatabase(translationsDBName + username,
				translationsCollections, '♔ ')
	    databases[name] = db
	}
	this.setState({translationsDB: db, username: username})
    }
    
    componentWillUnmount() {
	this.state.removeListener()
	this.unmountDB()
    }

    unmountDB() {
	// Unsubscribe from all subscriptions
	this.translationsDBSub.unsubscribe();
    }
    
    lineToState(line) {
	const loc = line.lineLocator;
	const b = loc.book, c = loc.chapter, v = loc.chapter, l = loc.line;
	const lineLocatorData = loc.book ? b +','+ c +','+ v +','+ l : '' + l;
	return {
	    value: line.ieLang,
	    ieLang: line.ieLang,
	    ieWords: line.ieWords,
	    id: line.id,
	    lineLocatorData: lineLocatorData, // .line, // TODO
	    ieWork: loc.work,
	    timestamp: line.timestamp,
	    lineTranslations: line.lineTranslations
	}
    }
    
    startingState() {
	const empty = this.emptyWorkState()
	empty.username = ''
	empty.translationsDB = null
	console.dir(empty)
	return empty
    }
    
    emptyWorkState() {
	return {
	    timestamp: '',
	    value: '',
	    suggestions: [],
	    ieWork: '',
	    ieLang: '',
	    ieWords: '',
	    lineLocatorData: '',
	    lineTranslations: [],
	    wordEtymonLemmas: [],
	};
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
	const state = {ieWork: val};
	if (this.state.ieWork !== val) {
	    this.resetState(this.state, state);
	}
	this.setState(state);
    }

    resetState(oldState, state) {
	if (oldState.timestamp !== ""
	    && oldState.lineTranslations.length > 0)
	{
	    state.lineTranslations = [];
	    state.editLine = null;
	}
    }
    
    handleChangeLineLocator(event) {
	const val = event.target.value;
	const state = {lineLocatorData: val};
	// do we need to create anew? clear the lineTranslations.
	if (this.state.lineLocatorData !== val) {
	    this.resetState(this.state, state);
	}
	this.setState(state);
    }

    // TODO parse when adding/updating translation
    getLineLocator() {
	let lineLocator = null;
	const value = this.state.lineLocatorData; // event.target.value;
	const locators = value.split(",");
	if (locators.length === 1 && locators[0].trim() !== '') {
	    lineLocator = { chapter: 0, verse: 0,
			    line: parseInt(locators[0], 10) };
	} else if (locators.length === 2) {
	    lineLocator = { chapter: 0,
			    verse: parseInt(locators[0], 10),
			    line: parseInt(locators[1], 10) };
	} else if (locators.length === 3) {
	    lineLocator = { chapter: parseInt(locators[0], 10),
			    verse: parseInt(locators[1], 10),
			    line: parseInt(locators[2], 10) };
	} else if (locators.length === 4) {
	    lineLocator = { book: locators[0],
			    chapter: parseInt("0" + locators[1], 10),
			    verse: parseInt("0" + locators[2], 10),
			    line: parseInt("0" + locators[3], 10) };
	}
	lineLocator.work = this.state.ieWork;
	return lineLocator; // this.setState({lineLocator: lineLocator});
    }

    handleTranslationsContent(translation) {
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
		const state = this.lineToState(line);
		state.editLine = line;
		this.setState(state);
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
	const collection = this.state.translationsDB.translations;
	var doc = null;
	const docs = await collection.find().where('id').equals(id).exec();
	docs.forEach((rowDoc) => {
	    doc = rowDoc;
	});
	if (doc != null) {
	    if (this.state.lineTranslations.length === 0) {
		this.setState({lineTranslations: doc.lineTranslations});
	    }
	    if (this.state.ieWords.length === 0) {
		this.setState({ieWords: doc.ieWords});
	    }
	    this.updateDoc(doc);
	    await doc.save();
	} else {
	    await collection.insert(newTranslation);
	}
	this.setState({timestamp: newTranslation.timestamp});
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
	const onClickClear = () => this.setState(this.emptyWorkState());
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
	    placeholder='locator (line # or "book,chap#,verse#,line#")' />
		<br/>
		<button onClick={onClickAdd}>Add/Update Trans.</button>
		<button onClick={onClickClear}>—— Clear</button>
		<button onClick={onClickNewLine}>+++ Add Line</button>
		<br/>
		<TranslationLineList
	    lineTranslations={this.state.lineTranslations}
	    editLine={this.state.editLine} />
		</td></tr>
		<tr><td colSpan="2">
		<hr/>
		<LinesList lines={this.state.lines} onEdit={this.onEditLine}
	    onSearch={this.props.onSearchLine}/>
		</td>
		</tr></tbody></table>);
    }
}

// Verse Lines list
class LinesList extends Component {
    constructor(props) {
	super(props);
	this.state = { visibleLines: {} };
	this.showLinesDiv = this.showLinesDiv.bind(this);
    }

    render() {
	if (this.props.lines && this.props.lines.length) {
	    const visibility = (lastWork) => {
		const vis = this.state.visibleLines[lastWork];
		return vis == null || !vis ? 'none' : 'block';
	    }
	    this.props.lines.sort(this.lineSorter);
	    var i = 0;
	    let lastWork = '', lastBook = '', lastChap = 0, lastVerse = 0;
	    const rows = this.props.lines.map((line) => {
		const loc = line.lineLocator;
		const oldWork = loc.work === lastWork;
		const work = (oldWork) ? '' : loc.work;
		const oldBook = loc.book === lastBook;
		const book = (oldBook) ? '' : loc.book;
		const oldChap = loc.chapter === lastChap;
		const chap = (oldChap) ? '' : loc.chapter;
		const oldVerse = loc.verse === lastVerse;
		const verse = (oldVerse) ? '' : loc.verse;
		lastWork = loc.work;
		lastBook = loc.book;
		const locData = (book > '')
		      ? (<span>{book} {chap}:{verse}({loc.line})</span>)
		      : loc.line;
		const row =
		      (<div key={++i} style={{display: visibility(lastWork)}}>
		       <em>{locData}</em>&nbsp;
		       <button onClick={this.props.onEdit(line)}>✎</button>
		       <button onClick={this.props.onSearch(line)}>✇</button>
		       {line.ieWords}
		       <button onClick={() => { this.props.onEdit(line);
						line.remove(); }
		       }>✖</button></div>)
		if (work === '') {
		    return row;
		} else {
		    return (<div key={++i}><div>
			    <a href='' onClick={this.showLinesDiv(lastWork)}>
			    <strong>({line.ieLang})&nbsp;
			    {loc.work}</strong>
			    </a></div> {row} </div>);
		}
	    });
	    return rows;
	} else {
	    return (<div>...</div>)
	}
    }

    showLinesDiv(lastWork) {
	return (event) => {
	    event.preventDefault();
	    const vis = this.state.visibleLines;
	    const isvis = vis[lastWork];
	    vis[lastWork] = isvis == null ? true : !isvis;
	    this.setState({visibleLines: vis});
	    return false;
	}
    }

    lineSorter(a,b) {
	const sortable = (loc) => 
	    loc.work.trim() + (loc.book ? loc.book : '0') + ''
	      + (1000+loc.chapter) + '' + (1000+loc.verse) + ''
	      + (10000+loc.line);
	const xA = sortable(a.lineLocator), xB = sortable(b.lineLocator);
	if (xA < xB) {
	    return -1;
	} else if (xA === xB) {
	    return 0;
	} else {
	    return 1;
	}
    }
}

// One of zero-to-N translations of the verse line
class TranslationLine extends Component {
    constructor(props) {
	super(props);
	if (!props.line) {
	    this.state = {
		line: {},
		transLang: '',
		transWords: '',
		references: ''
	    };
	} else {
	    this.state = this.newState(props);
	}
    }

    componentWillReceiveProps(newProps) {
	this.setState(this.newState(newProps));
    }

    newState(newProps) {
	if (newProps.line) {
	    const line = newProps.line;
	    return {
		line: line,
		transLang: line.transLang,
		transWords: line.transWords,
		references: line.references
	    };
	}
	return {};
    }
    
    render() {
	const onChangeLang = (event) => {
	    const transLang = event.target.value;
	    this.state.line.transLang = transLang;
	    this.setState({transLang: transLang}); 
	}
	const onChangeWords = (event) => {
	    this.state.line.transWords = event.target.value;
	    this.setState({transWords: event.target.value });
	}
	const onChangeRefer = (event) => {
	    this.state.line.references = event.target.value;
	    this.setState({references: event.target.value });
	}
	return (
		<div>
	    	<input type="text"
	    value={this.state.transLang} onChange={onChangeLang}
	    style={{width:'10em'}} placeholder="ie lang" />
	    	<input type="text"
	    value={this.state.transWords} onChange={onChangeWords}
	    style={{width:'30em'}} placeholder="translation" />
		<br/>
	    	<textarea
	    value={this.state.references} onChange={onChangeRefer}
	    style={{width:'30em'}} placeholder="references" />
		</div>
	)
    }
}

// zero-to-N translations of the verse line
class TranslationLineList extends Component {
    constructor(props) {
	super(props);
    }
    
    render() {
	var i = 0;
	return this.props.lineTranslations.map((line) => {
	    if (line && line.timestamp) {
		++i;
		return (<TranslationLine key={i} line={line}/>)
	    } else {
		return (<span>...</span>)
	    }
	});
    }
}

