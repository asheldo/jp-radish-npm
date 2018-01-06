import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const iew1 = "https://www.win.tue.nl/~aeb/natlang/ie/pokorny.html";
const iew2 = "https://www.win.tue.nl/~aeb/"
const iew3 = "https://indo-european.info/pokorny-etymological-dictionary/whnjs.htm"
const links = (<span><a href={iew1} target="iew" style={{color: "grey"}}>1</a>,&nbsp;
	       <a href={iew2} target="iew" style={{color: "grey"}}>2</a>,&nbsp;
	       <a href={iew3} target="iew" style={{color: "grey"}}>3</a></span>)

export const header = (
	<div className="App-header">
	<table width="100%"><tbody><tr><td>
	<table><tbody><tr>
	<td><img src={logo} className="App-logo" alt="logo" /></td>
	<td><h2>JPokornyX</h2></td>
	</tr></tbody></table>
	</td><td>
	<table width="100%"><tbody><tr>
	<td style={{fontSize: ".9em", padding: "20px"}}>
	It may not look like it, but this page, like others
	before it, is based on the
    legendary and very long <br/><em>Indogermanisches
    etymologisches Wörterbuch</em> (Julius Pokorny. Francke, 1959).<br/> We run on top of the

    shoulders of giants; text scan and English meanings by George Starostin,
    further corrections by A. Lubotsky, et al. ({links}). 
	</td></tr></tbody></table>
	</td></tr></tbody></table>
	</div>
)
