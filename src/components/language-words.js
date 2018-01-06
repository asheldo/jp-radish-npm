import React, { Component } from 'react';
import Autosuggest from 'react-autosuggest';

import { pokornyWordsSchema } from '../schema';
import { languagesValAndName } from '../pokorny-language';
import { DBSubscription } from '../db/rxdb-utils';

// v. indogermanishes etymologisches worterbuch pokorny17112501
const wordsDBName = 'pokornyx17121101';

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
    }

    async componentDidMount() {
	this.wordsDB = await this.wordsDBSub
	    .createDatabase(wordsDBName,
			    [{name: 'words', schema: pokornyWordsSchema}],
			    '♛ ');
    }
    
    componentWillUnmount() {
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
	const inputProps = { placeholder: 'Type a language',
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
	// const wordsContent = this.state.words;
	const onClickAdd = this.addWord;
	const onClickTest = this.onTest;
	return (
		<table width="100%"><tbody><tr>
		<td style={{verticalAlign:"top", textAlign:"right"}}>
		{langIn}
		</td>
		<td style={{verticalAlign:"top", textAlign:"left"}}>
		<input type="text"
	    value={newWords}
	    onChange={onChangeWords}
	    style={{width:'30em'}} placeholder="/root/=word" />
		<br/>
		<button onClick={onClickAdd}>Add word</button>
		<button onClick={onClickTest}>&gt;&gt; Test</button>
		</td>
		</tr></tbody></table>);
    }
}
