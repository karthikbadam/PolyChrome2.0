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

var device = "DESKTOP";

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

var svgs = [];

var mainView = [1, 1];

var THUMBNAIL_SCALE = 0.6;

var polychrome;


function setGlobalQuery(query, propagate) {

    var currQuery = query;

    var prevQuery = queryStack[queryStack.length - 1];

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

    //syncing between devices
    var dquery = new Query({
        index: "Date",
        value: ["1990", "2009"],
        operator: "range",
        logic: "CLEAN"
    }).getQueryString();

    if (JSON.stringify(query.getQueryString()) !=
        JSON.stringify(dquery)) {
        polychrome.push(query.getQueryString());
    }
}


var justStarted = true;

function compareObjects(q1, q2) {

    if (q1.index == q2.index) {
        if (q1.logic == q2.logic) {
            if (q1.operator == q2.operator) {
                //if (q1.value == q2.value) {
                    return true;
                //}
            }
        }
    }
    
    return false;
}

$(document).ready(function () {

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
        .test(navigator.userAgent)) {

        device = "MOBILE";

    } else {
        device = "DESKTOP";
    }

    var options = {};

    options.callback = function (query) {

        if (compareObjects(query, 
                           queryStack[queryStack.length - 1])) {

            return;
        }

        if (device == "MOBILE") {

            svgs[mainView[0]][mainView[1]].postUpdate([query]);

        } else {

            for (var i = 0; i < GRID[1]; i++) {
                for (var j = 0; j < GRID[0]; j++) {
                    if (svgs[i][j]) {
                        svgs[i][j].postUpdate([query]);
                    }
                }
            }

        }
    }

    polychrome = new Sync(options);

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

                $(this).toggleClass('active').siblings()
                    .removeClass('active');

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

                if (justStarted) {
                    document.fullscreenEnabled = document.fullscreenEnabled ||
                        document.mozFullScreenEnabled ||
                        document.documentElement.webkitRequestFullScreen;

                    function requestFullscreen(element) {
                        if (element.requestFullscreen) {
                            element.requestFullscreen();
                        } else if (element.mozRequestFullScreen) {
                            element.mozRequestFullScreen();
                        } else if (element.webkitRequestFullScreen) {
                            element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                        }
                    }

                    if (document.fullscreenEnabled) {
                        requestFullscreen(document.getElementsByTagName("body")[0]);
                    }

                    justStarted = false;

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

        if (device == "MOBILE") {

            createMobileLayout();

        } else {

            createLayout();

        }


        onDataLoaded();

    });

});

function reDrawInterface() {

    var prevL = l;

    l = getDimensions(mainView[0], mainView[1]);

    for (var i = 0; i < GRID[1]; i++) {

        for (var j = 0; j < GRID[0]; j++) {

            if (l[i][j] != 0) {

                d3.select("#div" + i + j)
                    .style("width", l[i][j]["width"] - PADDING / 2)
                    .style("height", l[i][j]["height"] - PADDING / 2)
                    .style("background-color",
                        "white")
                    .style("border", "1px solid #222")
                    .style("opacity", 1)
                    .style("margin", PADDING / 2 - 4)
                    .style("overflow", "hidden")
                    .style("display", "inline-block");

                if (i == mainView[0] && j == mainView[1]) {

                    svgs[i][j].reDrawChart(1, $("#div" + i + j).width(),
                        $("#div" + i + j).height());

                } else {
                    if (prevL[i][j] == 0)
                        svgs[i][j].postUpdate();

                    svgs[i][j].reDrawChart(0, $("#div" + i + j).width(),
                        $("#div" + i + j).height());

                }

            } else {

                d3.select("#div" + i + j)
                    .style("display", "none");

            }
        }
    }


}

function onDataLoaded() {

    //creating the views
    geomap = new Map({
        parentId: "div11",
        cols: [source, destination],
        width: $("#div11").width(),
        height: $("#div11").height(),
    });

    svgs[1][1] = geomap;

    timechart = new TimeChart({
        parentId: "div21",
        cols: [source, destination],
        width: $("#div21").width(),
        height: $("#div21").height(),
        target: numFlights,
        link: "getFlightsByTime",
        text: "Flights"
    });

    svgs[2][1] = timechart;

    passengerchart = new TimeChart({
        parentId: "div01",
        cols: [source, destination],
        width: $("#div01").width(),
        height: $("#div01").height(),
        target: passengers,
        link: "getPassengersByTime",
        text: "Passengers"
    });

    svgs[0][1] = passengerchart;

    flightdistance = new Parallel({
        parentId: "div10",
        cols: [source, destination],
        width: $("#div10").width(),
        height: $("#div10").height(),
        link: "getFlightDistances",
        target: passengers
    });

    svgs[1][0] = flightdistance;

    passengerseats = new Parallel({
        parentId: "div12",
        cols: [source, destination],
        width: $("#div12").width(),
        height: $("#div12").height(),
        link: "getPassengerSeats",
        target: numFlights
    });

    svgs[1][2] = passengerseats;

    distancebar = new Bar({
        parentId: "div00",
        cols: [source, destination],
        width: $("#div00").width(),
        height: $("#div00").height(),
        target: distance,
        link: "getDistanceBySource",
        text: "Average Distance"
    });

    svgs[0][0] = distancebar;

    populationbar = new Bar({
        parentId: "div22",
        cols: [source, destination],
        width: $("#div22").width(),
        height: $("#div22").height(),
        target: sourcePopulation,
        link: "getPopulationBySource",
        text: "Population"
    });

    svgs[2][2] = populationbar;

    flightsbar = new Bar({
        parentId: "div20",
        cols: [source, destination],
        width: $("#div20").width(),
        height: $("#div20").height(),
        target: numFlights,
        link: "getFlightsBySource",
        text: "Flights"
    });

    svgs[2][0] = flightsbar;

    passengersbar = new Bar({
        parentId: "div02",
        cols: [source, destination],
        width: $("#div02").width(),
        height: $("#div02").height(),
        target: passengers,
        link: "getPassengersBySource",
        text: "Passengers"
    });

    svgs[0][2] = passengersbar;

}

