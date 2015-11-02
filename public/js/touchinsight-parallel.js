function Parallel(options) {

    var _self = this;

    _self.parentId = options.parentId;

    _self.cols = options.cols;

    _self.margin = {
        top: 20,
        right: 0,
        bottom: 10,
        left: 10
    };

    _self.target = options.target;

    _self.link = options.link;

    _self.width = options.width - _self.margin.left - _self.margin.right;

    _self.height = options.height - _self.margin.top - _self.margin.bottom;

    var query = new Query({
        index: "Date",
        value: ["1990", "2009"],
        operator: "range",
        logic: "CLEAN"
    });

    setGlobalQuery(query);

    _self.postUpdate();

}

Parallel.prototype.refreshChart = function () {

    var _self = this;

    if (!_self.svg || _self.svg.select(".parallel").empty()) {

        _self.x = d3.scale.ordinal().rangePoints([0, _self.width], 1);

        if (!_self.y)
            _self.y = {};

        _self.dragging = {};

        _self.line = d3.svg.line().interpolate("cardinal");

        _self.axis = d3.svg.axis().orient("left")
            .tickFormat(d3.format("s")).ticks(_self.height / 20);

        _self.background;
        _self.foreground;

        _self.svg = d3.select("#" + _self.parentId).append("svg")
            .attr("width", _self.width + _self.margin.left + _self.margin.right)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + _self.margin.left + "," + _self.margin.top + ")");

        _self.x.domain(_self.dimensions = d3.keys(_self.targetData[0]["_id"])
            .filter(function (d) {
                return (
                    _self.y[d] = !_self.y[d] ? d3.scale.linear()
                    .domain([0, d3.max(_self.targetData, function (p) {
                        return +p["_id"][d];
                    })])
                    .range([_self.height, 0]) : _self.y[d].range([_self.height, 0])
                );
            }));

        _self.datadimension = d3.scale.linear().domain(d3.extent(_self.targetData,
                function (p) {
                    return +p[_self.target];
                }))
            .range([1, 10]);

        // Add blue foreground lines for focus.
        _self.parallel = _self.svg.append("g")
            .attr("class", "parallel")
            .selectAll("path")
            .data(_self.targetData)
            .enter().append("path")
            .attr("d", path)
            .attr("stroke", "#9ecae1")
            .attr("stroke-width", function (d) {
                return _self.datadimension(d[_self.target]) + "px";
            });

        // Add a group element for each dimension.
        var g = _self.g = _self.svg.selectAll(".dimension")
            .data(_self.dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (d) {
                return "translate(" + _self.x(d) + ")";
            });

        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(_self.axis.scale(_self.y[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function (d) {
                return d;
            });

        g.append("g")
            .attr("class", "brush")
            .each(function (d) {
                d3.select(this).call(_self.y[d].brush = d3.svg.brush().y(_self.y[d])
                    .on("brushstart", brushstart)
                    .on("brushend", brush));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);

        function transition(g) {
            return g.transition().duration(500);
        }

        // Returns the path for a given data point.
        function path(d) {
            return _self.line(_self.dimensions.map(function (p) {
                return [_self.x(p), _self.y[p](d["_id"][p])];
            }));
        }

        function brushstart() {
            d3.event.sourceEvent.stopPropagation();
        }

        // Handles a brush event, toggling the display of foreground lines.
        function brush() {
            var queries = [];

            var actives = _self.dimensions.filter(function (p) {
                    return !_self.y[p].brush.empty();
                }),
                extents = actives.map(function (p, i) {
                    var ex = _self.y[p].brush.extent();

                    var query = new Query({
                        index: p,
                        value: [Math.round(ex[0]), Math.round(ex[1])],
                        operator: "range",
                        logic: "AND",
                    });

                    if (i == 0) {
                        query.logic = currentLogic;
                    }

                    queries.push(query);

                    if (i == actives.length - 1) {

                        setGlobalQuery(query, 1);

                    } else {

                        setGlobalQuery(query);

                    }

                    return _self.y[p].brush.extent();
                });

        }

    } else {

        var parallelLines = _self.svg.selectAll(".parallel")
            .selectAll("path")
            .data(_self.targetData);

        _self.x.domain(_self.dimensions = d3.keys(_self.targetData[0]["_id"])
            .filter(function (d) {
                return (
                    _self.y[d] = d3.scale.linear()
                    .domain([0, d3.max(_self.targetData, function (p) {
                        return +p["_id"][d];
                    })])
                    .range([_self.height, 0])
                );
            }));

        
        // Add an axis and title.
        _self.g.selectAll(".axis")
            .each(function (d) {
                d3.select(this).call(_self.axis.scale(_self.y[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function (d) {
                return d;
            });
        
        _self.g.selectAll(".brush")
            .each(function (d) {
                d3.select(this).call(_self.y[d].brush = d3.svg.brush().y(_self.y[d])
                    .on("brushstart", brushstart)
                    .on("brushend", brush));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);

        _self.datadimension.domain(d3.extent(_self.targetData,
                function (p) {
                    return +p[_self.target];
                }))
            .range([1, 10]);

        parallelLines.exit().remove();

        parallelLines.enter()
            .append("path")
            .transition().delay(500)
            .ease("linear")
            .attr("d", path)
            .attr("stroke", "#9ecae1")
            .attr("stroke-width", function (d) {
                return _self.datadimension(d[_self.target]) + "px";
            });

        parallelLines.attr("d", path);
    }
}

Parallel.prototype.refreshMicroViz = function () {

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

    if (d3.select("#micro" + _self.parentId).empty() ||
        _self.svg.select(".parallel").empty()) {

        $("#" + _self.parentId).empty();

        if (!_self.y)
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

        _self.datadimension = d3.scale.linear().domain(d3.extent(_self.targetData,
                function (p) {
                    return +p[_self.target];
                }))
            .range([1, 20]);

        _self.axis = d3.svg.axis().orient(_self.axisDirection)
            .tickFormat(d3.format("s"));

        _self.parallel;

        _self.svg = d3.select("#" + _self.parentId).append("svg")
            .attr("id", "micro" + _self.parentId)
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


        _self.dimensions = d3.keys(_self.targetData[0]["_id"])
            .filter(function (d) {
                return (
                    _self.y[d] = !_self.y[d] ? d3.scale.linear()
                    .domain([0, d3.max(_self.targetData, function (p) {
                        return +p["_id"][d];
                    })])
                    .range([_self.majorDimension /
                            d3.keys(_self.targetData[0]["_id"]).length - 5, 0]) : _self.y[d].range([_self.majorDimension /
                                        d3.keys(_self.targetData[0]["_id"]).length - 5, 0])
                );
            });


        // Add blue parallel lines for focus.
        _self.parallel = _self.svg.append("g")
            .attr("class", "parallel")
            .selectAll("path")
            .data(_self.targetData)
            .enter().append("path")
            .attr("d", path)
            .attr("stroke", "#9ecae1")
            .attr("stroke-opacity", 0.05)
            .attr("stroke-width", function (d) {
                return _self.datadimension(d[_self.target]) + "px";
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
                    return "translate(" + +i * _self.majorDimension / _self.dimensions.length + "," + (_self.direction == "top" ? 0 : _self.minorDimension) + ")";

            });


        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(_self.axis.scale(_self.y[d]));
            })
            .append("text")
            .style("color", "black")
            .style("text-anchor", "end")
            .attr("x", function (d, i) {
                if (_self.direction == "left" || _self.direction == "right")
                    return _self.direction == "left" ? 40 : -30;

                if (_self.direction == "top" || _self.direction == "bottom")
                    return 40;

            })
            .attr("y", function (d, i) {
                if (_self.direction == "left" || _self.direction == "right")
                    return 60;

                if (_self.direction == "top" || _self.direction == "bottom")
                    return _self.direction == "top" ? 60 : -60;

            })
            .text(function (d) {
                return d;
            });

    } else {

        _self.datadimension.domain(d3.extent(_self.targetData,
                function (p) {
                    return +p[_self.target];
                }))
            .range([1, 20]);

        _self.line.interpolate(function (points) {

            if (_self.direction == "right")
                return points.join("A 1,3 0 0 0 ");

            if (_self.direction == "left")
                return points.join("A 1,3 0 0 1 ");

            if (_self.direction == "bottom")
                return points.join("A 1,1 0 0 1 ");

            if (_self.direction == "top")
                return points.join("A 1,1 0 0 0 ");

        });

        _self.dimensions.forEach(function (d) {

            _self.y[d]
                .range([_self.majorDimension /
                                        d3.keys(_self.targetData[0]["_id"]).length - 5, 0])

        });

        _self.axis.orient(_self.axisDirection)
            .tickFormat(d3.format("s"));

        var parallelLines = _self.svg.selectAll(".parallel").selectAll("path")
            .data(_self.targetData);

        _self.svg
            .attr("width", _self.horizonWidth)
            .attr("height", _self.horizonHeight);

        parallelLines.exit().remove();

        parallelLines.enter()
            .append("path")
            .transition().duration(1000)
            .ease("linear")
            .attr("d", path)
            .attr("stroke", "#9ecae1")
            .attr("stroke-width", function (d) {
                return _self.datadimension(d[_self.target]) + "px";
            });

        parallelLines.attr("d", path);

        _self.g.attr("transform", function (d, i) {
            if (_self.direction == "left" || _self.direction == "right")
                return "translate(" + (_self.direction == "left" ? 0 : _self.minorDimension) + "," + i * _self.majorDimension / _self.dimensions.length + ")";

            if (_self.direction == "top" || _self.direction == "bottom")
                return "translate(" + +i * _self.majorDimension / _self.dimensions.length + "," + (_self.direction == "top" ? 0 : _self.minorDimension) + ")";

        });

        _self.g.selectAll(".axis")
            .remove();

        _self.g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(_self.axis.scale(_self.y[d]));
            })
            .append("text")
            .style("color", "black")
            .style("text-anchor", "end")
            .attr("x", function (d, i) {
                if (_self.direction == "left" || _self.direction == "right")
                    return _self.direction == "left" ? 40 : -30;

                if (_self.direction == "top" || _self.direction == "bottom")
                    return 40;

            })
            .attr("y", function (d, i) {
                if (_self.direction == "left" || _self.direction == "right")
                    return 60;

                if (_self.direction == "top" || _self.direction == "bottom")
                    return _self.direction == "top" ? 60 : -60;

            })
            .text(function (d) {
                return d;
            });
    }

}

Parallel.prototype.refreshThumbnail = function () {

    var _self = this;

    _self.thumbnailscale = THUMBNAIL_SCALE;

    _self.thumbnailwidth = _self.width + _self.margin.left + _self.margin.right;
    _self.thumbnailheight = _self.height + _self.margin.top + _self.margin.bottom

    if (d3.select("#thumbnail" + _self.parentId).empty() ||
        _self.svg.select(".parallel").empty()) {

        $("#" + _self.parentId).empty();

        _self.x = d3.scale.ordinal().rangePoints([0, _self.width], 1);
        if (!_self.y)
            _self.y = {};

        _self.line = d3.svg.line();
        _self.axis = d3.svg.axis().orient("left")
            .tickFormat(d3.format("s")).ticks(_self.height / 20);

        _self.datadimension = d3.scale.linear().domain(d3.extent(_self.targetData,
                function (p) {
                    return +p[_self.target];
                }))
            .range([1 * _self.thumbnailscale, 20 * _self.thumbnailscale]);

        _self.svg = d3.select("#" + _self.parentId).append("svg")
            .attr("id", "thumbnail" + _self.parentId)
            .attr("class", "thumbnail")
            .attr("width", _self.thumbnailwidth)
            .attr("height", _self.thumbnailheight)
            .on("click", function () {
                var divId = _self.parentId;

                divId = divId.replace("div", "");
                var y = parseInt(divId[0]);
                var x = parseInt(divId[1]);

                if (y != mainView[0] || x != mainView[1]) {
                    mainView = [y, x];
                    reDrawInterface();
                }

            })
            .append("g")
            .attr("transform", "translate(" + _self.margin.left * _self.thumbnailscale + "," + _self.margin.top + ")")
            .style("pointer-events", "none")
            .style('font-size', 10 * _self.thumbnailscale + "px");

        _self.x.domain(_self.dimensions = d3.keys(_self.targetData[0]["_id"])
            .filter(function (d) {
                return (
                    _self.y[d] = !_self.y[d] ? d3.scale.linear()
                    .domain([0, d3.max(_self.targetData, function (p) {
                        return +p["_id"][d];
                    })])
                    .range([_self.thumbnailheight - _self.margin.top, 0]) :
                    _self.y[d].range([_self.thumbnailheight - _self.margin.top, 0])
                );
            }));

        // Add blue foreground lines for focus.
        _self.parallel = _self.svg.append("g")
            .attr("class", "parallel")
            .selectAll("path")
            .data(_self.targetData)
            .enter().append("path")
            .attr("d", path)
            .attr("stroke", "#9ecae1")
            .attr("stroke-width", function (d) {
                return _self.datadimension(d[_self.target]) + "px";
            })
            .attr("stroke-linecap", "round")
            .style("pointer-events", "none");

        // Add a group element for each dimension.
        var g = _self.g = _self.svg.selectAll(".dimension")
            .data(_self.dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (d) {
                return "translate(" + _self.x(d) + ")";
            });

        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(_self.axis.scale(_self.y[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function (d) {
                return d;
            });


        function transition(g) {
            return g.transition().duration(500);
        }

        // Returns the path for a given data point.
        function path(d) {
            return _self.line(_self.dimensions.map(function (p) {
                return [_self.x(p), _self.y[p](d["_id"][p])];
            }));
        }

    } else {

        _self.datadimension.domain(d3.extent(_self.targetData,
                function (p) {
                    return +p[_self.target];
                }))
            .range([1, 20]);

        var parallelLines = _self.svg.selectAll(".parallel").selectAll("path")
            .data(_self.targetData);

        parallelLines.exit().remove();

        parallelLines.enter()
            .append("path")
            .transition().duration(1000)
            .ease("linear")
            .attr("d", path)
            .attr("stroke-linecap", "round")
            .attr("stroke", "#9ecae1")
            .attr("stroke-width", function (d) {
                return _self.datadimension(d[_self.target]) + "px";
            });

        parallelLines.attr("d", path);
    }
}

Parallel.prototype.reDrawChart = function (flag, width, height) {

    var _self = this;

    _self.width = width - _self.margin.left - _self.margin.right;

    _self.height = height - _self.margin.top - _self.margin.bottom;

    if (flag) {

        _self.svg = null;

        $("#" + _self.parentId).empty();

        _self.refreshChart();

    } else {

        //_self.svg = null;

        device == 1 ? _self.refreshMicroViz() : _self.refreshThumbnail();

    }

}

Parallel.prototype.postUpdate = function () {

    var _self = this;

    $.ajax({

        type: "GET",
        url: "/" + _self.link,
        data: {
            data: queryStack
        }

    }).done(function (data) {

        _self.targetData = JSON.parse(data);

        if (device == 0) {
            _self.refreshChart();
            return;
        }

        if (device == 1) {
            if (_self.parentId == "div" + mainView[0] + "" + mainView[1]) {

                _self.refreshChart();

            } else {

                _self.refreshMicroViz();
            }
        }

        if (device == 2) {
            if (_self.parentId == "div" + mainView[0] + "" + mainView[1]) {

                _self.refreshChart();

            } else {

                _self.refreshThumbnail();
            }
        }

    });

}