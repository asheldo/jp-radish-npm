// pokorny-roots
import * as rootsGroup from './pokorny-roots-group';
import {syncURL} from './db/rxdb-utils';

var PouchDB = require('pouchdb-browser');
// PouchDB.plugin(require('pouchdb-adapter-idb'));

const nameDatabase = 'pokorny17112501';
const nameKeywordsDb = 'piekeys17102401';
const nameMemoRootsDb = 'piememoroots17102401';

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

export function syncAndConnect(completion) {
    initData();
    syncDomAttribute('data-sync-state', 'syncing-data');
    return to(pKeywordsDb,   nameKeywordsDb)
	.then(sync2(completion))
	.catch(sync2(completion));
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
const handleRows = (completion) => (results) => {
    rootsGroup.handleRows(results);
    console.log("completion");
    completion();
}

function langs() {
    console.log("langs?");
}

/**
 * after sync, failure or success
 */
function connect(completion) {
    pDatabase.info()
	.then(function (info) {
	    console.log(info);
	});
    pDatabase.allDocs({
	include_docs: true, // true,
	attachments: false // true
    })
	.then(handleRows(completion))
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

const sync2 = (completion) => (info) => {
    return from(pKeywordsDb, nameKeywordsDb)
	.then(sync3(completion))
    // Fast-forward, to setSessions()/connect(), if p inaccessible
	.catch(syncRoots2(completion));
}

const sync3 = (completion) => (info) => {
    langs();
    return to(pMemoRootsDb,  nameMemoRootsDb)
	.then(sync4(completion))
	.catch(sync4(completion));
}

const sync4 = (completion) => (info) => {
    return from(pMemoRootsDb,  nameMemoRootsDb)
	.then(syncRoots(completion))
	.catch(syncRoots(completion));
}

const syncRoots = (completion) => (info) => {
    syncDom('syncing roots data..');	
    return to(pDatabase, nameDatabase)
	.then( syncRoots2(completion))
	.catch( syncRoots2(completion));
}

const syncRoots2 = (completion) => (info) => {
    return from(pDatabase, nameDatabase)
	.then((info) => {
	    syncDom('sync done - building');
	    connect(completion);
	})
	.catch((err) => {
	    syncDom('sync failed - building');
	    connect(completion);
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


