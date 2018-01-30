import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const iew1 = "https://www.win.tue.nl/~aeb/natlang/ie/pokorny.html";
const iew2 = "https://www.win.tue.nl/~aeb/"
const iew3 = "https://indo-european.info/pokorny-etymological-dictionary/whnjs.htm"

const domain = process.env.REACT_APP_COUCHDB_DOMAIN;
const port = process.env.REACT_APP_POKORNY_PORT;

export const allRootsLink = `http://${domain}:${port}`;

const links = () => {
    let i = 0;
    return (<span>
	    <a href={iew1} target="iew"
	    style={{color:"white"}}>{++i}</a>,&nbsp;
	    <a href={iew2} target="iew"
	    style={{color:"grey"}}>{++i}</a>,&nbsp;
	    <a href={iew3} target="iew"
	    style={{color:"white"}}>{++i}</a>,&nbsp;
	    <a href={allRootsLink} target="all-roots"
	    style={{color:"white"}}>{++i}</a>
	    </span>);
}

export class Header extends Component {
    constructor(props) {
	super(props);
	this.state = { showTextFirst: true };
    }
    
    render() {
	const textFirst
	      = (<span>Page, like many before it,
		 based on the legendary and very long
		 &nbsp;<em>Indogermanisches Etymologisches
		 Wörterbuch (IEW)</em></span>)
	const textRest
	      = (<span>(Julius Pokorny. Francke, 1959).
		 Running on the shoulders of Indo-European linguistic giants;
		 text scan and English meanings by George Starostin,
		 further corrections by A. Lubotsky, et al.<br/>
		 <a href='https://en.wiktionary.org/wiki/radish'><em>Radish</em>
		 &nbsp;etymology</a> (i.e. Latin accus. sing. of <em>radix</em></span>);
	const text = (<span>{textFirst} {textRest}</span>);
	const onClick = (event) => {
	    event.preventDefault();
	    this.setState({showTextFirst:
			   !this.state.showTextFirst});
	    return false;
	}
	const showText = () => {
	    const f = this.state.showTextFirst;
	    if (f) {
		return (<span>{textFirst}&nbsp;<a href='' onClick={onClick}
			style={{color:"white"}}>
			&gt;&gt;</a></span>);
	    } else {
		return (<span><a href='' onClick={onClick}
			style={{color:"white"}}>
			&lt;&lt;</a>&nbsp;{textRest} ({links()})</span>);
	    }
	}
	return (<div className="App-header">
		<table width="100%"><tbody><tr><td>
		<table><tbody><tr>
		<td><img src={logo} className="App-logo" alt="logo" /></td>
		<td><h2>JPokornyX</h2></td>
		</tr></tbody></table></td>
		<td><table width="100%"><tbody><tr>
		<td style={{fontSize: ".9em", padding: "20px"}}>
		{showText()} 
		</td></tr></tbody></table>
		</td></tr></tbody></table>
		</div>)
    }
}
