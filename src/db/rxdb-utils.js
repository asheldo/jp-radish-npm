import * as RxDB from 'rxdb';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.js';

RxDB.plugin(require('pouchdb-adapter-idb'));
RxDB.plugin(require('pouchdb-adapter-http'));

export const syncURL = 'http://192.168.0.6:5984/';
// export const syncURL = 'http://162.243.24.217:5984/';
// const uriDatabases = `http://${host}:5984/`;

export class DBSubscription {
    constructor(docsSubCallback) {
	this.docsSubscribed = docsSubCallback;
	this.subscriptions = [];
    }
    
    async createDatabase(dbName, collections, crown) {
	// password must have at least 8 characters
	const db = await RxDB.create(
	    {name: dbName,
	     adapter: 'idb',
	     password: '12345678'}
	);
	console.dir(db);
	// show who's the leader in page's title
	db.waitForLeadership().then(() => {
	    document.title = crown + document.title;
	});
	// create collection
	//	collections.forEach(async ({name, schema}) => {
	const name = collections[0].name;
	const schema = collections[0].schema;
	const collection = await db.collection({
	    name: name,
	    schema: schema
	});
	console.dir(collection);
	// set up replication
	await this.setupReplication(collection, dbName);
	this.getDocsSubscription(collection, name);
//	});
	return db;
    }

    getDocsSubscription(collection, name) {
	// Subscribe to query to get all documents
	const sub = collection // this.translationsDB.translations
	      .find().sort({id: 1}).$.subscribe(
		  (docs) => // (lines) =>
		  {
		      toast('need ' + name);
		      if (!docs)
			  return;
		      toast('Reloading ' + name); // translations');
		      this.docsSubscribed(docs); // setState({lines: lines}); 
		  });
	this.subscribe(sub);

    }
    
    // App is ready for multi-user behavior
    setupReplication(collection, dbName) {
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
