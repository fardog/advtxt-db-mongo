/**
* @overview An extraordinarily thin wrapper around MongoDB for AdvTxt
*
* @author Nathan Wittstock <code@fardogllc.com>
* @license MIT License - See file 'LICENSE' in this project.
* @version 0.0.1
*/
'use strict';

var mongo = require('mongodb');
var debug = require('debug')('advtxt-db-mongo');

var advtxt = {};

/**
 * Constructs a new AdvTxt Mongo instance.
 *
 * @since 0.0.1
 * @constructor
 */
exports = module.exports = advtxt.MongoDB = function() {
	var self = this;
	self.mongodb = null;
	debug('AdvTxt MongoDB Instantiated');
};


/**
 * Initializes the connection to the backing store.
 *
 * @since 0.0.1
 * @param {object} config - The configuration object.
 * @param {advtxtCallback} next - The next function to call.
 */
advtxt.MongoDB.prototype.initialize = function(config, next) {
	var self = this;

	if (typeof config.adapter === 'undefined' || config.adapter !== 'mongodb') {
		next("advtxt-db-mongo: Configuration error! Wrong adapter or no adapter specified.");
		return;
	}

	mongo.connect(config.mongodb.uri, function(err, db) {
		if (err) {
			next("advtxt-db-mongo: Couldn't connect to DB!");
		}

		if(!db) {
			next("advtxt-db-mongo: Connected, but failed to get a DB.");
		}
		else {
			debug("Connected to MongoDB.");
			self.mongodb = db;
			next(null, self);
		}
	});
};


/**
 * Updates something in the database, given the info to do so.
 *
 * @since 0.0.2
 * @param {string} name - The name of the collection we're updating
 * @param {object} selector - The MongoDB selector for what you want to update
 * @param {object} data - The data that you want to update, which gets mashed 
 *  into the $set variable of Mongo's update statement.
 * @callback {updateCallback} next - The callback to be executed after
 *  the update.
 */
advtxt.MongoDB.prototype.update = function(name, selector, data, next) {
	var self = this;

	var collection = self.mongodb.collection(name);
	collection.update(selector, {$set: data}, {w:1}, function(err, success) {
		if (err) {
			next("advtxt-db-mongo: Failed to update DB. " + err);
		}

		if (typeof next !== 'undefined' && next) {
			next(null, success);
		}
	});
};

/**
 * This callback is run after a database entry is updated.
 *
 * @since 0.0.2
 * @callback updateCallback
 * @param {string} err - The error message if there was one, else null
 * @param {number} result - How many records we updated
 */


/**
 * Finds one record in the database
 *
 * @since 0.0.1
 * @param {string} name - The name of the collection
 * @param {object} selector - The selector we're searching for
 * @param {findOneCallback} next - The callback to be executed afterward
 */
advtxt.MongoDB.prototype.findOne = function(name, selector, next) {
	var self = this;

	var collection = self.mongodb.collection(name);
	collection.findOne(selector, function(err, item) {
		if (err) {
			next("advtxt-db-mongo: Error finding item; " + err);
		}

		next(null, item);
	});
};


/**
 * Inserts a single record into the database
 *
 * @since 0.0.1
 * @param {string} name - The name of the collection
 * @param {object} item - The item to be inserted
 * @param {insertOneCallback} next - The callback to be executed afterward
 */
advtxt.MongoDB.prototype.insertOne = function(name, item, next) {
	var self = this;

	if (typeof item !== 'object') {
		next("advtxt-db-mongo: Tried to insert one of something that's not an object.");
	}
	else {
		var collection = self.mongodb.collection(name);
		collection.insert(item, function(err, items) {
			if (err) next("advtxt-db-mongo: Got error while inserting; " + err);
			else {
				if (items.length === 1) {
					next(null, items[0]);
				}
				else {
					next("advtxt-db-mongo: Inserted multiple items.");
				}
			}
		});
	}
};
