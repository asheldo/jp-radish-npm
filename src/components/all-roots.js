import React, { Component } from 'react';

export class AllRoots extends Component {

    constructor(props) {
	super(props);
	this.state = {options: [["loading...","loading..."]]};
    }
    
    componentWillReceiveProps(newProps) {
	if (newProps.options.length) {
	    this.setState({options: ["","-"].concat(newProps.options),
			   map: newProps.options.map});
	}
    }

    render() {
	const makeOptions = (options) => options.map(
	    (arr) => (<option key={arr[1] + "_" + arr[0]}
		      value={arr[1]}>{arr[0]}</option>));
	// const options = makeOptions(getAllRootsOptions(this.props.map));
	return (<div>
		(n={this.state.options.length}) <select
		onChange={this.props.onChange}>
		{makeOptions(this.state.options)}
		</select>
		<p><em>... or&nbsp;&nbsp;<a href={this.props.allRootsLink}
		target="legacy">legacy app</a>
		for more roots browsing options</em></p>
		</div>);
    }

/*    // fill Select
    function getAllRootsOptions(map) {
	// let select = document.getElementById("allroots");
	const options = [];
	options[0] = ["",""];
	var last = "";
	for (var [pageStart, id] of map.entries()) {
	    let name = id.length <= 24 ? id : id.substring(0, 24);
	    if (id !== last) {
		options[options.length] = [name, id];
		last = id;
	    } else {
		console.log("dupe:" + last);
	    }
	};
	return options;
    }
  */  

}
