"use strict";

const mysql     = require('mysql');
const domains   = require('./domains.js');


class MySQL {

    constructor(){
        this.connection  = mysql.createConnection({
            host            : 'localhost',
            user            : 'root',
            password        : 'root',
            database        : 'local'
        });

        this.connection.connect();
    }

    terminate( error ){

        if(error){
            console.log(error);
        }

        console.log("close connection. return.");
        this.connection.end();
    }

    save( coiid, coid, program, customFields, thumbnail ){

        // Step 1 -> Check Program Exist (e.g. same id in ContentIdentifierInventory)
        var checkExist = "SELECT * FROM ContentIdentifierInventory WHERE identifier = ? " +
            "AND contentOwnerIdentifierId = ?";
        this.connection.query(
            checkExist,
            [ program.id, coiid ],
            (error, result, fields) =>   {

                if(error) {
                    this.terminate( error );
                    return;
                }
                if(result.length > 0) {
                    this.terminate( "This program identifier is already in Db -> " + JSON.stringify(result[ 0 ]) );
                    return;
                }

                // - TRANSACTION ->
                this.connection.beginTransaction((err) => {
                    if (err) {
                        this.terminate( err );
                        return;
                    }

                    // Step 2 -> Create Inventories: Program, then, Thumbnail
                    this.connection.query(
                    'INSERT INTO Inventory SET ?',
                    new domains.Inventory(coid, 1),
                    (error, results) => {
                        if (error) {
                            this.connection.rollback((err) => { });
                            this.terminate( error );
                            return;
                        }

                        var programInventoryId = results.insertId;

                        this.connection.query(/* Thumbnail Inventory */
                        'INSERT INTO Inventory SET ?',
                        new domains.Inventory(coid, 3),
                        (error, results) =>
                        {
                            if (error) {
                                this.connection.rollback((err) => { });
                                this.terminate( error );
                                return;
                            }

                            var thumbnailInventoryId = results.insertId;

                            console.log([programInventoryId, thumbnailInventoryId]);

                            this.connection.query(/* Insert Default thumbnail, which will be updated
                                                     later by Thumbnail Batch Process */
                            "INSERT INTO Thumbnail SET ?",
                            {
                                id: thumbnailInventoryId,
                                inventoryId: thumbnailInventoryId,
                                fileName: "thumbnail_not_available.png",
                                sha1: "152d32de3c4076309a7eda14c496d7e3c50e5848"
                            },
                            (error, results) => {

                                if (error) {
                                    this.connection.rollback((err) => { });
                                    this.terminate( error );
                                    return;
                                }

                                this.connection.query(/* Program */
                                'INSERT INTO Program SET ?',
                                {
                                    id: programInventoryId,
                                    inventoryId: programInventoryId,
                                    duration: program.duration,
                                    title: program.title,
                                    uniqueString: program.uniqueString,
                                    description: program.description,
                                    thumbnailId: thumbnailInventoryId,
                                    validFrom: program.validFrom
                                },
                                (error, results) =>
                                {
                                    if (error) {
                                        this.connection.rollback((err) => {});
                                        this.terminate( error );
                                        return;
                                    }

                                    this.connection.query(/* ContentIdentifierInventory */
                                    'INSERT INTO ContentIdentifierInventory SET ?',
                                    {
                                        contentOwnerIdentifierId: coiid,
                                        identifier: program.id,
                                        inventoryId: programInventoryId
                                    },
                                    (error, results) => {
                                        if (error) {
                                            this.connection.rollback((err) => {});
                                            this.terminate( error );
                                            return;
                                        }

                                        this.connection.query(/* Inventory2Thumbnail */
                                        'INSERT INTO Inventory2Thumbnail SET ?',
                                        {
                                            thumbnailId: thumbnailInventoryId,
                                            thumbnailSrc: thumbnail.src
                                        },
                                        (error, results) => {
                                            if (error) {
                                                this.connection.rollback((err) => {});
                                                this.terminate( error );
                                                return;
                                            }

                                            var customFieldQuery = "INSERT INTO Program2CustomField " +
                                                "(programId, customFieldId, customFieldValue) VALUES " +
                                            customFields.map( (field) => {

                                                return "(" + [  programInventoryId,
                                                        domains.CustomField.translate( field.name ),
                                                        '"' + field.value + '"'
                                                    ]
                                                        .join(",") + ")";
                                            }).join(",");

                                            console.log( "customFieldQuery -> ", customFieldQuery );

                                            this.connection.query( customFieldQuery,
                                            (error, results) => {
                                                if (error) {
                                                    this.terminate( error );
                                                }

                                                console.log("results -> ", results);
                                            });

                                            this.connection.commit((err) => { /* -COMMIT-> */
                                                if (error) {
                                                    this.connection.rollback((err) => { });
                                                    this.terminate( error );
                                                    return;
                                                }

                                                console.log('-PROGRAM-INSERTION-SUCCESS->');
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                }); // .Transaction
            }); // .CheckExists
    }

}

exports.MySQL   = MySQL;