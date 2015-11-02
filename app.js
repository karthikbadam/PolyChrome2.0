var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var csv = require('fast-csv');
var fs = require('fs');
var d3 = require('d3');
var url = require('url');
var qs = require('qs');

var routes = require('./routes/index');
var users = require('./routes/users');

//var citiesToLoc = require('./maps.js').citiesToLoc;

// connecting to Mongodb database running instance
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var FIRST_TIME_EXECUTED = false;
var mongourl = 'mongodb://127.0.0.1:27017/flightsSmall';

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.engine('html', require('ejs').renderFile);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* opening page */
app.get('/flights', routes.flights);

//// catch 404 and forward to error handler
//app.use(function (req, res, next) {
//    var err = new Error('Not Found');
//    err.status = 404;
//    next(err);
//});


// as soon as the app for the first time, read the dataset 
// and load it

//start with stock list
var stream = fs.createReadStream("public/data/flight-yearly.tsv");

//db.flights.createIndex( { "Source": 1, "Passengers": -1 , "Flights": -1, "Date": 1, "sourcePopulation": -1} )

var sourceID = "SID";
var destID = "DID";
var source = "Source";
var destination = "Destination";
var passengers = "Passengers";
var seats = "Seats";
var numFlights = "Flights";
var distance = "Distance";
var date = "Date";
var sourcePopulation = "SPopulation";
var destPopulation = "DPopulation";

var locationCache = {};

// lets not do the training for now
function initialize(db, callback) {
    if (FIRST_TIME_EXECUTED) {
        var csvStream = csv
            .fromStream(stream, {
                headers: true,
                delimiter: '\t'
            })
            .on("data", function (d) {

                var temp = {};
                temp["id"] = d[sourceID] + "-" + d[destID];
                temp[sourceID] = d[sourceID];
                temp[destID] = d[destID];
                temp[source] = d[source];
                temp[destination] = d[destination];
                temp[passengers] = +d[passengers];
                temp[seats] = +d[seats];
                temp[numFlights] = +d[numFlights];
                temp[distance] = +d[distance];
                temp[date] = d[date];
                temp[sourcePopulation] = +d[sourcePopulation];
                temp[destPopulation] = +d[destPopulation];

                db.collection('flights')
                    .insertOne(temp,
                        function (err, result) {
                            assert.equal(err, null);
                            console.log("Inserted a document");
                        })
            })
            .on("end", function () {
                console.log("CREATED THE DATABASE");
                callback();
            });
    }
}

MongoClient.connect(mongourl, function (err, db) {
    assert.equal(null, err);
    initialize(db, function () {
        db.close();
    });
});


var createIndex = false;

var indexFlights = function (db, callback) {
    db.collection('flights').createIndex({
            "Passengers": -1,
            "Distance": -1,
            "Flights": -1,
            "Date": 1,
            "SPopulation": -1,
            "Source": 1,
            "Seats": -1
        },
        null,
        function (err, results) {
            console.log(results);
            callback();
        }
    );
};

if (createIndex) {
    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(null, err);
        indexFlights(db, function () {
            db.close();
        });
    });
}


function queryFlightConnections(db, query, callback) {

    var data = db.collection("flights")
        .aggregate([
            {
                $match: query
        },
            {
                $group: {
                    "_id": {
                        "Source": "$Source",
                        "Destination": "$Destination"
                    },
                    Flights: {
                        $sum: "$Flights"
                    }
                }
        },
            {
                $sort: {
                    Flights: -1
                }
        }
    ]);
    
//var data = db.collection("flights")
//          .find(query);

    //    data.toArray(function (err, docs) {
    //        assert.equal(null, err);
    //        console.log(docs.length);
    //        callback(docs);
    //    });

    var docs = [];

    data.on('data', function (doc) {
        docs.push(doc);
        console.log(doc);
    });

    data.once('end', function () {
        console.log(docs.length);
        callback(docs);
    });

}

app.get('/getFlightCounts', function (req, res, next) {

    var params = url.parse(req.url, true).query;

    var query = parseQueryString(params);

    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(null, err);

        queryFlightConnections(db, query,
            function (data) {
                db.close();
                res.write(JSON.stringify(data));
                res.end();
            });
    });

});


function queryFlightsByTime(db, query, callback) {

    var data = db.collection("flights")
        .aggregate([
            {
                $match: query
            },
            {
                $group: {
                    "_id": {
                        "Date": "$Date"
                    },
                    Flights: {
                        $sum: "$Flights"
                    }
                }
            },
            {
                $sort: {
                    Date: 1

                }
            }
        ]);

    //    data.toArray(function (err, docs) {
    //        assert.equal(null, err);
    //        console.log(docs.length);
    //        callback(docs);
    //    });

    var docs = [];

    data.on('data', function (doc) {
        docs.push(doc);
        console.log(doc);
    });

    data.once('end', function () {
        console.log(docs.length);
        callback(docs);
    });


}

