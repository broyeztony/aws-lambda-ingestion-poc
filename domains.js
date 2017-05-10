"use strict";

const md5           = require('md5');
const randomstring  = require("randomstring");

class Inventory {
    constructor(contentOwnerId, inventoryTypeId){
        this.id = null;
        this.inventoryTypeId = inventoryTypeId;
        this.publicId = randomstring.generate(16);
        this.contentOwnerId = contentOwnerId;
        this.ready = 1;
        this.published = 1;
        this.deleted = 0;
    }
}

class Program {

    constructor (id, name, duration, description, validFrom) {
        this.id = id;
        this.title = name;
        this.duration = duration;
        this.description = description;
        this.validFrom = validFrom;
        this.uniqueString = null;
    }

    toString () {
        return `${this.id} | ${this.title} | ${this.duration} | ${this.validFrom} | ${this.uniqueString}`
    }

    getAsJsonString(){
        return JSON.stringify( { id: this.id,
                                 title: this.title,
                                 duration: this.duration,
                                 description: this.description,
                                 validFrom: this.validFrom } );
    }

    hash( contentOwnerId ){
        this.uniqueString   = md5( contentOwnerId + ":" + this.getAsJsonString() );
    }
}

class CustomField {

    constructor(name, value){
        this.name   = name;
        this.value  = value;
    }

    static translate( name ){ // -> returns customFieldId
        return { "start_date_nsw": 3674985, "key_number": 3674987 }[ name ];
    }
}

class Thumbnail {
    constructor( src ){
        this.src            = src;
    }
}



exports.Program         = Program;
exports.CustomField     = CustomField;
exports.Thumbnail       = Thumbnail;
exports.Inventory       = Inventory;