function createLayout() {

    //GRID[1] = GRID[0];

    var xWeights = getWeights(GRID[1]);
    var yWeights = getWeights(GRID[0]);

    svgs = new Array(GRID[1]);

    for (var i = 0; i < GRID[1]; i++) {

        svgs[i] = new Array(GRID[0]);

        for (var j = 0; j < GRID[0]; j++) {

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

function createMobileLayout() {

    //GRID[1] = GRID[0];

    l = getDimensions(1, 1);

    svgs = new Array(GRID[1]);

    for (var i = 0; i < GRID[1]; i++) {

        svgs[i] = new Array(GRID[0]);

        for (var j = 0; j < GRID[0]; j++) {

            if (l[i][j] != 0) {

                d3.select("#content").append("div")
                    .attr("id", "div" + i + j)
                    .attr("class", "panel")
                    .style("width", l[i][j]["width"] - PADDING / 2)
                    .style("height", l[i][j]["height"] - PADDING / 2)
                    .style("background-color",
                        "white")
                    .style("border", "1px solid #222")
                    .style("opacity", 1)
                    .style("margin", PADDING / 2 - 4)
                    .style("overflow", "hidden");

            }

        }
    }

}

function getDimensions(mainVIndex, mainHIndex) {


    var layOut = new Array(GRID[1]);

    for (var i = 0; i < GRID[1]; i++) {

        layOut[i] = new Array(GRID[0]);

        for (var j = 0; j < GRID[0]; j++) {
            layOut[i][j] = 0;
        }
    }

    //calculating number on top, number on bottom, left, and right
    bottom = GRID[1] - 1 - mainVIndex;
    bottomExists = bottom > 0 ? 1 : 0;

    topI = mainVIndex;
    topExists = topI > 0 ? 1 : 0;

    left = mainHIndex;
    leftExists = left > 0 ? 1 : 0;

    right = GRID[0] - 1 - mainHIndex;
    rightExists = right > 0 ? 1 : 0;

    var PROPORTIONS = 15;

    //assigning the dimensions to the main view
    layOut[mainVIndex][mainHIndex] = {
        width: (PROPORTIONS - left - right) * width / PROPORTIONS,
        height: (PROPORTIONS - topI - bottom) * height / PROPORTIONS
    };

    //assigning the top or bottom
    if (topI != 0) {

        layOut[mainVIndex - 1][mainHIndex] = {
            width: width / (leftExists + rightExists + 1),
            height: topI * height / PROPORTIONS
        };

        if (leftExists) {
            layOut[mainVIndex - 1][mainHIndex - 1] = {
                width: width / (leftExists + rightExists + 1),
                height: topI * height / PROPORTIONS
            };
        }

        if (rightExists) {
            layOut[mainVIndex - 1][mainHIndex + 1] = {
                width: width / (leftExists + rightExists + 1),
                height: topI * height / PROPORTIONS
            };
        }

    }

    if (bottom != 0) {

        layOut[mainVIndex + 1][mainHIndex] = {
            width: width / (leftExists + rightExists + 1),
            height: bottom * height / PROPORTIONS
        };

        if (leftExists) {
            layOut[mainVIndex + 1][mainHIndex - 1] = {
                width: width / (leftExists + rightExists + 1),
                height: bottom * height / PROPORTIONS
            };
        }

        if (rightExists) {
            layOut[mainVIndex + 1][mainHIndex + 1] = {
                width: width / (leftExists + rightExists + 1),
                height: bottom * height / PROPORTIONS
            };
        }
    }


    if (left != 0) {

        layOut[mainVIndex][mainHIndex - 1] = {
            width: left * width / PROPORTIONS,
            height: (PROPORTIONS - topI - bottom) * height / PROPORTIONS
        };

    }

    if (right != 0) {

        layOut[mainVIndex][mainHIndex + 1] = {
            width: right * width / PROPORTIONS,
            height: (PROPORTIONS - topI - bottom) * height / PROPORTIONS
        };
    }

    return layOut;

}