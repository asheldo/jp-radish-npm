import React, { Component } from 'react';
import * as moment from 'moment';

// language/word entries
export class WordsList extends Component {
    render() {
	const wordProcessGenerator = this.props.onClickWord;
	const words = this.props.words;
	return words == null ? [] : words.map(
	    ({id, ieLang, ieWords}) => {
		const wordProcessOne = wordProcessGenerator(ieWords);
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
    

