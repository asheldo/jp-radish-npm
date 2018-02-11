import React, { Component } from 'react';
import { createJunctionTemplate, createPageTemplate } from 'junctions'

import { Header } from './page-elements'
import { Navbar } from './page-navbar'

import { Account } from './components/account';
import { Pokorny } from './components/pokorny';

import {QueryChangeDetector} from 'rxdb';
import 'react-toastify/dist/ReactToastify.min.js';
import { ToastContainer, style } from 'react-toastify';
style({
    width: "120px",
});

QueryChangeDetector.enable();
QueryChangeDetector.enableDebugging();

// App and Junctions Template

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
	} else {
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
		<ol><li>Translate lines from classic works/titles in I-E languages</li>
		<li>Search/test Pokorny-root=word (e.g. in related I-E lang)</li>
		</ol></div>
	}),
    },
    component: App,
})

export default AppJunctionTemplate;


