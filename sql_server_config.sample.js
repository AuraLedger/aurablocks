'use strict';

exports.api = {
	 userName: 'api',
	 password: 'api_password',
	 server: 'url', 
	 options: {
		  database: 'db', 
		  encrypt: true
	 }
};

exports.node = {
	 userName: 'node',
	 password: 'node_password',
	 server: exports.api.server,
	 options: exports.api.options
};
