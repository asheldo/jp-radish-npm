import React, { Component } from 'react';

import './App.css';
import { Header, allRootsLink } from './page-elements';
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
	visible["rootLinks"] = true;
	visible["translations"] = false;
	visible["allRoots"] = false;
	visible["addWord"] = true;
	visible["wordsList"] = true;
	this.state = {
	    editWord: {},
	    fetchInProgress: "",
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
	const showHideLabel = (div) => this.state.visible[div] ? "Hide" : "Show"
	return (
		<div className="App">		
		<ToastContainer autoClose={3000} />
	        <table width="100%"><tbody><tr><td colSpan="2">
		<Header/>
		</td></tr>
		<tr>
		<td style={{verticalAlign: 'top'}} width="50%">
	        <table width="100%"><tbody><tr><td>
		<table  width="100%"><tbody><tr>
		<td style={{align: 'center'}} width="50%">
		<a href='' onClick={this.showDiv("rootLinks")}>		
		<h3>{showHideLabel("rootLinks")} PIE Root</h3></a>
		</td>
		<td style={{align: 'center'}} width="50%">
	    {this.state.fetchInProgress}		
		<LinksList wordsAndLinksList={ieLinksList}
	    onChange={onChangeLink}/>  <em>Limit:</em>
		    <select value='3'>{
			[1,2,3,4,5,6,7,8,9,10]
			    .map((i) =>
				 (<option key={i} value={i}>{i}</option>))
		    }</select>
		
		</td></tr></tbody></table>
	    </td></tr>
		<tr style={{display: (this.state.visible["rootLinks"]
				      ? 'inline' : 'none')}}>
		<td style={{verticalAlign: 'top'}} >
		<Links wordsAndLinks={ieLinks} />
		</td></tr></tbody>
		</table>
		</td>
	    	<td width="50%" style={{verticalAlign:'top'}}>
		<div className="translations">
		<a href='' onClick={this.showDiv("translations")}>
		<strong>{showHideLabel("translations")} Translations</strong></a>
		<div style={{display: (this.state.visible["translations"]
					  ? 'inline' : 'none')}}>
	    	<IETranslations onSearchLine={(line) => {
		    return () => { this.setState({ searchLine: line }) }
		}} />
		</div><hr/></div>		
		<div>
		<a href='' onClick={this.showDiv("allRoots")}>
		<strong>{showHideLabel("allRoots")} All Roots</strong></a></div>
		<div style={{display: (this.state.visible["allRoots"]
					  ? 'inline' : 'none')}}>
		<em>...TBA...
		Use <a href={allRootsLink} target="legacy">legacy app</a> to
	    browse all roots</em>
		</div><hr/>
		<div className="add-word-div">
		<a href='' onClick={this.showDiv("addWord")}>
		<strong>{showHideLabel("addWord")} My Word(s)</strong></a>		
		<div style={{display: (this.state.visible["addWord"]
					  ? 'block' : 'none')}}>
	    	<LanguageWord
	    onTest={(arg) => {
		this.fetchPokornyRoots(arg);
	    }}
	    handleWordsContent={ wc => this.setState({wordsContent: wc}) }
	    editWord={this.state.editWord}
	    searchLine={this.state.searchLine}/>
		<hr/>
		<table width="100%"><tbody><tr><td>
		<a href='' onClick={this.showDiv("wordsList")}>
		<strong>Words List</strong></a>		
		<div style={{display: (this.state.visible["wordsList"]
					  ? 'block' : 'none')}}>
		<WordsList words={wordsContent}
	    onEditWord={
		// todo => todo
		(word) => (event) => this.setState({editWord: word})
	    }
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
	let ct = 0;
	const showFetchSpinner = () => {
	    const spinner = "◐◓◑◒";
	    ++ct;
	    const show = spinner.charAt(ct % 3);
	    this.setState({ fetchInProgress: show });
	}
	showFetchSpinner();
	const wordDefinitions = ieWords.split(";");
	var allwords = [];
	wordDefinitions.forEach((wordDef) => {
	    wordDef.split("=").forEach(
		(token) => allwords[allwords.length] = [wordDef, token]);
	});
	const rootSetResolves = allwords.map(async ([wordDef, token]) => {
	    var rootSet = [];
	    try {
		rootSet = await this.fetchRoot(token);
		showFetchSpinner();
	    } catch (err) {
		try {
		    showFetchSpinner();
		    rootSet = await this.fetchRoot(token + "*");
		} catch (err) {
		    try {
			showFetchSpinner();
			rootSet = await this.searchRoots(wordDef);
		    } catch (err) {
			console.log("nothing found");
		    }
		}
	    }
	    return rootSet;
	});
	this.setRootContent(ieWords, rootSetResolves);
    }

    setRootContent(ieWords, rootSetResolves) {
	Promise.all(rootSetResolves).then((rootSets) => {
	    // 
	    const mapOne = new Map();
	    const mapMore = new Map();
	    rootSets.forEach((rootSet) => {
		if (rootSet) {
		    console.log(rootSet.length);
		    rootSet.forEach((root) => {
			if (root && root.length) {
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
	    this.setState({fetchInProgress: ""});
	});
    }
    
    async fetchRoot(rootId) {
	const result = await roots.database().get(rootId);
	const content = rootParser.parseContent(result.content);
	return [[rootId, content]];
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

class Spinner extends Component {
    render() {
	// var duration = 600,  element,
	// frames = '▙▛▜▟'.split('');
	//frames = '▤▧▥▨'.split('');
	//frames = '◴◵◶◷'.split('');
	//frames = '◩◪'.split('');
	//frames = '◰◱◲◳'.split('');
	//frames = '◐◓◑◒'.split('');
	const step = function (timestamp) {
	    // var frame = Math.floor(timestamp*frames.length/duration) % frames.length;
	    // if (!element) element = window.document.getElementById('spinner');	    
	    // element.innerHTML = frames[frame];
	    // return window.requestAnimationFrame(step);
	}
	// window.requestAnimationFrame(step);
	if (this.props.fetchInProgress) {
	    return (<span>◐◓◑◒</span>);
	} else {
	    return (<span></span>);
	}
    }

}

