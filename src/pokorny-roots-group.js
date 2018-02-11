// pokorny-roots-group

var rootGroups;
var allRoots = [];
var groupRoots = [];
var allFirstRootsOptions = [];

const defRegEx = /((\s`[^<\.`]*')|(phonetic mutation))/;
const germanRegEx = /(German meaning:\*)( `.*')/;
const meaningRegEx = /(English meaning:\*)( [^\n]*)/;
const hrefRegEx = /(\bhttp[s]?:\/\/[^\s]*\b)[\s\.\,\)]/;

const lemmaRegEx = /(\*Root \/ lemma:[^\/]*)(\/[^`']*)(\s:\*\s`)/;
const idGroupRegEx = /\/([*]{0,1}[(]{0,1}[^(]{0,1}[)]{0,1}[^)]{0,1})/u;
// short versions
const firstRootRegEx = /\/([^/]{2,20})[,\/]{1}/;

const greekRegEx = /((\b[Gg]r\.)|([Mm]aked\.)|([Pp]hryg\.))\s([^,\s]*)([,\s]*)/;
const greekRegExCount = greekRegEx.source.split("|").length;
const langRegEx = /((\b[Hh]itt\.)|(\b[Ll]it\.)|(\b[Aa]lb\.)|(\b[Rr]um\.)|([Ll]ett\.)|([Rr]uss\.)|([Ss]lav\.)|(čech\.)|([Ss]lov\.)|(\b[Hh]es\.)|(Old Church Slavic)|(Old Indian)|(\baisl\.)|(schwed\.)|(nhd\.)|(mhd\.)|(ahd\.)|([Gg]ot\.)|(\bas\.)|(\b[Ee]ngl\.)|(mengl\.)|(\bags\.)|([Gg]erm\.)|(air\.)|(mir\.)|(\b[Aa]rm\.)|([Ii]llyr\.)|([Cc]ymr\.)|([Mm]cymr\.)|(\bav\.)|([Aa]vest\.)|(ven\.-ill\.)|(\b[Ll]at\.)|(\b[Tt]och\. B)|(\b[Tt]och\. A))\s(\/[^\/]*\/)([,\s]*)/;
const langRegExCount = langRegEx.source.split("|").length;


export function handleRows(results) {
    try {
	// var syncDom = document.getElementById('sync-wrapper');
	const mapAsc = mapRoots(results.rows);
	fillAllRootsSelect(mapAsc);
	fillAllFirstRootsSelect(mapAsc);
	//
	let groupsAndRoots = defineGroupsFromRoots(mapAsc);
	let groups = groupsAndRoots.groups;
	groupRoots = groupsAndRoots.groupRoots;       
	fillRootGroupsSelect(groups);
	// syncDom.innerHTML = 'pokorny-radish ready!';
	// return results;
    } catch (err) {
	console.log(err);
    }
}

export function fetchRootGroupsOptions() {
    // let select = document.getElementById("groups");
    return rootGroups; // select.options[0] = new Option("", "");
}

export function fetchAllFirstRootsSelect() {
//	let select = document.getElementById("allfirstroots");
    return allFirstRootsOptions; // select.options[0] = new Option("", "");
    // todo
    // select.options[select.options.length] = new Option(match[1], id);
}

// array of duals/arrays
export function fetchAllRootsOptions() {
    // let select = document.getElementById("allroots");
    // select.options[0] = new Option("", "");
    return allRoots;
}

/**
 * one alpha group of roots
 */    
export function listGroupRoots(groupSelect) {
    let group = groupSelect.options[groupSelect.selectedIndex].value;
    // let rootsOut = document.getElementById("docs");
    // rootsOut.options.length = 0;
    //	rootsOut.options[0] = new Option("", "");
    return groupRoots[group].map((root) => [root, root]);
}

function fillRootGroupsSelect(groups) {
    rootGroups = groups.map((group) => [group,group]);
	// (<option key={group} value={group}>group</option>));
}


    function mapRoots(roots) {
	let map = new Map();
	let ids = {};
	roots.forEach(function(root) {
	    let id = root.doc._id.trim();
	    if (ids[id] == null) {
		let pageStart = 10000 + parseInt(root.doc.pageStart);
		while (map.get(pageStart)) {
		    pageStart += 0.01;
		}
		map.set(pageStart, id);
		ids[id] = 1;
		if (pageStart < 10030.0) {
		    // console.log(id + "\n" + root.doc);
		}
	    }
	});
	let mapAsc = new Map([...map.entries()].sort());
	return mapAsc;
    }
    
    function defineGroupsFromRoots(mapAsc) {
	let groups = [];
	let groupRoots = {}
	Array.from(mapAsc.values()).forEach( id => {
	    let matchs = id.match(idGroupRegEx);
	    if (matchs == null) {
		// groups[groups.length] = {};
	    } else if (matchs.length > 1) {
		const first = matchs[1];
		if (groupRoots[first] == null) {
		    groups[groups.length] = first;
		    groupRoots[first] = [ id ];
		} else {
		    let r = groupRoots[first];
		    r[r.length] = id;      
		}
	    }
	});
	const groupsAndRoots = {};
	console.log(groups);
	groupsAndRoots.groups = groups;
	groupsAndRoots.groupRoots = groupRoots;
	return groupsAndRoots;
    }

function fillAllRootsSelect(map) {
    allRoots.length = 0;
    var last = "";
    for (var [pageStart, id] of map.entries()) {
	let name = id.length <= 24 ? id : id.substring(0, 24);
	if (id !== last) {
	    allRoots[allRoots.length] = [name, id];
		// (<option key={name} value={name}>id</option>);
	    last = id;
	} else {
	    console.log("dupe:" + last);
	}
    };
}
    
/**
 *
 */

function fillAllFirstRootsSelect(map) {
    var last = "";				     
    for (var [pageStart, id] of map.entries()) {
       	let match = id.match(firstRootRegEx);
	if (match != null && match.length > 1 && id !== last) {
	    allFirstRootsOptions[allFirstRootsOptions.length] = [match[1], id];
		   //  <option key={id} value={match[1]}>id</option>);		
	    last = id;
       	} else {
	    console.log("dupe:" + last);
	}
    };
}

