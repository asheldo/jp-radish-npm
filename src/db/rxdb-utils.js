import * as RxDB from 'rxdb';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';
import 'rxjs/add/operator/single';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/filter';

RxDB.plugin(require('pouchdb-adapter-idb'));
RxDB.plugin(require('pouchdb-adapter-http'));
var PouchDB = require('pouchdb-browser');

const domain = process.env.REACT_APP_COUCHDB_DOMAIN;
const port = process.env.REACT_APP_COUCHDB_PORT;
const protocol = window.location.href.split("/")[0]
export const syncURL = `${protocol}//${domain}:${port}/`;

export const databases = {}

const translationDbPassword = process.env.REACT_APP_TRANS_DB_PASSWORD;

/* 
   Notes:
   - RxDB only allows createDatabase once per session or error.
   - So, save DBs if switching users

   Original Recipe:
   1. [db name, collection name, collection schema]
   2. await create db, empty?, from above w/ idb and pwd (save)
   3. await leader db
   4. await collection schema
   5. await docs replication (remote to local)
   6. await subscription

   New Recipe:
   1. [user name, db name, ? coll ? ]
   2. await create db, empty?, (save)
   3. await leader
   4. await collection schema
   4. await docs replication (from remote template db) 
   5. await re-replication (to new remote db)
   6. await subscription
*/
export class DBSubscription {
    
    constructor(docsSubCallback) {
	this.docsSubscribed = docsSubCallback;
	this.subscriptions = [];
    }
    
    async createDatabase(dbName, collections, crown) {
	// password must have at least 8 characters
	const db = await RxDB.create(
	    { name: dbName, adapter: 'idb',
	      password: translationDbPassword}
	);
	console.dir(db);
	// show who's the leader in page's title
	db.waitForLeadership().then(() => {
	    document.title = crown + document.title;
	});
	const name = collections[0].name;
	const schema = collections[0].schema;
	const collection = await db.collection({
	    name: name, schema: schema
	});
	console.dir(collection);
	await this.setupReplication(collection, dbName);
	this.getDocsSubscription(collection, name);
	return db;
    }

    // A: simple create locally and connect?
    // New Recipe B. (versus createDatabase)
	// don't yet init old/shared, but new/user-specific
	// templated-sync'ed from old	
	// then can init data
	/*
	  New Recipe:
	  1. [user name, db name, ? coll ? ]
	  2. await create
	  3. await leader
	  4. await collection
	  5. await replication (from old db) - collection?
	  6. await re-replication (to new db)
	  7. done, mgmt by regular createDatabase?
	*/
    async newDbFromTemplate(username, dbName, collections, completion, crown,
			    initialize = true) {
	console.dir("start replicating maybe " + collections[0])

	// Try remote user, maybe remote template, then normal subscribe
	await this.templateReplicationCheck(username, dbName)
    }

    // TODO use rxdb or not?
    async newUserDbFromTemplate(username,
				dbName,
				collections,
				completion, crown,
				initialize = true) {
	 
	const db = await RxDB.create({
	    name: dbName + username, adapter: 'idb',
	    password: translationDbPassword,
	    // skip_setup in collection below
	})
				     // CANNOT ALLOW AUTOCREATE REMOTE USER DB,
				     // AND THAT"S OK B/C OF SECURITY PLAN,
				     // USE COUCHDB TO CREATE, ONCE WE KNOW.
	
	console.dir(db)
	// show who's the leader in page's title
	db.waitForLeadership().then(() => {
	    document.title = crown + document.title;
	})
	const name = collections[0].name
	const schema = collections[0].schema
	const collection = await db.collection({
	    name: name, schema: schema,
	    pouchSettings: {skip_setup: true}
	})
	console.dir("start replicating maybe " + collection)

	// Try remote user, maybe remote template, then normal subscribe
	await this.templateReplication(collection, username, dbName)
	
	// TODO:
	// await this.setupReplication(collection, dbName + username);
	console.dir("get docs " + collection)
	this.getDocsSubscription(collection, name)
	return db
    }

    // TODO AUth options
    async templateReplicationCheck(username, dbName) {
	const remote = dbName + username
	// first, see if error due to missing user

	try {
	    var db = await new PouchDB(syncURL + remote, {skip_setup:true})
	    console.dir(await db.info())
	} catch(err) {
	    console.dir(err)
	}
    }
    
