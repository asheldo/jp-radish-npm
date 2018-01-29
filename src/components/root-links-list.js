import React, { Component } from 'react';

export class Links extends Component {
    
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

export class LinksList extends Component {
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
	    const ct = options.length ? "(n=" + options.length + ") " : "";
	    return (<span>{ct}<select onChange={onChange}>{options}</select></span>);
	}
    }
}
