
function linkLanguageBase(lang, link) {
    // var iekeyword = document.getElementById("iekeyword");
    // iekeyword.scrollIntoView(false);
    // iekeyword.value = link.innerHTML.replace("`","").replace("'");
    // var ielang = document.getElementById("ielanguage");
    // console.log(ielang.value + "->" + lang);
    // ielang.value = lang;
}
 
function linkKeywordLanguage(link) {
    // var ielangKey = document.getElementById("ielanguageKeyword");
    // return linkLanguageBase(ielangKey.value, link);
}

/** date: 2017-12-10 */
export function linkKeywordDefinition(link) {
    // var note = document.getElementById("note");
    // var lastiekeyword = document.getElementById("lastiekeyword");	
    // var iekeyword = document.getElementById("iekeyword");
    // note.scrollIntoView(false);
    let value = link.innerHTML;
    if (value.substring(0, 1) === "`") 
	value = value.substring(1, value.length-1);
    // if (iekeyword.value === lastiekeyword.value)
    window.prompt("Copy to clipboard: Ctrl+C, Enter", value);
}
