import React, { Component } from 'react';

import './App.css';
import { Header, allRootsLink } from './page-elements';
// for pokorny roots db
import * as roots from './pokorny-roots';
import * as rootParser from './pokorny-root-parser';
import * as rootSearch from './pokorny-root-search';
import { AllRoots } from './components/all-roots';
import { LanguageWord } from './components/language-words';
import { IETranslations } from './components/translation-lines';
import { Links, LinksList } from './components/root-links-list';
import { WordsList } from './components/root-words-list';

import {QueryChangeDetector} from 'rxdb';

import { ToastContainer, style } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';

style({
    width: "120px",
});

QueryChangeDetector.enable();
QueryChangeDetector.enableDebugging();

// export default
class App extends Component {

    constructor(props) {
	super(props);
	
	const visible = {};
	visible["rootLinks"] = true;
	visible["translations"] = true;
	visible["allRoots"] = false;
	visible["addWord"] = true;
	visible["wordsList"] = false;
	this.state = {
	    allRootsOptions: [],
	    editWord: {},
	    fetchInProgress: "",
	    visible: visible,
	    searchLimit: 2,
	    ieLinks: new Map(),
	    ieLinksList: new Map()
	};
	this.handleChangeAllRoots = this.handleChangeAllRoots.bind(this);
	this.handleChangeLink = this.handleChangeLink.bind(this);
	this.handleFetchRoots = this.handleFetchRoots.bind(this);
	this.fetchPokornyRoots = this.fetchPokornyRoots.bind(this);
	this.showDiv = this.showDiv.bind(this);
    }
    
    async componentDidMount() {
	// indogermDatabase
	const completion = () => {
	    this.setState({
		allRootsOptions: roots.fetchAllRootsOptions(),
	    });
	    console.log("all " + this.state.allRootsOptions.length);
	};
	roots.syncAndConnect(completion)
	    .then((info) => {
		this.setState({rootDatabaseConnected: true});
		console.log("NOT indexing roots");
		// TODO Why is indexing using up Firefox CPU?
		// rootSearch.index(roots.database());
	    })
	    .catch((err) => console.log(err));
    }

    componentWillUnmount() {
    }

    render() {
	const ieLinksOne = this.state.ieLinks;
	const ieLinksMore = this.state.ieLinksList;
	const wordsContent = this.state.wordsContent;
	const onClickWord = this.handleFetchRoots;
	
	const showHideLabel = (div) => this.state.visible[div] ? "Hide" : "Show";
	const limit = (<span><em>Limit:</em>
		       <select value='3'>{
			   [1,2,3,4,5,6,7,8,9,10]
			       .map((i) => (<option key={i} value={i}>{i}</option>))
		       }</select></span>);
	const vis = this.state.visible;
	return (<div className="App">		
		<ToastContainer autoClose={3000} />
		<Header/>
		
		<div style={{verticalAlign: 'top',
			     width: vis["rootLinks"] ? '50%' : '20%',
			     display: 'inline-block'}}>
		<a href='' onClick={this.showDiv("rootLinks")}>		
		<strong>{showHideLabel("rootLinks")} PIE Root</strong></a>
		&nbsp;&nbsp;{this.state.fetchInProgress}		
		<LinksList wordsAndLinksList={ieLinksMore}
		onChange={this.handleChangeLink}/>
		<div style={{display: (vis["rootLinks"] ? 'inline' : 'none')}}>
		<Links wordsAndLinks={ieLinksOne} />
		</div>
		</div>

	    	<div style={{width: (vis["rootLinks"] ? '50%' : '80%'),
			     display: 'inline-block'}}>		
		<a href='' onClick={this.showDiv("translations")}>
		<strong>{showHideLabel("translations")} Translations</strong></a>
		<div style={{display: (vis["translations"] ? 'inline' : 'none')}}>
	    	<IETranslations onSearchLine={
		    (line) => () => { this.setState({ searchLine: line }) }
		}/>
		</div>
		<hr/>		
		<a href='' onClick={this.showDiv("allRoots")}>
		<strong>{showHideLabel("allRoots")} All Roots</strong></a>
		<div style={{display: (vis["allRoots"] ? 'inline' : 'none')}}>
		<AllRoots options={this.state.allRootsOptions}
		allRootsLink={allRootsLink}
		onChange={this.handleChangeAllRoots()}/>
		</div>
		<hr/>		
		<a href='' onClick={this.showDiv("addWord")}>
		<strong>{showHideLabel("addWord")} My Word(s)</strong></a>	
		<div style={{display: (vis["addWord"] ? 'block' : 'none')}}>
	    	<LanguageWord
	    onTest={(arg) => { this.fetchPokornyRoots(arg) }}
	    handleWordsContent={ wc => this.setState({wordsContent: wc}) }
	    editWord={this.state.editWord}
	    searchLine={this.state.searchLine}/>
		<hr/>		
		<a href='' onClick={this.showDiv("wordsList")}>
		<strong>{showHideLabel("wordsList")} Words List</strong></a>
		<div style={{display: (vis["wordsList"] ? 'block' : 'none')}}>
		<WordsList words={wordsContent} onEditWord={
		    (word) => (event) => this.setState({editWord: word})
		} onClickWord={onClickWord} />
		</div>
		<hr/></div>    
		<hr/></div></div>
	);
    }
    
    showDiv(div) {
	return (event) => {
	    event.preventDefault();
	    const vis = this.state.visible;
	    vis[div] = !vis[div]; // this.state.visible[div];;
	    this.setState({ visible: vis });
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

    handleChangeAllRoots() {
	return async (event) => {
	    const oneMap = new Map();
	    const key = event.target.value;
	    const content = await this.fetchRoot(key);
	    const contentVal = content[0][1]; // map.get(key);
	    oneMap.set(key, contentVal);
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

    // TODO Refactor two methods maybe to class, clarifying the setState targets
    
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

