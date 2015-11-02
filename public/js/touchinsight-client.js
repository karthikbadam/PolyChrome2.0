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

var device = 0;

var dataFile = "data/flights.csv";

var GRID = [3, 3];

var width = 0;

var height = 0;

var PADDING = 5;

var colorscale = d3.scale.category10();

var parseDate = d3.time.format("%Y").parse;

var geomap, timechart, passengerchart, flightsbar, passengersbar, flightdistance,
    passengerseats, distancebar, populationbar;

var usStates = {};

var buttons = ["OR", "AND", "NOT", "CLEAN"];

var currentLogic = "AND";

var queryStack = [];

var historyQueryStack = [];

function setGlobalQuery(query, propagate) {

    var currQuery = query;
    
    var prevQuery = queryStack[queryStack.length - 1];
    
//    if (prevQuery && prevQuery.logic== "AND" && prevQuery.index == query.index) {
//        query.logic = "OR";   
//        prevQuery.logic = "OR"; 
//        queryStack[queryStack.length -  1] = prevQuery;
//
//    }
    
    queryStack.push(query.getQueryString());

    for (var i = queryStack.length - 1; i >= 0; i--) {

        var q = queryStack[i];

        if (q.logic == "CLEAN") {

            queryStack = queryStack.slice(i);
            break;
        }
    }

    historyQueryStack.push(query);

    // update all other visualizations
    if (propagate) {
        geomap.postUpdate();
        timechart.postUpdate();
        passengerchart.postUpdate();
        flightsbar.postUpdate();
        passengersbar.postUpdate();
        flightdistance.postUpdate();
        passengerseats.postUpdate();
        distancebar.postUpdate();
        populationbar.postUpdate();
    }

}

$(document).ready(function () {

    // creating the four buttons
    for (var i = 0; i < buttons.length; i++) {
        d3.select("#button-panel").append("div")
            .attr("id", buttons[i])
            .attr("class", "operator")
            .style("width", (100 / buttons.length) + "%")
            .style("height", "100%")
            .style("color", "white")
            .style("font-size", "2em")
            .style("text-align", "center")
            .style("vertical-align", "middle")
            .style("cursor", "pointer")
            .style("display", "inline-block")
            .text(buttons[i])
            .on("mousedown", function () {

                console.log(this.textContent + " is clicked");

                $(this).toggleClass('active').siblings().removeClass('active');

                currentLogic = this.textContent;

                if (currentLogic == "CLEAN") {

                    queryStack.length = 0;

                    var query = new Query({
                        index: "Date",
                        value: ["1990", "2009"],
                        operator: "range",
                        logic: "CLEAN"
                    });

                    setGlobalQuery(query, 1);
                    
                    $(this).toggleClass('active');
                }
            });
    }

    //$("#" + buttons[3]).toggleClass('active');

    width = $("#content").width();
    height = $("#content").height();


    d3.text('data/locations.json', function (txt) {

        var lines = txt.split("\n");

        for (var i = 0; i < lines.length; i++) {

            var d = JSON.parse(lines[i]);

            var city = d.city;
            var loc = d.ll;

            usStates[city] = {
                lat: parseFloat(loc[0]),
                lon: parseFloat(loc[1])
            }
        }

        createLayout();

        onDataLoaded();

    });

});

function onDataLoaded() {

    //creating the views
    geomap = new Map({
        parentId: "div11",
        cols: [source, destination],
        width: $("#div11").width(),
        height: $("#div11").height(),
    });

    timechart = new TimeChart({
        parentId: "div21",
        cols: [source, destination],
        width: $("#div21").width(),
        height: $("#div21").height(),
        target: numFlights,
        link: "getFlightsByTime",
        text: "Flights"
    });

    passengerchart = new TimeChart({
        parentId: "div01",
        cols: [source, destination],
        width: $("#div01").width(),
        height: $("#div01").height(),
        target: passengers,
        link: "getPassengersByTime",
        text: "Passengers"
    });

    flightdistance = new Parallel({
        parentId: "div10",
        cols: [source, destination],
        width: $("#div10").width(),
        height: $("#div10").height(),
        link: "getFlightDistances",
        target: "Passengers"
    });

    passengerseats = new Parallel({
        parentId: "div12",
        cols: [source, destination],
        width: $("#div12").width(),
        height: $("#div12").height(),
        link: "getPassengerSeats",
        target: "Flights"
    });

    distancebar = new Bar({
        parentId: "div00",
        cols: [source, destination],
        width: $("#div00").width(),
        height: $("#div00").height(),
        target: distance,
        link: "getDistanceBySource",
        text: "Average Distance"
    });

    populationbar = new Bar({
        parentId: "div22",
        cols: [source, destination],
        width: $("#div22").width(),
        height: $("#div22").height(),
        target: sourcePopulation,
        link: "getPopulationBySource",
        text: "Population"
    });

    flightsbar = new Bar({
        parentId: "div20",
        cols: [source, destination],
        width: $("#div20").width(),
        height: $("#div20").height(),
        target: numFlights,
        link: "getFlightsBySource",
        text: "Flights"
    });

    passengersbar = new Bar({
        parentId: "div02",
        cols: [source, destination],
        width: $("#div02").width(),
        height: $("#div02").height(),
        target: passengers,
        link: "getPassengersBySource",
        text: "Passengers"
    });
}

function createLayout() {

    //GRID[1] = GRID[0];

    var xWeights = getWeights(GRID[1]);
    var yWeights = getWeights(GRID[0]);

    for (var i = 0; i < GRID[0]; i++) {

        for (var j = 0; j < GRID[1]; j++) {

            d3.select("#content").append("div")
                .attr("id", "div" + i + j)
                .attr("class", "panel")
                .style("width", xWeights[j] * width - PADDING / 2)
                .style("height", yWeights[i] * height - PADDING / 2)
                .style("background-color",
                    "white")
                .style("border", "1px solid #AAA")
                .style("opacity", 1)
                .style("margin", PADDING / 2 - 4)
                .style("overflow", "hidden");
        }
    }

}

function getWeights(size) {

    var mid = (size + 1) / 2;

    var weights = new Array(size);

    var sum = 0;

    for (var i = 0; i < size; i++) {

        var weight = Math.pow(mid - Math.abs(mid - i - 1), 1.2);

        sum = sum + weight;

        weights[i] = weight;
    }

    for (var i = 0; i < size; i++) {

        weights[i] = weights[i] / sum;

    }

    return weights;

}