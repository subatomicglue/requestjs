#!/usr/bin/env node

const request = require('./request').init( require( 'request' ) ).request;
const requestAuth = require('./request').init( require( 'request' ) ).requestAuth;


// main entrypoint
(async () => {
  let result

  // request json data  (https://jsonplaceholder.typicode.com/ fake endpoint)
  result = await request('GET', "https://jsonplaceholder.typicode.com/todos/1", { 'Accept': 'application/json', 'Content-Type': 'application/json' } );
  console.log( result );

  // request a webpage
  result = await request('GET', "https://www.google.com", { 'Accept': 'text/html' } );
  console.log( result );

})();  // <<-- call it right away