app.get('/getFlightsByTime', function (req, res, next) {

    var params = url.parse(req.url, true).query;

    var query = parseQueryString(params);

    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(null, err);

        queryFlightsByTime(db, query, function (data) {
            db.close();
            res.write(JSON.stringify(data));
            res.end();
        });
    });

});


function queryPassengersByTime(db, query, callback) {

    var data = db.collection("flights").aggregate([
        {
            $match: query
        },
        {
            $group: {
                "_id": {
                    "Date": "$Date",
                },
                Passengers: {
                    $sum: "$Passengers"
                }
            }
        },
        {
            $sort: {
                Date: 1

            }
    }
    ]);

    //    data.toArray(function (err, docs) {
    //        assert.equal(null, err);
    //        console.log(docs.length);
    //        callback(docs);
    //    });

    var docs = [];

    data.on('data', function (doc) {
        docs.push(doc);
        console.log(doc);
    });

    data.once('end', function () {
        console.log(docs.length);
        callback(docs);
    });

}

app.get('/getPassengersByTime', function (req, res, next) {

    var params = url.parse(req.url, true).query;

    var query = parseQueryString(params);

    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(null, err);

        queryPassengersByTime(db, query, function (data) {
            db.close();
            res.write(JSON.stringify(data));
            res.end();
        });
    });

});


function queryFlightsBySource(db, query, callback, callbackStream) {

    var data = db.collection("flights").aggregate([
        {
            $match: query
        },
        {
            $group: {
                "_id": {
                    "Source": "$Source"
                },
                Flights: {
                    $sum: "$Flights"
                }
            }
        },
        {
            $sort: {
                Flights: -1,

            }
        }
                   ]);

    //    data.toArray(function (err, docs) {
    //        assert.equal(null, err);
    //        console.log(docs.length);
    //        callback(docs);
    //    });

    var docs = [];

    data.on('data', function (doc) {
        docs.push(doc);
        //callbackStream(docs);
        console.log(doc);
    });

    data.once('end', function () {
        console.log(docs.length);
        callback(docs);
    });


}

app.get('/getFlightsBySource', function (req, res, next) {

    var params = url.parse(req.url, true).query;

    var query = parseQueryString(params);


    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(null, err);

        queryFlightsBySource(db, query, function (data) {
            db.close();
            res.write(JSON.stringify(data));
            res.end();
        }, function (data) {
            res.write(JSON.stringify(data));
        });
    });

});


function queryPassengersBySource(db, query, callback) {

    var data = db.collection("flights").aggregate([
        {
            $match: query
        },
        {
            $group: {
                "_id": {
                    "Source": "$Source"
                },
                Passengers: {
                    $sum: "$Passengers"
                }
            }
        },
        {
            $sort: {
                Passengers: -1,

            }
        }
                   ]);

    //    data.toArray(function (err, docs) {
    //        assert.equal(null, err);
    //        console.log(docs.length);
    //        callback(docs);
    //    });

    var docs = [];

    data.on('data', function (doc) {
        docs.push(doc);
        console.log(doc);
    });

    data.once('end', function () {
        console.log(docs.length);
        callback(docs);
    });

}

app.get('/getPassengersBySource', function (req, res, next) {

    var params = url.parse(req.url, true).query;

    var query = parseQueryString(params);


    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(null, err);

        queryPassengersBySource(db, query, function (data) {
            db.close();
            res.write(JSON.stringify(data));
            res.end();
        });
    });

});



function queryFlightDistances(db, query, callback) {

    var data = db.collection("flights").aggregate([
        {
            $match: query
        },
        {
            $project: {
                DistanceLowerBound: {
                    $subtract: ["$Distance", {
                        $mod: ["$Distance", 50]
                    }]
                },
                FlightsLowerBound: {
                    $subtract: ["$Flights", {
                        $mod: ["$Flights", 5]
                    }]
                },
                Passengers: "$Passengers"
            }
        },
        {
            $group: {
                "_id": {
                    "Distance": "$DistanceLowerBound",
                    "Flights": "$FlightsLowerBound"
                },
                Passengers: {
                    $sum: "$Passengers"
                }
            }
        },
        {
            $sort: {
                Passengers: -1,

            }
        },
        {
            $limit: 300
        }
                   ]);

    //    data.toArray(function (err, docs) {
    //        assert.equal(null, err);
    //        console.log(docs.length);
    //        callback(docs);
    //    });

    var docs = [];

    data.on('data', function (doc) {
        docs.push(doc);
        console.log(doc);
    });

    data.once('end', function () {
        console.log(docs.length);
        callback(docs);
    });

}

app.get('/getFlightDistances', function (req, res, next) {

    var params = url.parse(req.url, true).query;

    var query = parseQueryString(params);

    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(null, err);

        queryFlightDistances(db, query, function (data) {
            db.close();
            res.write(JSON.stringify(data));
            res.end();
        });
    });

});


