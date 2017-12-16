const languages = [["idg","idg","Proto Indo-European (PIE)"],
		   ["hitt","hitt","Hittite"],
		   ["old indian","old indian","Old Indian"],
		   ["gr","gr","Greek"],["maked","maked","Macedonian"],["phryg","phryg","Phyrigian"],
		   ["av","av","Avestan"],["av","avest","Avestan"],
		   ["lat","lat","Latin"],
		   ["russ","russ","Russian"],["old church slavic","old church slavic","Old Church Slavic"],["slav","slav","Slavic"],["čech","čech","Czech"],["slov","slov","Slovenian"],
		   ["lit","lit","Lithuanian"],
		   ["alb","alb","Albanian"],
		   ["got","got","Gothic"],["germ","germ","German"],["as","as","Alt/Old Saxon"],["ags","ags","Anglo-Saxon"],["aisl","aisl","Old Icelandic"],
		   ["schwed","schwed","Swedish"],
		   ["ahd","ahd","Old High German"],["nhd","nhd","Modern German"],
		   ["mengl","mengl","Middle English"],["engl","engl","English"],
		   ["cymr","cymr","Cymrian"],["air","air","Old Irish"],["mir","mir","Irish"],
		   ["illyr","illyr","Illyrian"],["ven.-ill","ven.-ill","Veneto-Illyrian"],
		   ["arm","arm","Armenian"],
		   ["hes","hes","Hessian"],
		   ["toch","toch","Tocharian A|B"]];
//  export self map
export const langsMap = {};
languages.forEach((lang) => { langsMap[lang[1]] = lang[0]; });

// export const langs = () => languages.map((pair) => pair[0]);
export function langs() {
    const list = languages.sort().map((pair) => pair[0]);
    return list;
}
export function languagesValAndName() {
    const list = languages.sort().map((pair) => {
	return { val: pair[0], name: pair[2] }
    });
    return list;
}

