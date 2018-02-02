import React, { Component } from 'react';
import { createJunctionTemplate, createPageTemplate } from 'junctions'

import { Header } from './page-elements';
import { Navbar } from './page-navbar'

// for pokorny roots db
import { Account } from './components/account';
import { Pokorny } from './components/pokorny';

import {QueryChangeDetector} from 'rxdb';

import { ToastContainer, style } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';
// toast notif. style:
style({
    width: "120px",
});

QueryChangeDetector.enable();
QueryChangeDetector.enableDebugging();

// App and Junctions Template
// export default below
class App extends React.Component {
    
    renderContent() {
	let { junction } = this.props
	// If there is a currently selected page, get its component.
	// Use an uppercase `C` so the variable can be used in a JSX element.
	let Component = junction.activeChild &&
	    junction.activeChild.component 
	// If user enters unknown URL, there is no active child, thus no component
	if (!Component) {
	    return <h1>404: Page Not Found</h1>
	}
	else {
	    // Render page's component, passing in active Page object as prop.
	    return <Component page={ junction.activeChild } />
	}
    }

    render() {
	return (<div className='App'>
		<ToastContainer autoClose={3000} />
		<Header />
		<Navbar /> { this.renderContent() } </div>)
    }
}

const AppJunctionTemplate = createJunctionTemplate({
    children: {
	'/login': createPageTemplate({
	    title: 'Login',
	    component: () => <Account/>
	}),
	'/': createPageTemplate({
	    title: 'PokornyX Translation',
	    component: () => <Pokorny/>
	}),
	'/api-reference': createPageTemplate({
	    title: 'PokornyX Reference',
	    component: () =>
		<div>
		<h1>JPokornyX Reference</h1>
		<ol><li>Translate lines from classic works/titles in Indo-Euro languages</li>
		<li>Search (test) Pokorny-root=word (e.g. in original or related IE lang)</li>
		</ol></div>
	}),
    },
    component: App,
})

export default AppJunctionTemplate;


