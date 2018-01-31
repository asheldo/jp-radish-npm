import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import  AppJunctionTemplate from './App'
import { JunctionNavigation } from 'react-junctions'
import registerServiceWorker from './registerServiceWorker';
import linkKeywordDefinition from './rootHandlers';


// Instead of rendering `<App>` directly, it will be rendered by
// `<JunctionNavigation>`.
ReactDOM.render(
  <JunctionNavigation root={AppJunctionTemplate} />,
  document.getElementById('root')
)
// ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
