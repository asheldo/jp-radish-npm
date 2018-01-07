// pokorny-roots
import * as rootsGroup from './pokorny-roots-group';
import {syncURL} from './db/rxdb-utils';

var PouchDB = require('pouchdb-browser');
// PouchDB.plugin(require('pouchdb-adapter-idb'));

const nameDatabase = 'pokorny17112501',
      nameKeywordsDb = 'piekeys17102401',
      nameMemoRootsDb = 'piememoroots17102401';

// const syncURL = 'localhost';
// const host = "192.168.0.6";
// const uriDatabases = `http://${host}:5984/`;
 
var pDatabase, pKeywordsDb, pMemoRootsDb;

export function database() {
    return pDatabase;
}

/**
 * messes with emacs tabs, so at end of file
 */
function initData() {
    pDatabase = new PouchDB(`${nameDatabase}`);
    pKeywordsDb = new PouchDB(`${nameKeywordsDb}`);
    pMemoRootsDb = new PouchDB(`${nameMemoRootsDb}`);    
}

export function syncAndConnect() {
    initData();
    syncDomAttribute('data-sync-state', 'syncing-data');
    return to(pKeywordsDb,   nameKeywordsDb)
	.then(sync2)
	.catch(sync2);
}

/*
    const results = {
	rootGroups: rootGroups,
	allRoots: allRoots,
	groupRoots: groupRoots,
	allFirstRootsOptions: allFirstRootsOption
    };
*/

export function fetchRootGroupsOptions() {
    // let select = document.getElementById("groups");
    return rootsGroup.fetchRootGroupsOptions();
    // select.options[0] = new Option("", "");
}

export function fetchAllFirstRootsSelect() {
    //	let select = document.getElementById("allfirstroots");
    return rootsGroup.fetchAllFirstRootsSelect();
	// allFirstRootsOptions; // select.options[0] = new Option("", "");
    // todo
    // select.options[select.options.length] = new Option(match[1], id);
}

// array of duals/arrays
export function fetchAllRootsOptions() {
    // let select = document.getElementById("allroots");
    // select.options[0] = new Option("", "");
    return rootsGroup.fetchAllRootsOptions();
}

/**
 * one alpha group of roots
 */    
export function listGroupRoots(groupSelect) {
    return rootsGroup.listGroupRoots(groupSelect);
}

// Process rows...
function handleRows(results) {
    rootsGroup.handleRows(results);
}

function langs() {
    console.log("langs?");
}

/**
 * after sync, failure or success
 */
function connect() {
    pDatabase.info()
	.then(function (info) {
	    console.log(info);
	});
    pDatabase.allDocs({
	include_docs: true, // true,
	attachments: false // true
    })
	.then(handleRows)
	.catch(err => console.log(err));
}

function to(db, dbName) {
    var opts = {live: true};
    return db.replicate.to(syncURL + dbName);
}

function from(db, dbName) {
    var opts = {live: true};
    return db.replicate.from(syncURL + dbName);
}

function sync2(info) {
    return from(pKeywordsDb, nameKeywordsDb)
	.then(sync3)
    // Fast-forward, to setSessions()/connect(), if p inaccessible
	.catch(syncRoots2);
}

function sync3(info) {
    langs();
    return to(pMemoRootsDb,  nameMemoRootsDb)
	.then(sync4)
	.catch(sync4);
}

function sync4(info) {
    return from(pMemoRootsDb,  nameMemoRootsDb)
	.then(syncRoots)
	.catch(syncRoots);
}

function syncRoots(info) {
    syncDom('syncing roots data..');	
    return to(pDatabase, nameDatabase)
	.then( syncRoots2)
	.catch( syncRoots2);
}

function syncRoots2(info) {
    return from(pDatabase, nameDatabase)
	.then((info) => {
	    syncDom('sync done - building');
	    connect();
	})
	.catch((err) => {
	    syncDom('sync failed - building');
	    connect();
	});
}

// Show replication error state
function syncError() {
    syncDomAttribute('data-sync-state', 'error');
}

function syncDomAttribute(attr, val) {
    const syncDom = document.getElementById('sync-wrapper');
    if (syncDom != null)
	syncDom.setAttribute(attr, val);
}

function syncDom(msg) {
    const syncDom = document.getElementById('sync-wrapper');
    if (syncDom != null)
	syncDom.innerHTML = msg;	
}


