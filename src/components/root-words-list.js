import React, { Component } from 'react';
import * as moment from 'moment';

// language/word entries
export class WordsList extends Component {
    render() {
	const words = this.props.words;
	return words == null ? [] : words.map(
	    (word) => {
		const {id, ieLang, ieWords} = word;
		return (<Word key={id} id={id}
			ieLang={ieLang} ieWords={ieWords}
			onClickDelete={(event) => word.remove()}
			onEditWord={this.props.onEditWord(word)}
			onClickWord={this.props.onClickWord(ieWords)} />)
	    });
    }
}

class Word extends Component {
    render() {
	const date = moment(this.props.id, 'x').fromNow();
	return (
		<div key={this.props.id}>
		
		<a href='' onClick={this.props.onClickWord}>&lt;&lt;</a>
		({this.props.ieLang})&nbsp;
		<span>{this.props.ieWords} ... {date}</span>
	    	<button onClick={this.props.onEditWord}>✎</button>
		<button onClick={() => { 
					 this.props.onClickDelete(); }
				}>✖</button>
		</div>
	);	    
    }
}
    