function queryPassengerSeats(db, query, callback) {

    var data = db.collection("flights").aggregate([
        {
            $match: query
        },
        {
            $project: {
                PassLowerBound: {
                    $add: [250, {
                        $subtract: ["$Passengers", {
                            $mod: ["$Passengers", 500]
                        }]
                    }]
                },
                PopLowerBound: {
                    $add: [100000, {
                        $subtract: ["$SPopulation", {
                            $mod: ["$SPopulation", 200000]
                        }]
                    }]
                },
                SeatsLowerBound: {
                    $add: [250, {
                        $subtract: ["$Seats", {
                            $mod: ["$Seats", 500]
                        }]
                    }]
                },
                Flights: "$Flights"
            }
        },
        {
            $group: {
                "_id": {
                    "Seats": "$SeatsLowerBound",
                    "Passengers": "$PassLowerBound",
                    "SPopulation": "$PopLowerBound"
                },
                Flights: {
                    $sum: "$Flights"
                }
            }
        },
        {
            $sort: {
                Flights: -1,
            }
        },
        {
            $limit: 300
        }

    ]);

    //    data.toArray(function (err, docs) {
    //        assert.equal(null, err);
    //        console.log(docs.length);
    //        callback(docs);
    //    });

    var docs = [];

    data.on('data', function (doc) {
        docs.push(doc);
        console.log(doc);
    });

    data.once('end', function () {
        console.log(docs.length);
        callback(docs);
    });

}

app.get('/getPassengerSeats', function (req, res, next) {

    var params = url.parse(req.url, true).query;

    var query = parseQueryString(params);

    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(null, err);

        queryPassengerSeats(db, query, function (data) {
            db.close();
            res.write(JSON.stringify(data));
            res.end();
        });
    });

});


function queryDistanceBySource(db, query, callback) {

    var data = db.collection("flights").aggregate([
        {
            $match: query
        },
        {
            $group: {
                "_id": {
                    "Source": "$Source"
                },
                Distance: {
                    $avg: "$Distance"
                }
            }
        },
        {
            $sort: {
                Distance: -1,

            }
        }
                   ]);

    //    data.toArray(function (err, docs) {
    //        assert.equal(null, err);
    //        console.log(docs.length);
    //        callback(docs);
    //    });

    var docs = [];

    data.on('data', function (doc) {
        docs.push(doc);
        console.log(doc);
    });

    data.once('end', function () {
        console.log(docs.length);
        callback(docs);
    });


}

app.get('/getDistanceBySource', function (req, res, next) {

    var params = url.parse(req.url, true).query;

    var query = parseQueryString(params);


    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(null, err);

        queryDistanceBySource(db, query, function (data) {
            db.close();
            res.write(JSON.stringify(data));
            res.end();
        });
    });

});

function queryPopulationBySource(db, query, callback) {

    var data = db.collection("flights").aggregate([
        {
            $match: query
        },
        {
            $group: {
                "_id": {
                    "Source": "$Source"
                },
                SPopulation: {
                    $max: "$SPopulation"
                }
            }
        },
        {
            $sort: {
                SPopulation: -1,

            }
        }
                   ]);

    //    data.toArray(function (err, docs) {
    //        assert.equal(null, err);
    //        console.log(docs.length);
    //        callback(docs);
    //    });

    var docs = [];

    data.on('data', function (doc) {
        docs.push(doc);
        console.log(doc);
    });

    data.once('end', function () {
        console.log(docs.length);
        callback(docs);
    });

}

function parseQueryString(params) {

    var data = qs.parse(params).data;

    console.log(JSON.stringify(data));

    var query = {};

    for (var i = 0; i < data.length; i++) {

        var q = {};

        var d = data[i];

        switch (d.operator) {

        case "range":
            if (d.index == "Date") {
                q[d.index] = {
                    "$gte": d.value[0],
                    "$lte": d.value[1]
                };
            } else {
                q[d.index] = {
                    "$gte": parseFloat(d.value[0]),
                    "$lte": parseFloat(d.value[1])
                };
            }
            break;

        case "equal":
            q[d.index] = d.value;
            break;

        case "in":
            q[d.index] = {
                "$in": d.value
            };
            break;

        default:
            console.log("Sorry, we are out of " + d.operator + ".");
        }


        switch (d.logic) {

        case "AND":
            query[d.index] = q[d.index];
            break;

        case "OR":
            if (!query["$or"]) {
                query["$or"] = [];
            }
            query["$or"].push(q);
            break;

        case "NOT":
            query[d.index] = {
                "$not": q[d.index]
            };
            break;

        case "CLEAN":
            query = {};
            query[d.index] = q[d.index];
            break;

        default:
            console.log("Sorry, we are out of " + d.logic + ".");
        }

    }

    console.log(query);

    return query;

}

app.get('/getPopulationBySource', function (req, res, next) {

    var params = url.parse(req.url, true).query;

    var query = parseQueryString(params);

    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(null, err);

        queryPopulationBySource(db, query, function (data) {
            db.close();
            res.write(JSON.stringify(data));
            res.end();
        });
    });

});




// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;