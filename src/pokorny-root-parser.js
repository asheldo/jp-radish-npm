import * as language from './pokorny-language';

const langsMap = language.langsMap;

const maxWords = 128, maxLemmas = 8, maxDefinitions = 128;

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


// TODO
const keyClick = "onclick='linkKeywordLanguage(this)' href='javascript:void(0)' ";
const rootClick = "onclick='showUpdate(this.innerHTML, pieroot, roothistory)' href='javascript:void(0)'"; 				       
const definitionClick = "onclick='linkKeywordDefinition(this)' href='javascript:void(0)' ";

const externalLinks = [["Abkurzungsverzeichnis", "http://wwwg.uni-klu.ac.at/eeo/AbkuerzungsverzeichnisSprachen.pdf"]];

/*				   
    function handleRows(results) {
	var syncDom = document.getElementById('sync-wrapper');
	const mapAsc = mapRoots(results.rows);
	fillAllRootsSelect(mapAsc);
	fillAllFirstRootsSelect(mapAsc);
	//
	let groupsAndRoots = defineGroupsFromRoots(mapAsc);
	let groups = groupsAndRoots.groups;
	groupRoots = groupsAndRoots.groupRoots;       
	fillRootGroupsSelect(groups);

	syncDom.innerHTML = 'pokorny-radish ready!';
    }
*/


/****************************
 * Parse word and lemma links
 */

export function parseContent(root) {
    var contents = root;
    contents = parseGermanMeaning(contents, 0, germanRegEx);
    contents = parseDefinitions(contents, 0, meaningRegEx, 1, 2);
    contents = parseDefinitions(contents, 0, defRegEx, maxDefinitions, 1);
    contents = parseContentsAndLemmas(false, contents, 0);
    contents = parseContentsAndLemmas(true, contents, 0);
    contents = parseLinks(contents, 0, hrefRegEx, maxDefinitions,
			  0);
    const content = "<pre>" + contents + "</pre>";
    // console.log(root + "\n" + content);
    return content;
}

    function parseContentsAndLemmas(doGreek, root, level) {
	var content = "";
	var q = '"';
	var matchs = root.match(doGreek?greekRegEx:langRegEx);
	// console.log(matchs);
	if (matchs == null) {
	    return root;
	} else {
	    const lang = langsMap[matchs[1].replace(".","").toLowerCase()];
	    const langQ = q + lang + q;
	    const word = matchs[(doGreek?greekRegExCount:langRegExCount) + 2];
	    const sep = matchs[(doGreek?greekRegExCount:langRegExCount) + 3];
	    const first = matchs.index + 1 + matchs[1].length;
	    const second = first + word.length + sep.length; // 9 lang + 2
	    content += root.substring(0, first) + "</pre>";
	    const link = "<a href='javascript:void(0)' onclick='linkLanguage("+langQ+",this)'>";
	    // console.log(link);
	    content += link + word + "</a>" + sep + "<pre>";
	    // recurse a few times
	    const next = root.substring(second);
	    if (level < maxWords) {
		content += parseContentsAndLemmas(doGreek, next, level+1);
	    } else {
		content += next;
	    }
	    // console.log("" + level + ": " + matchs[1] + " -> " + link);
	    return doGreek ? content : parseLemmas(content, 0);
	}
    }

    function parseLemmas(root, level) {
	var content = "";
	var matchs = root.match(lemmaRegEx);
	// console.log(matchs);
	if (matchs == null) {
	    return root;
	} else {
	    // const lang = q + langsMap[matchs[1].replace(".","").toLowerCase()] + q
	    const lemma = matchs[2];
	    const first = matchs.index + matchs[1].length;
	    const second = first + 1 + lemma.length; // 9 lang + 2
	    const link = "<a " + rootClick + ">";
	    content += root.substring(0, first) + "</pre>";
	    content += link + lemma + "</a>" + "<pre>";
	    // recurse a few times
	    const next = root.substring(second);
	    if (level < maxLemmas) {
		content += parseLemmas(next, level+1);
	    } else {
		content += next;
	    }
	    // console.log("" + level + ": " + matchs[1] + " -> " + link);
	    return content;
	}
    }

    /**
     *
     */
    function parseLinks(root, level, regEx, maxDef, text) {
        return parseDefinitionsAndLinks(root, level, regEx, maxDef, text, null);
    }

    function parseGermanMeaning(root, level, regEx) {
	var langQ = '"germ"';
	const link = " href='javascript:void(0)' onclick='linkLanguage("+langQ+",this)'";
        return parseDefinitionsAndLinks(root, level, regEx, 1, 2, link);
    }

    function parseDefinitions(root, level, regEx, maxDef, text) {
        return parseDefinitionsAndLinks(root, level, regEx, maxDef, text, definitionClick);
    }

    function parseDefinitionsAndLinks(root, level, regEx, maxDef, text, href) {
	var content = "";
	var matchs = root.match(regEx);
	// console.log(matchs);
	if (matchs == null) {
	    return root;
	} else {
	    let skip = 0;
	    for (var i=1; i<text; ++i)
		skip += matchs[i].length;
	    content += root.substring(0, matchs.index + skip + 1);
	    const def = matchs[text].substring(1).replace("\n", "\n ");
	    const link = "<a " + (href==null
				  ? "href='"+def+"' target=" + level
				  : href) + ">";
	    content += link + def + "</a>";
	    if (href==null) {
		// console.log("url");
	    } else {
		// console.log(link);
	    }
	    // recurse a few times
	    const next = root.substring(matchs.index + skip + matchs[text].length);
	    if (++level < maxDef) {
		content += parseDefinitionsAndLinks(next, level, regEx, maxDef, text, href);
	    } else {
		content += next;
	    }
	    return content;
	}
    }
    
    /**
     * and the link handlers parsed above
     */
    function linkLanguage(lang, link) {
	linkLanguageBase(lang, link);
	// return saveHistory(lastSelect.options[lastSelect.selectedIndex].text,
	//		   lastSelect.value, roothistory);
    }
    
    function linkLanguageBase(lang, link) {
	var iekeyword = document.getElementById("iekeyword");
	iekeyword.scrollIntoView(false);
	iekeyword.value = link.innerHTML.replace("`","").replace("'");
	var ielang = document.getElementById("ielanguage");
	// console.log(ielang.value + "->" + lang);
	ielang.value = lang;
    }
    
    /**
     * no history save
     */
    function linkKeywordLanguage(link) {
	var ielangKey = document.getElementById("ielanguageKeyword");
	return linkLanguageBase(ielangKey.value, link);
    }

/** date: 2017-12-10 */
function linkKeywordDefinition(link) {
    var note = document.getElementById("note");
    var lastiekeyword = document.getElementById("lastiekeyword");	
    var iekeyword = document.getElementById("iekeyword");
    note.scrollIntoView(false);
    let value = link.innerHTML;
    if (value.substring(0, 1) === "`") 
	value = value.substring(1, value.length-1);
    if (iekeyword.value === lastiekeyword.value)
	note.value += value;
    else
	note.value = value;
    lastiekeyword.value = iekeyword.value;
}

/** END **/