    /*
      What templateReplication means:
       - await one-time pull-sync from user remote couchdb.
       - if error:
         - await create remote (couchdb b/c skip_setup:true needed in rxdb)
         - await one-time pull-sync from template remote couchdb to user.
       - Cancel above (if necessary)
       - Then (immediately? retry=true?) return to normal ("setupReplication")
     */
    async AlsoNotWorkingSkipSetup_templateReplication(collection, username, dbName) {	
	// 1. try pull-only from existing user remote 
	const remote = dbName + username
	const replicationStateUserPull = collection.sync({
	    remote: syncURL + remote + '/',
	    direction: { pull: true, push: false }, 
	    live: false, retry: false });	
	console.dir(`${remote} <- ${remote}`)
	
	const userPullCompleted = (completed) => {
	    console.dir(`${remote}:${completed}`)
	    toast(`${remote}:${completed}`)		
	    if (completed)
	    {
		replicationStateUserPull.cancel()
		// DONE! (even though NOT completed potentially?!)
	    }
	}
	const userPullError = async (error) => {
	    console.dir(`${remote}:${error}`)
	    toast(`${remote}:${error}`)	

	    //  stops pull
	    replicationStateUserPull.cancel()
	    
	    // TEMPATE!
	    const remoteDB = await couchCreateRemoteUser() // before push
	    await pullTemplate()
	    await pushUser()
	}
	const couchCreateRemoteUser = async () => {	    
	    // TODO Admin security
	    var db = await new PouchDB(syncURL + remote);
	    console.dir(db)
	    return db
	}
	// First-time login
	const pullTemplate = async () => {
	    console.dir(`pull ${dbName}`)
	    toast(`pull ${dbName}`)	    
	    const replicationStateTemplatePull = collection.sync({
		remote: syncURL + dbName + '/',
		direction: { pull: true, push: false }, 
		live: false, retry: false });	    
	    await replicationStateTemplatePull.complete$
		.filter((res)=>{res==true})
		.toPromise().then((completed)=>{console.dir(`pulled`)})
	}
	// NO-OP, leaves it to follow-on setupReplication to push!
	const pushUser = async () => {
	    // unnecessary?
	    // replicationStateTemplatePull.cancel()
	    console.dir(`pull ${remote}`)
	    toast(`pull ${remote}`)
	    
	    const replicationStateTemplatePush = collection.sync({
		remote: syncURL + remote + '/',
		direction: { pull: false, push: true }, 
		live: false, retry: false });
	    
	    await replicationStateTemplatePush.complete$
		.filter((res)=>{res==true})
		.toPromise().then((completed)=>{
		    console.dir(`push ${remote}:${completed}`)
		    // replicationStateTemplatePush.cancel()
		})
	}

	// One or the other happens, and cancels replication state
	
	//  - can't await, b/c won't ERROR happen on 2nd login
	//  - so, we'll immediately be retrying in setupReplication
	//    while this attempts to template pull, disconnect, and push
	
	const p1 = replicationStateUserPull.error$.toPromise()
	      .then(userPullError)

	// Do nothing until this state is satisfied
	const p2 = replicationStateUserPull.complete$
	      .filter((completed)=>completed).toPromise()
	      .then(userPullCompleted)

	await Promise.race([p1, p2]).then((result) => {
	    console.dir(`race ${result}`)
	})
	// now can push/pull to user remote normally (HOPEFULLY!)	
    }

    async notWorkingRxDBFault(collection, username, dbName, recur) {
	// 1. try pull existing remote
	const remote = (recur ? dbName + username : dbName)
	const replicationState = await collection.sync({
	    remote: syncURL + remote + '/',
	    direction: { pull: true, push: false }, // push once created
	    live: false, retry: false });
	console.dir(`${remote}`)
	const replicate = (count) => async (completed) => {
	    console.dir(`${remote}:${completed}`)
	    toast(`${remote}:${completed}`)		
	    if (!recur || completed) {
		// will switch to real replication eventually
		// replicationState.cancel() 
		console.dir({existing: recur})
		// temporary
		const save = collection.sync({
		    remote: syncURL + dbName + username + '/',
		    direction: { pull: false, push: true },
		    live: false, retry: false });
		console.dir(`save:`)
		await save.complete$.first().toPromise().then(
		    completed => console.dir({saved: true}))
	    } else if (recur && count) {
		await this.templateReplication(
		    collection, dbName, username, false)
	    } else {
		console.dir({saved: false, error: dbName});
	    }
	}
	// TODO error handle
	replicationState.error$.subscribe(
	    error => {
		toast('Todo');
		console.dir(error)		
	    })	
	await replicationState.complete$.first().toPromise().then(
	    // now push to remote
	    // TODO need to do TWICE for some reason?
	    replicate(0)
	)	    	
	await replicationState.complete$.first().toPromise().then(
	    replicate(1)
	)	    	
    }

    getDocsSubscription(collection, name) {
	// Subscribe to query to get all documents
	const sub = collection 
	      .find().sort({id: 1}).$.subscribe(
		  (docs) => {
		      toast('need ' + name);
		      if (!docs)
			  return;
		      toast('reloading ' + name);
		      this.docsSubscribed(docs); 
		  });
	this.subscribe(sub);
    }

    // Old/Original Recipe    
    setupReplication(collection, dbName) {
	// App is ready for multi-user behavior
	const replicationState = collection.sync({
	    remote: syncURL + dbName + '/'
	});
	this.subscriptions.push(
	    replicationState.change$.subscribe(
		change => {
		    toast('change');
		    console.dir(change)
		})
	);
	this.subscriptions.push(
	    replicationState.docs$.subscribe(
		docData => console.dir(docData))
	);
	this.subscriptions.push(
	    replicationState.active$.subscribe(
		active => toast(`active:${active}`))
	);
	this.subscriptions.push(
	    replicationState.complete$.subscribe(
		completed => toast(`completed:${completed}`))
	);
	this.subscriptions.push(
	    replicationState.error$.subscribe(
		error => {
		    toast('Error');
		    console.dir(error)
		})
	);
    }

    subscribe(sub) {
	this.subscriptions.push(sub);
    }
    
    unsubscribe() {
	this.subscriptions.forEach(sub => sub.unsubscribe());
    }
}
