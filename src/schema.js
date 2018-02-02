// schema.js

// simple one:
export const wordsDBName = 'pokornyx17121101';
const pokornyWordsSchema = {
    title: 'hoard words schema',
    description: 'Database schema for a word-hoard',
    version: 0,
    type: 'object',
    properties: {
	id: {
	    type: 'string',
	    primary: true
	},
	ieLang: {
	    type: 'string'
	},
	ieWords: {
	    type: 'string'
	}
    },
    required: ['ieLang','ieWords']
}

export const wordsCollections = [{name: 'words', schema: pokornyWordsSchema}];

// Much bigger schema:
export const translationsDBName = 'ietranslations17122704';
const pokornyTranslationsSchema = {
    title: 'ancient literature schema',
    description: 'collection schema for ancient literature line-based word-hoard',
    version: 0,
    type: 'object',
    properties: {
	id: {
	    type: 'string',
	    description: 'ieWork@lineLocator',
	    primary: true
	},
	timestamp: {
	    type: 'string',
	    description: 'create (update) date'
	},
	ieLang: {
	    type: 'string',
	    description: 'source language'
	},
	ieWords: {
	    type: 'string',
	    description: 'line content'
	},
	lineLocator: {
	    type: "object",
	    properties: {
		work: {
		    type: "string",
		    description: 'e.g. Beowulf (circa 8th-c.)'
		},
		book: {
		    type: "string",
		    description: "e.g. Matthew"
		},
		chapter: {
		    type: "integer",
		    minimum: 1
		},
		verse: {
		    type: "integer",
		    minimum: 1
		},
		line: {
		    type: "integer",
		    minimum: 1
		}
	    },
	    required: ['work','line']	
	},
	wordEtymonLemmas: {
	    type: "array",
	    maxItems: 100,
	    uniqueItems: true,
	    item: {
		type: "object",
		properties: {
		    ieWord: {
			type: 'string',
			description: 'word in line (not unique)'
		    },
		    timestamp: {
			type: 'string'
		    },
		    etymonLemmas: {
			type: 'string',
			description: 'free text maybe markdown'
		    }
		},
		required: ['ieWord','timestamp']
	    }
	},
	lineTranslations: {
	    type: "array",
	    maxItems: 50,
	    uniqueItems: true,
	    item: {
		type: "object",
		properties: {
		    timestamp: {
			type: 'string',
			description: 'timestamp'
		    },
		    transLang: {
			type: 'string'
		    },
		    transWords: {
			type: 'string',
		    },
		    references: {
			type: 'string'
		    }
		},
		required: ['transLang', 'transWords', 'timestamp']
	    }
	}
    },
    required: ['timestamp','ieLang','ieWords',
	       'lineLocator','lineTranslations','wordEtymonLemmas']
}

export const translationsCollections = [{name: 'translations',
					schema: pokornyTranslationsSchema}];
