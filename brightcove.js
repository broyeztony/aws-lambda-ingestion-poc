'use strict';

const credentials = {
    client: {
        id: "your-client-id",
        secret: "your-client-secret"
    },
    auth: {
        tokenHost: 'https://oauth.brightcove.com',
        tokenPath: '/v3/access_token'
    }
};

// Initialize External Libraries
const oauth2        = require('simple-oauth2').create(credentials);
const request       = require('request');
const moment        = require('moment');
const domains       = require('./domains.js');
const persistence   = require('./persistence.js');
const tokenConfig   = { };

const contentOwnerId                = -1; //
const contentOwnerIdentifierId      = -1; //

exports.pushNotificationHandler = function(event, context, callback) {

    console.log( "Receive Brightcove Notification -> ", event.body );

    var body            = JSON.parse( event.body );

    if( !(body.hasOwnProperty('timestamp') &&
          body.hasOwnProperty('account_id') &&
          body.hasOwnProperty('video') &&
          body.hasOwnProperty('event') &&
          body.hasOwnProperty('version') )) { return };

    var accountId       = body.account_id;
    var videoId         = body.video;

    oauth2.clientCredentials.getToken(tokenConfig, (error, result) => { // Step 1 -> get OAuth2 token to query Brightcove

        if (error)
            return console.log('Access Token Error', error.message);

        return oauth2.accessToken.create(result);
    })
    .then( (result) => { // Step 2 -> Request this particular video metadata


        var access_token    = result.access_token;
        var getVideoUrl     = "https://cms.api.brightcove.com/v1/accounts/" + accountId + "/videos/" + videoId;

        var options         = {
            url: getVideoUrl,
            headers: {
                'Authorization': 'Bearer ' + access_token
            }
        };

        console.log( "access_token -> ", access_token );
        console.log( "getVideoUrl -> ", getVideoUrl );

        request( options, (error, response, body) => {


            console.log( "body -> ", body );

            if (!error && response.statusCode == 200) {
                var metadata    = JSON.parse(body);

                var id              = metadata.id;
                var title           = metadata.name;
                var description     = metadata.description;
                var complete        = metadata.complete;
                var created_at      = metadata.created_at;
                var published_at    = metadata.published_at;
                var duration        = metadata.duration;
                var customFields    = metadata.custom_fields;
                var tags            = metadata.tags;
                var images          = metadata.images;


                if( complete == false || duration == null || id == null || title == null ) return;
                if( id.length == 0 || title.length == 0 ) return;
                // -PROCESS-THEN->


                /* Program */
                var validFrom;
                if(published_at == null || published_at.length == 0) validFrom = new Date();
                else validFrom = moment(published_at);


                var program     = new domains.Program( id, title, (duration / 1000.0), description, validFrom );
                program.hash( contentOwnerId ); // generate uniqueString

                /* Series */
                var regexp          = new RegExp("catalogues/[^/]+/tv/([^/]+)");
                var results = tags
                    .map( (tag) => {
                        return tag.toLowerCase();
                    })
                    .map( (tag) => {
                        return regexp.exec( tag )
                    })
                    .filter( (_) => {
                        return Array.isArray(_);
                    })
                    .map( (_) => {
                        return _[ 1 ];
                    });

                // console.log( "tags for Series -> ", results );
                // console.log( "properties -> ", id, title, complete, moment(created_at).unix(), duration );

                /* Custom Fields */
                var cfs = [ ];
                if(customFields != null)
                {
                    if(customFields.hasOwnProperty("start_date_nsw")){
                        var startDateNsw  = new domains.CustomField( "start_date_nsw",
                            customFields.start_date_nsw );
                        cfs.push( startDateNsw );
                    }
                    if(customFields.hasOwnProperty("key_number")){
                        var keyNumber = new domains.CustomField( "key_number",
                            customFields.key_number );
                        cfs.push( keyNumber );
                    }
                }

                /* Thumbnail */
                var thumbnail = null;
                if(images){
                    if(images.hasOwnProperty('thumbnail') && images.thumbnail != null){
                        if(images.thumbnail.hasOwnProperty('src') && images.thumbnail.src != null){
                            thumbnail   = new domains.Thumbnail( images.thumbnail.src )
                        }
                    }
                }

                /* Transaction Now
                */

                var mysql   = new persistence.MySQL();
                mysql.save( contentOwnerIdentifierId, contentOwnerId, program, cfs, thumbnail );



            }
        });
    });



    context.succeed({
        "statusCode": 200,
        "headers": { "Accept": "*/*" },
        "body": "Received notification successfully"
    });
};


