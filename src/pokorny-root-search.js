var PouchDB = require('pouchdb-browser');
PouchDB.plugin(require('pouchdb-quick-search'));

export function index(db) {
    db.search({
	fields: ['content'],
	build: true
    }).then(function (info) {
	console.log("index");
	// if build was successful, info is {"ok": true}
    }).catch(function (err) {
	// handle error
	console.log(err);
    });
}

export async function search(db, ieWords) {
    //    return null;
    const words = ieWords.split("=");
    const root = words[0], definition = words[words.length ? 1 : 0];
    console.log(root + " " + definition);
    const matcher = new RegExp("\/" + root.substring(0,1));
    var i = 0;
    const result = await db.search({
	query: definition,
	fields: ['content'],
	limit: 2,
	filter: function (doc) {
	    const incl = matcher.test(doc._id); //. === 'person'; // only index persons
	    if (incl && ++i < 200)
		console.log(doc._id);
	    return incl;
	},
	highlighting: true
//     }).then(function (result) {
	 // handle results	 
//     }).catch(function (err) {
	// handle error
    });
    console.log(result);
    if (result && result.rows && result.rows.length > 0) {
	const id = result.rows[0].id;
	const root = await db.get(id);
	console.log(root);
	return root;
    }
    return null;
}
    
/*



*/

