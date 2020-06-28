var
dotenv = require('dotenv').config(),
express = require('express'),
mongoDB = require('mongodb'),
{parse, stringify} = JSON,
responder = (err, stat) => res.send(stringify(stat)),
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
        .toArray((err, array) => res.send(stringify({data: array}))),
      add: () => coll.insertOne(
        req.body.doc,
        (err, stat) => res.send(stringify(stat))
      ),
      update: () => coll.updateOne(
        {_id: req.body.doc._id}, {$set: req.body.doc},
        (err, stat) => res.send(stringify(stat))
      ),
      remove: () => coll.deleteOne(
        {_id: req.body._id},
        (err, stat) => res.send(stringify(stat))
      ),
      insertMany: () => coll.insertMany(
        req.body.documents,
        (err, stat) => res.send(stringify(stat))
      ),
      updateMany: () => coll.updateMany(
        req.body.filter, req.body.update,
        (err, stat) => res.send(stringify(stat))
      ),
      deleteMany: () => coll.deleteMany({},
        (err, stat) => res.send(stringify(stat))
      )
    })[req.body.method]()
  )
))
.listen(process.env.PORT || 3000)
