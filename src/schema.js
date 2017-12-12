export const schema = {
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
