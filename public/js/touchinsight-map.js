function Map(options) {

    var _self = this;

    _self.parentId = options.parentId;

    _self.cols = options.cols;

    _self.margin = {
        top: 20,
        right: 0,
        bottom: 30,
        left: 30
    };

    _self.width = options.width - _self.margin.left - _self.margin.right;

    _self.height = options.height - _self.margin.top - _self.margin.bottom;

    _self.targetData = 0;

    var query = new Query({
        index: "Date",
        value: ["1990", "2009"],
        operator: "range",
        logic: "CLEAN"
    });

    setGlobalQuery(query);

    _self.postUpdate();
}

Map.prototype.refreshChart = function () {

    var _self = this;

    if (d3.select("#map").empty()) {

        var top = 49.3457868;
        var left = -124.7844079;
        var right = -66.9513812;
        var bottom = 24.7433195;

        var scale = 55 * (_self.height + _self.margin.top + _self.margin.bottom) / Math.abs(bottom - top);

        console.log(scale);

        _self.projection = d3.geo.albersUsa()
            .scale(scale)
            .translate([(_self.width + _self.margin.left + _self.margin.right) / 2, (_self.height + _self.margin.top + _self.margin.bottom) / 2]);

        _self.path = d3.geo.path()
            .projection(_self.projection);

        _self.svg = d3.select("#" + _self.parentId)
            .append("svg")
            .attr("id", "choropleth")
            .attr("width", _self.width + _self.margin.left + _self.margin.right)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom);

        // Create the area where the lasso event can be triggered
        var lasso_area = _self.svg.append("rect")
            .attr("width", _self.width + _self.margin.left + _self.margin.right)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
            .style("opacity", 0);

        var lasso_draw = function () {
            // Style the possible dots
            _self.lasso.items().filter(function (d) {
                    return d.possible === true
                })
                .classed({
                    "not_possible": false,
                    "possible": true
                })
                .attr("r", "8px");

            // Style the not possible dot
            _self.lasso.items().filter(function (d) {
                    return d.possible === false
                })
                .classed({
                    "not_possible": true,
                    "possible": false
                });
        };

        var lasso_end = function () {
            // Style the selected dots

            var selectedSources = [];
            var selectedDestinations = [];

            _self.lasso.items().filter(function (d) {
                    if (d.selected === true) {

                        if (d.type == source || d.type == destination) {
                            selectedSources.push(d.name);
                        }

                        if (d.type == destination) {
                            selectedDestinations.push(d.name);
                        }
                    }

                    return d.selected === true
                })
                .classed({
                    "not_possible": false,
                    "possible": false
                });

            if (selectedSources.length > 0) {

                var query1 = new Query({
                    index: source,
                    value: selectedSources,
                    operator: "in",
                    logic: currentLogic
                });

                setGlobalQuery(query1, flag = selectedDestinations.length > 0 ? 0 : 1);
                //setGlobalQuery(query1, flag = 1);
            }

            if (selectedDestinations.length > 0) {
                var query2 = new Query({
                    index: destination,
                    value: selectedDestinations,
                    operator: "in",
                    logic: selectedSources.length > 0 ? "AND" : currentLogic
                });

                setGlobalQuery(query2, 1);
            }

            // Reset the style of the not selected dots
            _self.lasso.items().filter(function (d) {
                    return d.selected === false
                })
                .classed({
                    "not_possible": false,
                    "possible": false
                })
                .attr("r", function (d) {
                    //return _self.colors(d["_id"][destination]);
                    return d.type == source ? "3px" : "6px";
                });

        };

        _self.lasso = d3.lasso()
            .closePathDistance(75) // max distance for the lasso loop to be closed
            .closePathSelect(true) // can items be selected by closing the path?
            .hoverSelect(true)
            .area(lasso_area) // area where the lasso can be started
            .on("draw", lasso_draw) // lasso draw function
            .on("end", lasso_end); // lasso end function

        // draw map
        d3.json("data/us.json", function (error, us) {

            _self.svg.append("path")
                .attr("id", "map")
                .datum(topojson.feature(us, us.objects.land))
                .attr("class", "land")
                .attr("d", _self.path)
                .style("pointer-events", "none");

            _self.svg.append("path")
                .attr("id", "boundary")
                .datum(
                    topojson.mesh(us,
                        us.objects.states,
                        function (a, b) {
                            return a !== b;
                        }))
                .attr("class", "state-boundary")
                .attr("d", _self.path)
                .style("pointer-events", "none");

            var cities = [];
            var sourceCities = [];
            var destinationCities = [];

            for (var i = 0; i < _self.targetData.length; i++) {

                var d = _self.targetData[i];
                var sourceCity = d["_id"][source];
                var destinationCity = d["_id"][destination];

                if (sourceCities.indexOf(sourceCity) < 0) {
                    cities.push({
                        name: sourceCity,
                        type: source
                    });
                    sourceCities.push(sourceCity);
                }

                if (destinationCities.indexOf(destinationCity) < 0) {
                    cities.push({
                        name: destinationCity,
                        type: destination
                    });
                    destinationCities.push(destinationCity);
                }
            }

            _self.svg
                .selectAll(".city")
                .data(cities)
                .enter().append("circle")
                .attr("class", "city")
                .style("pointer-events", "none")
                .attr("cx", function (d, i) {

                    var s = d.name;
                    var loc = usStates[s];

                    if (loc && loc.lon)
                        return _self.projection([loc.lon, loc.lat])[0];

                    return -10;
                }).attr("cy", function (d, i) {

                    var s = d.name;
                    var loc = usStates[s];

                    if (loc && loc.lat)
                        return _self.projection([loc.lon, loc.lat])[1];

                    return -10;
                })
                .attr("fill", function (d) {
                    //return _self.colors(d["_id"][destination]);
                    return d.type == source ? "#4292c6" : "transparent";
                })
                .attr("fill-opacity", 0.7)
                .attr("stroke", function (d) {
                    //return _self.colors(d["_id"][destination]);
                    return d.type == source ? "transparent" : "#222";
                })
                .attr("stroke-opacity", 0.7)
                .attr("stroke-width", "1px")
                .attr("r", "5px");


            _self.lasso.items(d3.selectAll("circle"));

            _self.svg.append("g")
                .style("pointer-events", "none")
                .attr("class", "links")
                .selectAll("line")
                .data(_self.targetData.slice(0, 100))
                .enter().append("line")
                .attr("class", "link")
                .style("pointer-events", "none")
                .attr("stroke", function (d) {
                    return "#9ecae1";
                    //return _self.colors(d["_id"][destination]);
                })
                .attr("stroke-width", function (d, i) {
                    return (Math.log(d["Flights"] + 0.5)) + "px";
                })
                .attr("stroke-opacity", 0.1)
                .attr("x1", function (d, i) {

                    var s = d["_id"][source];
                    var loc = usStates[s];
                    var c = _self.projection([loc.lon, loc.lat])

                    return c[0];
                })
                .attr("y1", function (d, i) {

                    var s = d["_id"][source];
                    var loc = usStates[s];
                    var c = _self.projection([loc.lon, loc.lat])

                    return c[1];

                })
                .attr("x2", function (d, i) {

                    var s = d["_id"][destination];
                    var loc = usStates[s];
                    var c = _self.projection([loc.lon, loc.lat])

                    return c[0];

                })
                .attr("y2", function (d, i) {

                    var s = d["_id"][destination];
                    var loc = usStates[s];
                    var c = _self.projection([loc.lon, loc.lat])

                    return c[1];

                });

            _self.svg.append("text")
                .attr("transform", "translate(" + (_self.width - 100) + "," + (_self.height + _self.margin.top) + ")")
                .text("Flights across US")
                .style("font-size", "14px");

            _self.svg.call(_self.lasso);


        });

    } else {

        var cities = [];
        var sourceCities = [];
        var destinationCities = [];
        for (var i = 0; i < _self.targetData.length; i++) {

            var d = _self.targetData[i];
            var sourceCity = d["_id"][source];
            var destinationCity = d["_id"][destination];

            if (sourceCities.indexOf(sourceCity) < 0) {
                cities.push({
                    name: sourceCity,
                    type: source
                });
                sourceCities.push(sourceCity);
            }

            if (destinationCities.indexOf(destinationCity) < 0) {
                cities.push({
                    name: destinationCity,
                    type: destination
                });
                destinationCities.push(destinationCity);
            }
        }

        var cityCircles = _self.svg
            .selectAll(".city")
            .data(cities);

        cityCircles.exit().attr("r", "0.1px").transition().delay(1000);

        cityCircles.enter().append("circle")
            .transition().delay(1000)
            .attr("class", "city")
            .style("pointer-events", "none")
            .attr("cx", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                if (loc && loc.lon)
                    return _self.projection([loc.lon, loc.lat])[0];

                return -10;
            }).attr("cy", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                if (loc && loc.lat)
                    return _self.projection([loc.lon, loc.lat])[1];

                return -10;
            })
            .attr("fill", function (d) {
                //return _self.colors(d["_id"][destination]);
                return d.type == source ? "#4292c6" : "transparent";
            })
            .attr("fill-opacity", 0.7)
            .attr("stroke", function (d) {
                //return _self.colors(d["_id"][destination]);
                return d.type == source ? "transparent" : "#222";
            })
            .attr("stroke-opacity", 0.7)
            .attr("stroke-width", "1px")
            .attr("r", "5px");

        cityCircles.attr("cx", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                if (loc && loc.lon)
                    return _self.projection([loc.lon, loc.lat])[0];

                return -10;
            }).attr("cy", function (d, i) {

                var s = d.name;
                var loc = usStates[s];

                if (loc && loc.lat)
                    return _self.projection([loc.lon, loc.lat])[1];

                return -10;
            })
            .attr("fill", function (d) {
                //return _self.colors(d["_id"][destination]);
                return d.type == source ? "#4292c6" : "transparent";
            })
            .attr("fill-opacity", 0.7)
            .attr("stroke", function (d) {
                //return _self.colors(d["_id"][destination]);
                return d.type == source ? "transparent" : "#222";
            })
            .attr("stroke-opacity", 0.7)
            .attr("stroke-width", "1px")
            .attr("r", "5px");


        _self.lasso.items(d3.selectAll("circle"));

        var cityLinks = _self.svg.selectAll(".links").selectAll("line").data(_self.targetData.slice(0, 100));

        cityLinks.exit().remove();

        cityLinks.enter()
            .append("line")
            .attr("class", "link")
            .attr("stroke", function (d) {
                return "#9ecae1";
                //return _self.colors(d["_id"][destination]);
            })
            .attr("stroke-width", function (d, i) {
                return 0.5;
                return (1 + Math.log(d["Flights"] + 1)) + "px";
            })
            .attr("stroke-opacity", 0.1)
            .attr("x1", function (d, i) {

                var s = d["_id"][source];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[0];
            })
            .attr("y1", function (d, i) {

                var s = d["_id"][source];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[1];

            })
            .attr("x2", function (d, i) {

                var s = d["_id"][destination];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[0];

            })
            .attr("y2", function (d, i) {

                var s = d["_id"][destination];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[1];

            });

        cityLinks.attr("x1", function (d, i) {

                var s = d["_id"][source];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[0];
            })
            .attr("y1", function (d, i) {

                var s = d["_id"][source];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[1];

            })
            .attr("x2", function (d, i) {

                var s = d["_id"][destination];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[0];

            })
            .attr("y2", function (d, i) {

                var s = d["_id"][destination];
                var loc = usStates[s];
                var c = _self.projection([loc.lon, loc.lat])

                return c[1];

            });


    }

}

