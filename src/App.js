import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
// for pokorny roots db
import * as roots from './pokorny-roots';
import * as rootParser from './pokorny-root-parser';
import * as rootSearch from './pokorny-root-search';

import { LanguageWords, IETranslations } from './components/language-words';

import {QueryChangeDetector} from 'rxdb';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';
import * as moment from 'moment';

QueryChangeDetector.enable();
QueryChangeDetector.enableDebugging();

// Simple render components

class Links extends Component {
    
    render() {
	const map = this.props.wordsAndLinks;
	if (map == null) {
	    return (<div
		    className="App-root-table-scroll"
		    dangerouslySetInnerHTML={{__html: '<pre>...</pre>'}} />);

	} else {
	    var contents = (<div>...</div>);
	    map.forEach((contentVal, ieWordsKey, map) => {
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


class WordsList extends Component {
    render() {
	const wordProcess = this.props.onClickWord;
	const words = this.props.words;
	return words == null ? [] : words.map(
	    ({id, ieLang, ieWords}) => {
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
    

class App extends Component {

    constructor(props) {
	super(props);
	this.state = {
	    visibleAllRoots: false,
	    visibleAddWord: true,
	    visibleWordsList: true,
	    visibleTranslations: true,
	    searchLimit: 2,
	    ieLinks: new Map(),
	    ieLinksList: new Map()
	};
	this.handleChangeLink = this.handleChangeLink.bind(this);
	this.handleWordProcessor = this.handleWordProcessor.bind(this);
	this.handleWordLink = this.handleWordLink.bind(this);
	this.handleWordsContent = this.handleWordsContent.bind(this);
	this.showAllRootsDiv = this.showAllRootsDiv.bind(this);
	this.showAddWordDiv = this.showAddWordDiv.bind(this);
	this.showWordsListDiv = this.showWordsListDiv.bind(this);
	this.showTranslationsDiv = this.showTranslationsDiv.bind(this);
    }

    async indogermDatabase() {
	roots.syncAndConnect()
	    .then((info) => this.rootDatabaseConnected = 1)
	    .catch((err) => console.log(err));
    }
    
    
    async componentDidMount() {
	this.indogermDatabase();
    }

    componentWillUnmount() {
    }

    handleWordsContent(wordsContent) {
	this.setState({wordsContent: wordsContent});
    }

    render() {
	const ieLinks = this.state.ieLinks;
	const ieLinksList = this.state.ieLinksList;
	const wordsContent = this.state.wordsContent;
	const onClickWord = this.handleWordProcessor;
	const onChangeLink = this.handleChangeLink;
	const showHide = this.handleShowHideContent;
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
	        <table width="100%"><tbody>
		<tr>
		<td></td>
		<td><h3>PIE Root</h3></td>
		<td><LinksList wordsAndLinksList={ieLinksList}
	    onChange={onChangeLink}/></td>		
		</tr>
		<tr>
		<td colSpan="3">
		<Links wordsAndLinks={ieLinks} />
		</td></tr></tbody></table>
		</td>
	    	<td width="50%" style={{verticalAlign:'top'}}>
		<div className="translations">
		<a href='' onClick={this.showTranslationsDiv}>
		<strong>Translations</strong></a>
		<div style={{display: (this.state.visibleTranslations
					  ? 'inline' : 'none')}}>

	    	<IETranslations
	    onSearchLine={(line) => {
		console.log("182: " + line.id);
		return () => {
		    console.log("184: " + line.id);
		    this.setState({ searchLine: line })
		}
	    }} />

		</div>
		<hr/>
		</div>
		
		<div className="all-roots">
		<a href='' onClick={this.showAllRootsDiv}>
		<strong>All Roots</strong></a>
		<div style={{display: (this.state.visibleAllRoots
					  ? 'inline' : 'none')}}>
		...
		</div>
		<hr/>
		</div>
		<div className="add-word-div">
		<a href='' onClick={this.showAddWordDiv}>
		<strong>Add Word</strong></a>		
		<div style={{display: (this.state.visibleAddWord
					  ? 'inline' : 'none')}}>

	    	<LanguageWords onTest={this.handleWordLink}
	    handleWordsContent={this.handleWordsContent}
	    searchLine={this.state.searchLine}/>

		<hr/>
		<table width="100%"><tbody><tr><td>
		Limit:<br/><select>{limitOptions}</select>
		</td><td>
		<a href='' onClick={this.showWordsListDiv}>
		<strong>Words List</strong></a>		
		<div style={{display: (this.state.visibleWordsList
					  ? 'inline' : 'none')}}>
		<WordsList words={wordsContent} onClickWord={onClickWord} />
		</div>
		</td>
		</tr></tbody></table>
		<hr/>
		</div>
		</div>    
		</td>
		</tr></tbody></table>
		
		<hr/>
		</div>
	);
    }

    showAllRootsDiv(event) {
	event.preventDefault();
	this.setState({visibleAllRoots: !this.state.visibleAllRoots});
    }
    
    showAddWordDiv(event) {
	event.preventDefault();
	this.setState({visibleAddWord: !this.state.visibleAddWord});
    }	
    
    showWordsListDiv(event) {
	event.preventDefault();
	this.setState({visibleWordsList: !this.state.visibleWordsList});
    }
    
    showTranslationsDiv(event) {
	event.preventDefault();
	this.setState(
	    {visibleTranslations: !this.state.visibleTranslations});
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
    
    // like handleWordProcessor(ieWords);
    handleWordLink(ieWords) {
	//	event.preventDefault();
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
			    console.log(root[0]);
			    const rootId = root[0];
			    const content = root[1];
			    mapMore.set(rootId, content);
			    if (mapOne.size === 0) {
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
