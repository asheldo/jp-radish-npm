import * as RxDB from 'rxdb';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';

RxDB.plugin(require('pouchdb-adapter-idb'));
RxDB.plugin(require('pouchdb-adapter-http'));

const domain = process.env.REACT_APP_COUCHDB_DOMAIN;
const port = process.env.REACT_APP_COUCHDB_PORT;
export const syncURL = `http://${domain}:${port}/`;

const translationDbPassword = process.env.REACT_APP_TRANS_DB_PASSWORD;

/* 
   Original Recipe:
   1. [db name, collection name, collection schema]
   2. await create db in RxDB from above w/ idb and pwd
   3. await leader db
   4. await collection
   5. await replication
   6. await subscription

   New Recipe:
   1. [user name, db name, ? coll ? ]
   2. await create
   3. await leader
   4. await replication (from old db) - no collection?
   5. await re-replication (to new db)
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
    async newDbFromTemplate(username, dbName, collections, completion, crown) {
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
	// password must have at least 8 characters
	const db = await RxDB.create(
	    { name: dbName + username, adapter: 'idb',
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
	
	await this.templateReplication(
	    collection, username, dbName,
	    true
	);
	
	this.getDocsSubscription(collection, name);
	return db;	
    }

    // New Recipe
    /*
      1. Try replication from existing/new
      2. Fallback: replication from old/template
     */
    async templateReplication(collection, username, dbName, recur) {
	// 1. check existing
	const remote = (recur ? dbName + username : dbName)
	const replicationState = collection.sync({
	    remote: syncURL + remote + '/',
	    direction: {
		pull: true,
		push: false // will push once successfully created
	    },
	    live: false,
	    retry: false
	});
	replicationState.error$.subscribe(
	    error => {
		toast('Todo');
		console.dir(error)		
	    })		
	await replicationState.complete$.toPromise().then(
	    async (completed) => {
		toast(`${remote}:${completed}`)		
		if (completed) {
		    // will switch to real replication eventually
		    // replicationState.cancel() 
		    this.setState({existing: recur})
		    // temporary
		    const save = collection.sync({
			remote: syncURL + dbName + username + '/',
			direction: {
			    pull: false,
			    push: true
			},
			live: false,
			retry: false
		    });
		    await save.complete$.single().toPromise().then(
			completed => {
			    this.setState({saved: true})
			})
		} else if (recur) {
		    await this.templateReplication(collection,
					      dbName, username,
					      false)
		} else {
		    this.setState({saved: false});
		    console.dir("error " + dbName);
		    
		}
	    })
	    	
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
