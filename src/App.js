import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
// for pokorny roots db
import * as roots from './pokorny-roots';
import * as rootParser from './pokorny-root-parser';
import * as rootSearch from './pokorny-root-search';

import { LanguageWord } from './components/language-words';
import { IETranslations } from './components/translation-lines';
import { Links, LinksList } from './components/root-links-list';
import { WordsList } from './components/root-words-list';

import {QueryChangeDetector} from 'rxdb';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';

QueryChangeDetector.enable();
QueryChangeDetector.enableDebugging();

// Simple render components

class App extends Component {

    constructor(props) {
	super(props);
	
	const visible = {};
	visible["allRoots"] = false;
	visible["addWord"] = true;
	visible["wordsList"] = false;
	visible["translations"] = true;
	visible["rootLinks"] = false;
	this.state = {
	    visible: visible,
	    searchLimit: 2,
	    ieLinks: new Map(),
	    ieLinksList: new Map()
	};
	this.handleChangeLink = this.handleChangeLink.bind(this);
	this.handleFetchRoots = this.handleFetchRoots.bind(this);
	this.fetchPokornyRoots = this.fetchPokornyRoots.bind(this);
	this.showDiv = this.showDiv.bind(this);
    }
    
    async componentDidMount() {
	// indogermDatabase
	roots.syncAndConnect()
	    .then((info) => this.rootDatabaseConnected = 1)
	    .catch((err) => console.log(err));
    }

    componentWillUnmount() {
    }

    render() {
	const ieLinks = this.state.ieLinks;
	const ieLinksList = this.state.ieLinksList;
	const wordsContent = this.state.wordsContent;
	const onClickWord = this.handleFetchRoots;
	const onChangeLink = this.handleChangeLink;
	const showHide = this.handleShowHideContent;
	return (
		<div className="App">
		
		<ToastContainer autoClose={3000} />
		<div className="App-header">
		<img src={logo} className="App-logo" alt="logo" />
		<h2>JPokornyX</h2>
		</div>
		
	        <table width="100%"><tbody><tr>
		<td style={{verticalAlign: 'top'}} width="50%">
	        <table width="100%"><tbody><tr><td>
		<a href='' onClick={this.showDiv("rootLinks")}>
		<h3>PIE Root</h3></a></td>
		<td>
		<LinksList wordsAndLinksList={ieLinksList}
	    onChange={onChangeLink}/></td></tr>
		<tr style={{display: (this.state.visible["rootLinks"]
				      ? 'inline' : 'none')}}>
		<td style={{verticalAlign: 'top'}} colSpan="3">
		<Links wordsAndLinks={ieLinks} />
		</td></tr></tbody></table>
		</td>
	    	<td width="50%" style={{verticalAlign:'top'}}>
		<div className="translations">
		<a href='' onClick={this.showDiv("translations")}>
		<strong>Translations</strong></a>
		<div style={{display: (this.state.visible["translations"]
					  ? 'inline' : 'none')}}>
	    	<IETranslations onSearchLine={(line) => {
		    return () => { this.setState({ searchLine: line }) }
		}} />
		</div><hr/></div>		
		<div className="all-roots">
		<a href='' onClick={this.showDiv("allRoots")}>
		<strong>All Roots</strong></a>
		<div style={{display: (this.state.visible["allRoots"]
					  ? 'inline' : 'none')}}>
		...
		</div><hr/></div>
		<div className="add-word-div">
		<a href='' onClick={this.showDiv("addWord")}>
		<strong>Add Word</strong></a>		
		<div style={{display: (this.state.visible["addWord"]
					  ? 'block' : 'none')}}>
	    	<LanguageWord onTest={this.fetchPokornyRoots}
	    handleWordsContent={ wc => this.setState({wordsContent: wc})}
	    searchLine={this.state.searchLine}/>

		<hr/>
		<table width="100%"><tbody><tr>
		<td style={{verticalAlign: 'top'}}>
		Limit:<br/>
		<select value='3'>{ [1,2,3,4,5,6,7,8,9,10].map(
		    (i) => (<option key={i} value={i}>{i}</option>)) }</select>
		</td><td>
		<a href='' onClick={this.showDiv("wordsList")}>
		<strong>Words List</strong></a>		
		<div style={{display: (this.state.visible["wordsList"]
					  ? 'block' : 'none')}}>
		<WordsList words={wordsContent}
	    onClickWord={onClickWord} />
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

    showDiv(div) {
	return (event) => {
	    event.preventDefault();
	    this.state.visible[div] = !this.state.visible[div];;
	    this.setState({ visible: this.state.visible });
	    return false;
	}
    }
        
    handleChangeLink(map) {
	return (event) => {
	    const oneMap = new Map();
	    const key = event.target.value;
	    const content = map.get(key);
	    oneMap.set(key, content);
	    this.setState({ieLinks: oneMap,
			   visibleRootLinks: true});
	}
    }
    
    handleFetchRoots(ieWords) {
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