Map.prototype.refreshMicroViz = function () {

    var _self = this;

    var _self = this;

    var div = _self.parentId;

    div = div.replace("div", "");

    var y = parseInt(div[0]);

    var x = parseInt(div[1]);

    _self.direction = "left";
    _self.axisDirection = "right";

    _self.horizonWidth = _self.width + _self.margin.left + _self.margin.right;
    _self.horizonHeight = _self.height + _self.margin.top + _self.margin.bottom;

    var majorDimension = _self.majorDimension = _self.horizonHeight;
    var minorDimension = _self.minorDimension = _self.horizonWidth;

    if (x - mainView[1] > 0) {
        _self.direction = "right";
        _self.axisDirection = "left";
    }

    if (y - mainView[0] > 0) {
        _self.direction = "bottom";
        _self.axisDirection = "top";
        _self.majorDimension = _self.horizonWidth;
        _self.minorDimension = _self.horizonHeight;
    }


    if (y - mainView[0] < 0) {
        _self.direction = "top";
        _self.axisDirection = "bottom";
        _self.majorDimension = _self.horizonWidth;
        _self.minorDimension = _self.horizonHeight;
    }

    if (d3.select("#horizon-choropleth").empty() || _self.svg.select(".parallel").empty()) {

        $("#" + _self.parentId).empty();

        _self.y = {};
        _self.line = d3.svg.line().interpolate(function (points) {

            if (_self.direction == "right")
                return points.join("A 1,3 0 0 0 ");

            if (_self.direction == "left")
                return points.join("A 1,3 0 0 1 ");

            if (_self.direction == "bottom")
                return points.join("A 1,1 0 0 1 ");

            if (_self.direction == "top")
                return points.join("A 1,1 0 0 0 ");

        });

        _self.axis = d3.svg.axis().orient(_self.axisDirection);
        _self.parallel;

        _self.svg = d3.select("#" + _self.parentId).append("svg")
            .attr("id", "horizon-choropleth")
            .attr("width", _self.horizonWidth)
            .attr("height", _self.horizonHeight)
            .on("click", function () {
                var divId = _self.parentId;

                divId = divId.replace("div", "");
                var y = parseInt(divId[0]);
                var x = parseInt(divId[1]);

                if (y != mainView[0] || x != mainView[1]) {
                    mainView = [y, x];
                    reDrawInterface();
                }

            });


        _self.dimensions = [source, destination];

        var top = _self.top = 35;

        _self.targetDataTemp = _self.targetData.slice(0, _self.top - 1);

        var cities = {};

        cities[_self.dimensions[0]] = d3.map(_self.targetDataTemp,
            function (d) {
                return d["_id"][_self.dimensions[0]];
            }).keys();

        cities[_self.dimensions[1]] = d3.map(_self.targetDataTemp,
            function (d) {
                return d["_id"][_self.dimensions[1]];
            }).keys();

        _self.dimensions.forEach(function (d) {
            _self.y[d] = d3.scale.ordinal()
                .domain(cities[d])
                .rangePoints([_self.majorDimension / _self.dimensions.length - 10, 0])
        });

        // Add blue parallel lines for focus.
        _self.parallel = _self.svg.append("g")
            .attr("class", "parallel")
            .selectAll("path")
            .data(_self.targetDataTemp)
            .enter().append("path")
            .attr("d", path)
            .attr("stroke", "#9ecae1")
            .attr("stroke-opacity", 0.1)
            .attr("stroke-width", "0.5px")
            .attr("stroke-width", function (d, i) {
                return "1px";
                return (Math.log(d["Flights"] + 0.5)) + "px";
            });

        // Returns the path for a given data point.
        function path(d) {
            return _self.line(_self.dimensions.map(function (p, i) {
                if (_self.direction == "left" || _self.direction == "right")
                    return [_self.direction == "left" ? 0 : _self.minorDimension,
                        i * _self.majorDimension / _self.dimensions.length
                        + _self.y[p](d["_id"][p])];

                if (_self.direction == "top" || _self.direction == "bottom")
                    return [i * _self.majorDimension / _self.dimensions.length
                        + _self.y[p](d["_id"][p]), _self.direction == "top" ? 0 :
                            _self.minorDimension,
                        ];

            }));
        }

        var g = _self.g = _self.svg.selectAll(".dimension")
            .data(_self.dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (d, i) {
                if (_self.direction == "left" || _self.direction == "right")
                    return "translate(" + (_self.direction == "left" ? 0 : _self.minorDimension) + "," + i * _self.majorDimension / _self.dimensions.length + ")";

                if (_self.direction == "top" || _self.direction == "bottom")
                    return "translate(" + i * _self.majorDimension / _self.dimensions.length + "," + (_self.direction == "top" ? 0 : _self.minorDimension) + ")";

            });


        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this)
                    .call(_self.axis.scale(_self.y[d]))
                    .selectAll("text")
                    .attr("transform", function (d, i) {
                        if (_self.direction == "top" || _self.direction == "bottom")
                            return _self.direction == "top" ? "rotate(90)" : "rotate(-90)";

                        return "rotate(0)";
                    })
                    .style("text-anchor", function () {
                        return _self.direction == "right" ? "end" : "start";
                    });
            })
            .append("text")
            .style("text-anchor", "end")
            .attr("x", function (d, i) {
                if (_self.direction == "left" || _self.direction == "right")
                    return _self.direction == "left" ? 40 : -30;

                if (_self.direction == "top" || _self.direction == "bottom")
                    return 40;

            })
            .attr("y", function (d, i) {
                if (_self.direction == "left" || _self.direction == "right")
                    return 40;

                if (_self.direction == "top" || _self.direction == "bottom")
                    return _self.direction == "top" ? 70 : -70;

            })
            .text(function (d) {
                return d;
            });

    } else {

        _self.axis.orient(_self.axisDirection);

        _self.targetDataTemp = _self.targetData.slice(0, _self.top - 1);

        _self.svg.attr("width", _self.horizonWidth)
            .attr("height", _self.horizonHeight)

        var cities = {};

        cities[_self.dimensions[0]] = d3.map(_self.targetDataTemp,
            function (d) {
                return d["_id"][_self.dimensions[0]];
            }).keys();

        cities[_self.dimensions[1]] = d3.map(_self.targetDataTemp,
            function (d) {
                return d["_id"][_self.dimensions[1]];
            }).keys();

        _self.dimensions.forEach(function (d) {
            _self.y[d].domain(cities[d])
                .rangePoints([_self.majorDimension / _self.dimensions.length - 10, 0])
        });


        _self.g
            .attr("class", "dimension")
            .attr("transform", function (d, i) {
                if (_self.direction == "left" || _self.direction == "right")
                    return "translate(" + (_self.direction == "left" ? 0 : _self.minorDimension) + "," + i * _self.majorDimension / _self.dimensions.length + ")";

                if (_self.direction == "top" || _self.direction == "bottom")
                    return "translate(" + i * _self.majorDimension / _self.dimensions.length + "," + (_self.direction == "top" ? 0 : _self.minorDimension) + ")";

            });

        _self.g.selectAll(".axis").remove();

        _self.g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this)
                    .call(_self.axis.scale(_self.y[d]))
                    .selectAll("text")
                    .attr("transform", function (d, i) {
                        if (_self.direction == "top" || _self.direction == "bottom")
                            return _self.direction == "top" ? "rotate(90)" : "rotate(-90)";

                        return "rotate(0)";
                    })
                    .style("text-anchor", function () {
                        return _self.direction == "right" ? "end" : "start";
                    });
            })
            .append("text")
            .style("text-anchor", "end")
            .attr("x", function (d, i) {
                if (_self.direction == "left" || _self.direction == "right")
                    return _self.direction == "left" ? 20 : -30;

                if (_self.direction == "top" || _self.direction == "bottom")
                    return 40;

            })
            .attr("y", function (d, i) {
                if (_self.direction == "left" || _self.direction == "right")
                    return 40;

                if (_self.direction == "top" || _self.direction == "bottom")
                    return _self.direction == "top" ? 70 : -70;

            })
            .text(function (d) {
                return d;
            });

        var parallelLines = _self.svg.selectAll(".parallel").selectAll("path")
            .data(_self.targetDataTemp);

        parallelLines.exit().remove();

        parallelLines.enter()
            .append("path")
            .transition().delay(500)
            .ease("linear")
            .attr("d", path)
            .attr("stroke", "#9ecae1")
            .attr("stroke-width", "1px");

        parallelLines.attr("d", path);

    }

}


