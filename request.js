//const util = require('util');

module.exports.__request = undefined; // = require('request')

module.exports.init = function init( request_require /* require('request') */ ) {
  module.exports.__request = request_require
  return module.exports
}

// Make a HTTP request.
// same parameter interface to subatomicglue's xhr() https://github.com/subatomicglue/xhrjs, interchangable...
// auto converts JSON <--> Javascript object (hey, it's a 1st class datatype to javascript, let's treat it like one)
// headers is typically: {'Content-Type': 'application/json; charset=utf-8', 'Accept': 'application/json' }
// - To auto-stringify the data Javascript Object into a string for sending:  pass {'Content-Type': 'application/json; charset=utf-8' } into the headers param
// - To auto-parse the response body JSON into a JavaScript Object:  pass {'Accept': 'application/json'} into the headers param
module.exports.request = function( type /* PUT, GET, POST, DELETE */, url, headers = {'Content-Type': 'application/json; charset=utf-8', 'Accept': 'application/json' }, data = undefined, progressCB = (o, body, AbortFunc) => {}, options_unused = {} ) {
  const request = module.exports.__request;

  type = (typeof type == "string") ? type.toUpperCase() : type;
  if (headers && headers['Content-Type'] && headers['Content-Type'].match('application/json')) {
    data = JSON.stringify( data );
  }

  let options = {
      url: url,
      headers: headers,
  };
  if (data)
    options.body = data;

  if (options.url && options.url.substr( 0, 5 ) == "https") {
    options.rejectUnauthorized = false;
  }
  return new Promise( (rs, rj) => {
    // call get, post, del, put, or error func
    (
      type == 'GET'  ? request.get  :
      type == 'DEL'  ? request.del  :
      type == 'DELETE'  ? request.del  :
      type == 'POST' ? request.post :
      type == 'PUT'  ? request.put  :
      type == 'PATCH'  ? request.patch  :
      // if not GET/DEL/POST/PUT given, then fall back to this error function
      ()=>{ console.error( `type "${type}" is undefined in httpRequest`)}
    )( options, function (error, response, resbody) {
      // record some diagnostics about the original call:
      let res = {};
      res.sentRequestType = type;
      res.sentUrl = url;
      res.sentHeaders = headers;
      if (data) res.sentBody = data;
      res.sentOptions = options;
      res.body = (response && response.body) ? response.body : resbody;
      res.status = response ? response.statusCode : 500

      // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
      // conversion translates it to FEFF (UTF-16 BOM)
      // https://en.wikipedia.org/wiki/Byte_order_mark
      if (typeof res.body === 'string' && res.body.charCodeAt(0) === 0xFEFF) {
        res.body = res.body.slice(1);
      }

      if (response) {
        res.headers = response.headers;

        // decode the body
        if (headers['Accept'] && headers['Accept'].match('application/json') && res.body !== undefined) {
          try {
            res.body = JSON.parse( res.body );
          } catch (err) {
            res.body = { error: `exception decoding body with JSON.parse()`, err, response_body: response.body, resbody: resbody, type: type, headers: headers, url: url  };
          }
        }
        else {
          res.body = response.body;
        }
      }
      if (error) {
        res.error = error;
      }
      return rs( res );
    });
  });
}

// Makes an authorized HTTP(S) request to the oauth2 protected backend.  (or use httpRequest() directly with your own Authorization header.)
// WARNING: user must be logged in (e.g. retrieved a valid access_token) before making this call.
//
// NOTE:
// To auto-parse the response body JSON into a JavaScript Object:  pass {'Accept': 'application/json'} into the headers param
// headers is typically: {'Content-Type': 'application/json; charset=utf-8', 'Accept': 'application/json' }
module.exports.httpRequestAuth = function( access_token, type, url, headers = {'Content-Type': 'application/json; charset=utf-8', 'Accept': 'application/json' }, data = undefined, progressCB = (p, b, AbortFunc) => {} ) {
  if (access_token == undefined || access_token == '') {
    return { status: 401, body: {}, error: "no access token" };
  }

  headers['Authorization'] = 'Bearer ' + encodeURIComponent( access_token );
  return module.exports.httpRequest( type, url, headers, data, progressCB );
}

module.exports.basicAuthGenerator = function( username, password ) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}


