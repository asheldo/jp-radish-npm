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

export async function search(db, ieWords, limit) {
    //    return null;
    const words = ieWords.split("=");
    const root = words[0], definition = words[words.length ? 1 : 0];
    console.log(root.substring(0,1) + " " + definition);
    const matcher = new RegExp(// "\/" +
	root.substring(0,1));
    var i = 0;
    const result = await db.search({
	query: definition,
	fields: ['content'],
	limit: limit,
	filter: function (doc) {
	    const start = parseInt(doc.pageStart);
	    const incl = matcher.test(doc._id) || start < 25; 
	    return incl;
	},
	highlighting: true
    });
    console.log(result ? result.rows.length : 0);
    if (result && result.rows && result.rows.length > 0) {
	console.log(result.rows.length);
	// const id = result.rows[0].id;
	//	    const root = await db.get(id);
	//    console.log(root);
	//    return root;
	const ids = result.rows.map((row) => row.id);
	console.log(ids);
	const roots = await db.allDocs({keys: ids, include_docs: true});
	return roots.rows.map((row) => row.doc);
    }
    return [];
}
    
/*



*/

