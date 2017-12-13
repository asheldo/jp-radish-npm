// pokorny-roots
var PouchDB = require('pouchdb-core');
// PouchDB.plugin(require('pouchdb-adapter-idb'));

const nameDatabase = 'pokorny17112501',
      nameKeywordsDb = 'piekeys17102401',
      nameMemoRootsDb = 'piememoroots17102401';
const uriDatabases = (host) =>  `http://${host}:5984/`;
// 
var remoteDatabase, remoteKeywordsDb, remoteMemoRootsDb;

export function syncAndConnect() {
    syncDomAttribute('data-sync-state', 'syncing-data');
    return to(remoteKeywordsDb,   nameKeywordsDb)
	.then(sync2)
	.catch(sync2);
}

function langs() {
}

function handleRows(results) {
    console.log(results);
}

/**
 * after sync, failure or success
 */
function connect() {
    remoteDatabase.info()
	.then(function (info) {
	    console.log(info);
	});
    remoteDatabase.allDocs({
	include_docs: true,
	attachments: true
    })
	.then(handleRows)
	.catch(err => console.log(err));
}

function to(db, dbName) {
    var opts = {live: true};
    return db.replicate.to(uriDatabases + dbName);
}

function from(db, dbName) {
    var opts = {live: true};
    return db.replicate.from(uriDatabases + dbName);
}

function sync2(info) {
    console.log("2:" + info);
    return from(remoteKeywordsDb, nameKeywordsDb)
	.then(sync3)
    // Fast-forward, to setSessions()/connect(), if remote inaccessible
	.catch(syncRoots2);
}

function sync3(info) {
    console.log("3:" + info);
    langs();
    return to(remoteMemoRootsDb,  nameMemoRootsDb)
	.then(sync4)
	.catch(sync4);
}

function sync4(info) {
    console.log("4:" + info);
    return from(remoteMemoRootsDb,  nameMemoRootsDb)
	.then(syncRoots)
	.catch(syncRoots);
}

function syncRoots(info) {
    console.log("5:" + info);
    syncDom('syncing roots data..');	
    return to(remoteDatabase, nameDatabase)
	.then( syncRoots2)
	.catch( syncRoots2);
}

function syncRoots2(info) {
    console.log("6:" + info);
    // setSessions(); // setup typeahead
    // langs();
    return from(remoteDatabase, nameDatabase)
	.then((info) => {
	    syncDom('sync done - building...');
	    connect();
	})
	.catch((err) => {
	    syncDom('sync failed - building...');
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


