import React, { Component } from 'react';
import Autosuggest from 'react-autosuggest';

import { databases, DBSubscription } from '../db/rxdb-utils'
import { wordsDBName, wordsCollections } from '../db/schema'
import { languagesValAndName } from '../pokorny-language'
import history from '../history.js'

// v. indogermanishes etymologisches worterbuch pokorny17112501

const languages = languagesValAndName();

// Add language/words pair, with: Auto-suggest
// resources: pokornyx* db
export class LanguageWord extends Component {
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
	    username: '',
	    wordsDB: null,
	    value: newLang,
	    suggestions: [],
	    newWords: newWords,
	    newLang: newLang,
	    words: [],
	};
	const docsSubscribed = words => {
	    this.setState({words: words.reverse()});
	    this.props.handleWordsContent(this.state.words);
	}
	this.wordsDBSub = new DBSubscription(docsSubscribed);
	this.addWord = this.addWord.bind(this);
	this.handleChangeLang = this.handleChangeLang.bind(this);
	this.handleChangeWords = this.handleChangeWords.bind(this);
	this.onTest = this.onTest.bind(this);
	this.mountDB = this.mountDB.bind(this);
	this.unboundDB = this.unmountDB.bind(this);
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
	const name = wordsDBName + username
	var db = databases[name]
	// TODO Probably need to unsubscribe from previous DB's subs
	if (!db) {
	    db = await this.wordsDBSub
		.createDatabase(wordsDBName + username, wordsCollections, '♛ ')
	    databases[name] = db
	}
	this.setState({wordsDB: db, username: username})
    }
    
    componentWillUnmount() {
	this.state.removeListener()
	this.unmountDB()
    }

    unmountDB() {
	// Unsubscribe from all subscriptions
	this.wordsDBSub.unsubscribe();
    }

    componentWillReceiveProps(newProps) {
	if (newProps.searchLine
	    && (!this.props.searchLine
		|| (this.props.searchLine.id !== newProps.searchLine.id)))
	{
	    this.setState({newWords: newProps.searchLine.ieWords});
	}
	else if (newProps.editWord && newProps.editWord.id
		&& newProps.editWord.id !== this.state.id) {
	    const word = newProps.editWord;
	    this.setState({value: word.ieLang,
			   newLang: word.ieLang,
			   newWords: word.ieWords,
			   id: word.id
			  });
	}
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
	const wordsCollection = this.state.wordsDB.words;
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
    
    render() {	
	const { value, suggestions, newWords } = this.state;
	// Autosuggest will pass through all these props to the input.
	let newWordsDefault = '';
	if (this.props.searchLine) {
	    // if (this.props.searchLine.id !== this.state.searchLineId)
	    { // TODO
		// newWordsDefault = this.props.searchLine.ieWords + "";
		// newLang = this.props.searchLine.ieLang + "";
	    }
	}
	const inputProps = { placeholder: 'I-E lang (e.g lat)',
			     value: value,
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
	const onClickAdd = this.addWord;
	const onClickTest = this.onTest;
	return (<table width="100%"><tbody><tr>
		<td style={{verticalAlign:"top", textAlign:"right"}}>
		{langIn}
		</td>
		<td style={{verticalAlign:"top", textAlign:"left"}}>
		<input type="text"
	    value={newWords}
	    onChange={onChangeWords}
	    style={{width:'30em'}} placeholder='root=word (e.g. "/ālu-, ālo-/=radix")' />
		<br/>
		<button onClick={onClickAdd}>Add word</button>
		<button onClick={onClickTest}>&gt;&gt; Test</button>
		</td>
		</tr></tbody></table>);
    }
}
