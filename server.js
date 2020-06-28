var
dotenv = require('dotenv').config(),
express = require('express'),
mongoDB = require('mongodb'),
responder = JSON.stringify,
withThis = (obj, cb) => cb(obj),

dbCall = (dbname, action) => mongoDB.MongoClient.connect(
  process.env.atlas,
  {useNewUrlParser: true, useUnifiedTopology: true},
  (err, client) => action(client.db(dbname))
),

app = express()
.use(express.json())
.use(express.static("public"))
.post('/dbCall', (req, res) => dbCall(
  req.body.dbName, db => withThis(
    db.collection(req.body.collName),
    coll => ({
      get: () =>
        coll.find(JSON.parse(req.body.filter || '{}'))
        .toArray((err, array) => res.send(responder({data: array}))),
      add: () => coll.insertOne(
        req.body.doc,
        (err, doc) => res.send(responder(doc))
      ),
      update: () => coll.updateOne(
        {_id: req.body.doc._id}, {$set: req.body.doc},
        (err, doc) => res.send(responder(doc))
      ),
      remove: () => coll.deleteOne(
        {_id: req.body._id},
        (err, doc) => res.send(responder(doc))
      )
    })[req.body.method]()
  )
))
.listen(process.env.PORT || 3000)
