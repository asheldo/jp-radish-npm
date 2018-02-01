import React, { Component } from 'react';
import { createJunctionTemplate, createPageTemplate } from 'junctions'

import { Header } from './page-elements';
import { Navbar } from './page-navbar'

// for pokorny roots db
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
    let Component =
      this.props.junction.activeChild && 
      this.props.junction.activeChild.component
    
    if (!Component) {
      // If the user enters an unknown URL, there will be no active child,
      // and thus no component.
      return <h1>404: Page Not Found</h1>
    }
    else {
      // Render the page's component, passing in the active Page object
      // as a prop.
      return <Component page={this.props.junction.activeChild} />
    }
  }

  render() {
    return (
      <div className='App'>
	    <ToastContainer autoClose={3000} />
	    <Header />
	    <Navbar />	
        {this.renderContent()}
      </div>
    )
  }
}



// export default App;

const AppJunctionTemplate = createJunctionTemplate({
  children: {
    '/': createPageTemplate({
      title: 'PokornyX',
      component: () =>
	    <Pokorny/>
    }),

    '/api-reference': createPageTemplate({
      title: 'PokornyX Reference',
      component: () =>
        <div>
            <h1>JPokornyX Reference</h1>
	    <ol>
	    <li>Add lines from classic works (titles) in Indo-European languages</li>
	    <li>Add translation/references, often to eng (Modern English)</li>
	    <li>Test Pokorny root=word (e.g. in original IE or related lang.)</li>
	    </ol>
        </div>
    }),
  },

  component: App,
})

export default AppJunctionTemplate;


