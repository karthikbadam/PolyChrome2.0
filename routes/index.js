var express = require('express');
var router = express.Router();

module.exports.flights = function (req, res, next) {
    res.render('flights.html', {});
};
