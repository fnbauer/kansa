import React from 'react';  
import { render } from 'react-dom'
import { DefaultRoute, Router, Link, Route, RouteHandler, hashHistory,browserHistory } from 'react-router';
import { Provider } from 'react-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux'
import { syncHistoryWithStore, routerReducer } from 'react-router-redux'
import ReactDOM from 'react-dom'

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import App from './components/App.jsx';
import Member from './components/Member.jsx';
import Login from './components/Login.jsx';
import './styles/app.css';
import API from './api.js'
const apiHost = 'localhost:3000';
const api = new API(`http://${apiHost}/`);

import user from './reducers/user';

const store = createStore(
  combineReducers({
    user,
    routing: routerReducer
  })
)



api.GETCORS('user')
  .then(data => store.dispatch({ type: 'LOGIN', data })).then(function() {})
  .catch(e => console.log(e));

const history = syncHistoryWithStore(browserHistory, store)

ReactDOM.render(
  <Provider store={store} >
   <MuiThemeProvider muiTheme={getMuiTheme()}>
<Router history={hashHistory}>  
  <Route path="/" component={(props, state, params) => <App api={api} {...props} />}  />
  <Route name="profile" path="/profile" component={(props, state, params) => <Member api={api} {...props} />}  />
  <Route path="/login/:email/:key"  component={(props, state, params) => <Login api={api} {...props} />}  />
</Router>
  </MuiThemeProvider>
  </Provider>,
  document.getElementById('react')
)
