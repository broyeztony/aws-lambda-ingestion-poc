"use strict";


var brightcove = require('./brightcove.js')

var event = {
    "resource": "/brightcove",
    "path": "/brightcove",
    "httpMethod": "POST",
    "headers": {
        "CloudFront-Forwarded-Proto": "https",
        "CloudFront-Is-Desktop-Viewer": "false",
        "CloudFront-Is-Mobile-Viewer": "true",
        "CloudFront-Is-SmartTV-Viewer": "false",
        "CloudFront-Is-Tablet-Viewer": "false",
        "CloudFront-Viewer-Country": "US",
        "Content-Type": "application/json",
        "Host": "myo4fck82a.execute-api.eu-west-1.amazonaws.com",
        "User-Agent": "Brightcove BANSHI",
        "Via": "1.1 6e846ac706b330748b5f87ce8e031be4.cloudfront.net (CloudFront)",
        "X-Amz-Cf-Id": "2M8GBSm3MJbXlsAEdcOstjVcKDBNgOWX0ChSxNh0ZgaNXCgDu9WcCg==",
        "X-Amzn-Trace-Id": "Root=1-58d28cac-2617a43154d3471921d88d6d",
        "X-Forwarded-For": "52.91.208.196, 54.239.145.4",
        "X-Forwarded-Port": "443",
        "X-Forwarded-Proto": "https"
    },
    "queryStringParameters": null,
    "pathParameters": null,
    "stageVariables": null,
    "requestContext": {
        "accountId": "234522654524",
        "resourceId": "q5oonv",
        "stage": "prod",
        "requestId": "61933be9-0f0d-11e7-a6b0-6701d7dc6a79",
        "identity": {
            "cognitoIdentityPoolId": null,
            "accountId": null,
            "cognitoIdentityId": null,
            "caller": null,
            "apiKey": null,
            "sourceIp": "52.91.208.196",
            "accessKey": null,
            "cognitoAuthenticationType": null,
            "cognitoAuthenticationProvider": null,
            "userArn": null,
            "userAgent": "Brightcove BANSHI",
            "user": null
        },
        "resourcePath": "/brightcove",
        "httpMethod": "POST",
        "apiId": "myo4fck82a"
    },
    "body": "{\"timestamp\":1490193579466,\"account_id\":\"2376984109001\",\"event\":\"video-change\",\"video\":\"5373807105001\",\"version\":2}",
    "isBase64Encoded": false
};

var context = {
    succeed: function( _ ){
        console.log( _ );
    }
};

var callback = function(){};

brightcove.pushNotificationHandler( event, context, callback );