Map.prototype.refreshThumbnail = function () {

    var _self = this;

    if (d3.select("#thumbnail-choropleth").empty() || d3.select("#map").empty()) {

        //$("#"+_self.parentId).empty();

        var top = 49.3457868;
        var left = -124.7844079;
        var right = -66.9513812;
        var bottom = 24.7433195;

        _self.svg
            .attr("id", "thumbnail-choropleth")
            .attr("class", "thumbnail")
            .attr("width", _self.width + _self.margin.left + _self.margin.right)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
            .on("click", function () {
                var divId = _self.parentId;

                divId = divId.replace("div", "");
                var y = parseInt(divId[0]);
                var x = parseInt(divId[1]);

                if (y != mainView[0] || x != mainView[1]) {
                    mainView = [y, x];
                    reDrawInterface();
                }

            });

        _self.thumbnailscale = THUMBNAIL_SCALE;

        var scale = 55 * (_self.height + _self.margin.top + _self.margin.bottom) / Math.abs(bottom - top);

        _self.projection = d3.geo.albersUsa()
            .scale(scale)
            .translate([(_self.width + _self.margin.left + _self.margin.right) / 2, (_self.height + _self.margin.top + _self.margin.bottom) / 2]);

        _self.path = d3.geo.path()
            .projection(_self.projection);

        //        _self.svg = d3.select("#" + _self.parentId)
        //            .append("svg")
        //            .attr("id", "thumbnail-choropleth")
        //            .attr("class", "thumbnail")
        //            .attr("width", _self.width + _self.margin.left + _self.margin.right)
        //            .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
        //            .on("click", function () {
        //                var divId = _self.parentId;
        //
        //                divId = divId.replace("div", "");
        //                var y = parseInt(divId[0]);
        //                var x = parseInt(divId[1]);
        //
        //                if (y != mainView[0] || x != mainView[1]) {
        //                    mainView = [y, x];
        //                    reDrawInterface();
        //                }
        //
        //            });

        // draw map
        d3.json("data/us.json", function (error, us) {

            _self.svg.select("#map")
                .datum(topojson.feature(us, us.objects.land))
                .attr("class", "land")
                .attr("d", _self.path)
                .style("pointer-events", "none");

            _self.svg.select("#boundary")
                .attr("id", "boundary")
                .datum(
                    topojson.mesh(us,
                        us.objects.states,
                        function (a, b) {
                            return a !== b;
                        }))
                .attr("class", "state-boundary")
                .attr("d", _self.path)
                .style("pointer-events", "none");

        });
        //
        //            var cities = [];
        //            var sourceCities = [];
        //            var destinationCities = [];
        //
        //            for (var i = 0; i < _self.targetData.length; i++) {
        //
        //                var d = _self.targetData[i];
        //                var sourceCity = d["_id"][source];
        //                var destinationCity = d["_id"][destination];
        //
        //                if (sourceCities.indexOf(sourceCity) < 0) {
        //                    cities.push({
        //                        name: sourceCity,
        //                        type: source
        //                    });
        //                    sourceCities.push(sourceCity);
        //                }
        //
        //                if (destinationCities.indexOf(destinationCity) < 0) {
        //                    cities.push({
        //                        name: destinationCity,
        //                        type: destination
        //                    });
        //                    destinationCities.push(destinationCity);
        //                }
        //            }
        //
        //            _self.svg
        //                .selectAll(".city")
        //                .data(cities)
        //                .enter().append("circle")
        //                .attr("class", "city")
        //                .style("pointer-events", "none")
        //                .attr("fill", function (d) {
        //                    //return _self.colors(d["_id"][destination]);
        //                    return d.type == source ? "#4292c6" : "#fb6a4a";
        //                })
        //                .attr("cx", function (d, i) {
        //
        //                    var s = d.name;
        //                    var loc = usStates[s];
        //
        //                    return _self.projection([loc.lon, loc.lat])[0];
        //                }).attr("cy", function (d, i) {
        //
        //                    var s = d.name;
        //                    var loc = usStates[s];
        //
        //                    return _self.projection([loc.lon, loc.lat])[1];
        //                })
        //                .attr("fill-opacity", 1)
        //                .attr("stroke", "white")
        //                .attr("stroke-width", "0.5px")
        //                .attr("r", function (d, i) {
        //                    return d.type == source ? 3 * _self.thumbnailscale + "px" : 6 * _self.thumbnailscale + "px";
        //                });
        //
        //            _self.svg.append("g")
        //                .style("pointer-events", "none")
        //                .attr("class", "links")
        //                .selectAll("line")
        //                .data(_self.targetData.slice(0, 100))
        //                .enter().append("line")
        //                .attr("class", "link")
        //                .style("pointer-events", "none")
        //                .attr("stroke", function (d) {
        //                    return "#9ecae1";
        //                    //return _self.colors(d["_id"][destination]);
        //                })
        //                .attr("stroke-width", function (d, i) {
        //                    return (Math.log(d["Flights"] + 0.5)) * _self.thumbnailscale + "px";
        //                })
        //                .attr("stroke-opacity", 0.1)
        //                .attr("x1", function (d, i) {
        //
        //                    var s = d["_id"][source];
        //                    var loc = usStates[s];
        //                    var c = _self.projection([loc.lon, loc.lat])
        //
        //                    return c[0];
        //                })
        //                .attr("y1", function (d, i) {
        //
        //                    var s = d["_id"][source];
        //                    var loc = usStates[s];
        //                    var c = _self.projection([loc.lon, loc.lat])
        //
        //                    return c[1];
        //
        //                })
        //                .attr("x2", function (d, i) {
        //
        //                    var s = d["_id"][destination];
        //                    var loc = usStates[s];
        //                    var c = _self.projection([loc.lon, loc.lat])
        //
        //                    return c[0];
        //
        //                })
        //                .attr("y2", function (d, i) {
        //
        //                    var s = d["_id"][destination];
        //                    var loc = usStates[s];
        //                    var c = _self.projection([loc.lon, loc.lat])
        //
        //                    return c[1];
        //
        //                });
        //
        //        });

    }

    var cities = [];
    var sourceCities = [];
    var destinationCities = [];
    for (var i = 0; i < _self.targetData.length; i++) {

        var d = _self.targetData[i];
        var sourceCity = d["_id"][source];
        var destinationCity = d["_id"][destination];

        if (sourceCities.indexOf(sourceCity) < 0) {
            cities.push({
                name: sourceCity,
                type: source
            });
            sourceCities.push(sourceCity);
        }

        if (destinationCities.indexOf(destinationCity) < 0) {
            cities.push({
                name: destinationCity,
                type: destination
            });
            destinationCities.push(destinationCity);
        }
    }

    var cityCircles = _self.svg
        .selectAll(".city")
        .data(cities);

    cityCircles.exit().attr("r", "0.1px").transition().delay(1000);

    cityCircles.enter().append("circle")
        .transition().delay(1000)
        .attr("class", "city")
        .style("pointer-events", "none")
        .attr("fill", function (d) {
            //return _self.colors(d["_id"][destination]);
            return d.type == source ? "#4292c6" : "#fb6a4a";
        })
        .attr("cx", function (d, i) {

            var s = d.name;
            var loc = usStates[s];

            if (loc && loc.lon)
                return _self.projection([loc.lon, loc.lat])[0];

            return -10;
        }).attr("cy", function (d, i) {

            var s = d.name;
            var loc = usStates[s];

            if (loc && loc.lat)
                return _self.projection([loc.lon, loc.lat])[1];

            return -10;
        })
        .attr("fill-opacity", 1)
        .attr("stroke", "white")
        .attr("stroke-width", "0.5px")
        .attr("r", function (d, i) {
            return d.type == source ? 3 * _self.thumbnailscale + "px" : 6 * _self.thumbnailscale + "px";
        });

    cityCircles.attr("cx", function (d, i) {

            var s = d.name;
            var loc = usStates[s];

            if (loc && loc.lon)
                return _self.projection([loc.lon, loc.lat])[0];

            return -10;
        }).attr("cy", function (d, i) {

            var s = d.name;
            var loc = usStates[s];

            if (loc && loc.lat)
                return _self.projection([loc.lon, loc.lat])[1];

            return -10;
        })
        .attr("fill-opacity", 1)
        .attr("stroke", "white")
        .attr("stroke-width", "0.5px")
        .attr("r", function (d, i) {
            return d.type == source ? 3 * _self.thumbnailscale + "px" : 6 * _self.thumbnailscale + "px";
        });

    var cityLinks = _self.svg.selectAll(".links").selectAll("line").data(_self.targetData.slice(0, 100));

    cityLinks.exit().remove();

    cityLinks.enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke", function (d) {
            return "#9ecae1";
            //return _self.colors(d["_id"][destination]);
        })
        .attr("stroke-width", function (d, i) {
            return 0.5;
            return (1 + Math.log(d["Flights"] + 1)) * _self.thumbnailscale + "px";
        })
        .attr("stroke-opacity", 0.1)
        .attr("x1", function (d, i) {

            var s = d["_id"][source];
            var loc = usStates[s];
            var c = _self.projection([loc.lon, loc.lat])

            return c[0];
        })
        .attr("y1", function (d, i) {

            var s = d["_id"][source];
            var loc = usStates[s];
            var c = _self.projection([loc.lon, loc.lat])

            return c[1];

        })
        .attr("x2", function (d, i) {

            var s = d["_id"][destination];
            var loc = usStates[s];
            var c = _self.projection([loc.lon, loc.lat])

            return c[0];

        })
        .attr("y2", function (d, i) {

            var s = d["_id"][destination];
            var loc = usStates[s];
            var c = _self.projection([loc.lon, loc.lat])

            return c[1];

        });

    cityLinks.attr("x1", function (d, i) {

            var s = d["_id"][source];
            var loc = usStates[s];
            var c = _self.projection([loc.lon, loc.lat])

            return c[0];
        })
        .attr("y1", function (d, i) {

            var s = d["_id"][source];
            var loc = usStates[s];
            var c = _self.projection([loc.lon, loc.lat])

            return c[1];

        })
        .attr("x2", function (d, i) {

            var s = d["_id"][destination];
            var loc = usStates[s];
            var c = _self.projection([loc.lon, loc.lat])

            return c[0];

        })
        .attr("y2", function (d, i) {

            var s = d["_id"][destination];
            var loc = usStates[s];
            var c = _self.projection([loc.lon, loc.lat])

            return c[1];

        });




}

Map.prototype.reDrawChart = function (flag, width, height) {

    var _self = this;

    _self.width = width - _self.margin.left - _self.margin.right;

    _self.height = height - _self.margin.top - _self.margin.bottom;


    if (flag) {

        _self.svg = null;

        $("#" + _self.parentId).empty();

        _self.refreshChart();

    } else {

        //_self.svg = null;

        device == "MOBILE" ? _self.refreshMicroViz() : _self.refreshThumbnail();

    }


}

Map.prototype.postUpdate = function (cquery) {

    var _self = this;

    $.ajax({

        type: "GET",
        url: "/getFlightCounts",
        data: {
            data: cquery? cquery: queryStack
        }
    }).done(function (data) {

        _self.targetData = JSON.parse(data);

        if (device == "DESKTOP") {
            _self.refreshChart();
            return;
        }

        if (device == "MOBILE") {
            if (_self.parentId == "div" + mainView[0] + "" + mainView[1]) {

                _self.refreshChart();

            } else {

                _self.refreshMicroViz();
            }
        }

        if (device == "MOBILE2") {
            if (_self.parentId == "div" + mainView[0] + "" + mainView[1]) {

                _self.refreshChart();

            } else {

                _self.refreshThumbnail();
            }
        }

    });
}