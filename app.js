//. app.js
var express = require( 'express' ),
    axiosBase = require( 'axios' ),
    app = express();

require( 'dotenv' ).config();

//. env values
var settings_apikey = 'API_KEY' in process.env ? process.env.API_KEY : ''; 

var settings_port = 'PORT' in process.env ? process.env.PORT : 8080; 
var settings_cors = 'CORS' in process.env ? process.env.CORS : ''; 

app.use( express.static( __dirname + '/public' ) );
app.use( express.Router() );

app.all( '/*', function( req, res, next ){
  if( settings_cors ){
    var origin = req.headers.origin;
    if( origin ){
      var cors = settings_cors.split( " " ).join( "" ).split( "," );

      //. cors = [ "*" ] への対応が必要
      if( cors.indexOf( '*' ) > -1 ){
        res.setHeader( 'Access-Control-Allow-Origin', '*' );
        res.setHeader( 'Access-Control-Allow-Methods', '*' );
        res.setHeader( 'Access-Control-Allow-Headers', '*' );
        res.setHeader( 'Vary', 'Origin' );
      }else{
        if( cors.indexOf( origin ) > -1 ){
          res.setHeader( 'Access-Control-Allow-Origin', origin );
          res.setHeader( 'Access-Control-Allow-Methods', '*' );
          res.setHeader( 'Access-Control-Allow-Headers', '*' );
          res.setHeader( 'Vary', 'Origin' );
        }
      }
    }
  }
  next();
});

app.get( '/', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  res.write( JSON.stringify( { status: true }, null, 2 ) );
  res.end();
});

app.get( '/api/scc/reports/:instance_id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var instance_id = req.params.instance_id;
  var result0 = await getAccessToken( settings_apikey );
  if( result0 && result0.access_token ){
    var result1 = await getReports( result0.access_token, instance_id );
    //console.log( {result1} );
    if( result1 && result1.results ){
      res.write( JSON.stringify( { status: true, instance_id: instance_id, reports: result1.results }, null, 2 ) );
      res.end();
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: result1.error }, null, 2 ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false }, null, 2 ) );
    res.end();
  }
});

app.get( '/api/scc/report/:instance_id/:report_id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var instance_id = req.params.instance_id;
  var report_id = req.params.report_id;
  var result0 = await getAccessToken( settings_apikey );
  if( result0 && result0.access_token ){
    var result1 = await getReport( result0.access_token, instance_id, report_id );
    if( result1 && result1.result ){
      res.write( JSON.stringify( { status: true, instance_id: instance_id, report_id: report_id, report: result1.result }, null, 2 ) );
      res.end();
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: result1.error }, null, 2 ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false }, null, 2 ) );
    res.end();
  }
});


async function getAccessToken( apikey ){
  return new Promise( function( resolve, reject ){
    if( apikey ){
      var axios = axiosBase.create({
        baseURL: 'https://iam.cloud.ibm.com',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      var params = new URLSearchParams();
      params.append( 'grant_type', 'urn:ibm:params:oauth:grant-type:apikey' );
      params.append( 'apikey', apikey );

      axios.post( '/identity/token', params )
      .then( function( result ){
        if( result && result.data && result.data.access_token ){
          //console.log( 'access_token = ' + result.data.access_token );
          resolve( { status: true, access_token: result.data.access_token } );
        }else{
          resolve( { status: true, access_token: result.data.access_token } );
          resolve( { status: false, error: 'no access_token retrieved.' } );
        }
      }).catch( function( err ){
        console.log( {err} );
        resolve( { status: false, error: err } );
      });
    }else{
      resolve( { status: false, error: 'no apikey provided.' } );
    }
  });
}

async function getReports( access_token, instance_id ){
  return new Promise( function( resolve, reject ){
    if( access_token ){
      if( instance_id ){
        var axios = axiosBase.create({
          baseURL: 'https://us-south.compliance.cloud.ibm.com/',
          responseType: 'json',
          headers: {
            'Authorization': 'Bearer ' + access_token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        axios.get( '/instances/' + instance_id + '/v3/reports' )
        .then( function( results ){
          //console.log( {results} );
          if( results && results.data ){
            resolve( { status: true, results: results.data.reports } );
          }else{
            resolve( { status: false, error: 'no results found.' } );
          }
        }).catch( function( err ){
          console.log( {err} );
          resolve( { status: false, error: err } );
        });
      }else{
        resolve( { status: false, error: 'Parameter instance_id are not provided.' } );
      }
    }else{
      resolve( { status: false, error: 'access_token is null.' } );
    }
  });
}

async function getReport( access_token, instance_id, report_id ){
  return new Promise( function( resolve, reject ){
    if( access_token ){
      if( instance_id && report_id ){
        var axios = axiosBase.create({
          baseURL: 'https://us-south.compliance.cloud.ibm.com/',
          responseType: 'json',
          headers: {
            'Authorization': 'Bearer ' + access_token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        axios.get( '/instances/' + instance_id + '/v3/reports/' + report_id + '/summary' )
        .then( function( result ){
          //console.log( {result} );
          if( result && result.data ){
            resolve( { status: true, result: result.data } );
          }else{
            resolve( { status: false, error: 'no results found.' } );
          }
        }).catch( function( err ){
          console.log( {err} );
          resolve( { status: false, error: err } );
        });
      }else{
        resolve( { status: false, error: 'Parameter instance_id, and/or report_id are not provided.' } );
      }
    }else{
      resolve( { status: false, error: 'access_token is null.' } );
    }
  });
}

app.listen( settings_port );
console.log( "server starting on " + settings_port + " ..." );
