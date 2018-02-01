import React, { Component } from 'react';

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

