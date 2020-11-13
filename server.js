var dotenv = require('dotenv').config(),
express = require('express'),
bodyParser = require('body-parser'),
mongoDB = require('mongodb'),
{parse, stringify} = JSON,
withThis = (obj, cb) => cb(obj)

mongoDB.MongoClient.connect(
  process.env.MONGO,
  {useNewUrlParser: true, useUnifiedTopology: true},
  (err, client) =>
    express()
    .use(bodyParser.json({limit: '50mb'}))
    .use(express.static("public"))
    .post('/dbCall', (req, res) => withThis(
      client.db(req.body.dbName),
      db => withThis(
        {
          coll: db.collection(req.body.collName),
          responder: (err, stat) => res.send(stringify(stat)),
        },
        ({coll, responder}) => ({
          get: () => coll.find(JSON.parse(req.body.filter || '{}'))
            .toArray((err, array) => res.send(stringify({data: array}))),
          add: () => coll.insertOne(req.body.doc, responder),
          update: () => coll.updateOne({_id: req.body.doc._id}, {$set: req.body.doc}, responder),
          remove: () => coll.deleteOne({_id: req.body._id}, responder),
          insertMany: () => coll.insertMany(req.body.documents, responder),
          updateMany: () => coll.updateMany(req.body.filter, req.body.update, responder),
          deleteMany: () => coll.deleteMany({}, responder)
        })[req.body.method]()
      )
    ))
    .listen(process.env.PORT || 3000)
)
