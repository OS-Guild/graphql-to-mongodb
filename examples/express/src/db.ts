import { MongoClient } from 'mongodb'

export default async function () {
	try {
	const mongoClient = await MongoClient.connect("mongodb://mongo:27017", { autoReconnect: true, useNewUrlParser: true });
	const database = await mongoClient.db("PeopleDB");
	return database;
	} catch(error) {
		return null;
	}
};
