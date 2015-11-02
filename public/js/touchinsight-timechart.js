function TimeChart(options) {

    var _self = this;

    _self.parentId = options.parentId;

    _self.cols = options.cols;

    _self.margin = {
        top: 5,
        right: 10,
        bottom: 20,
        left: 35
    };

    _self.target = options.target;

    _self.text = options.text;

    _self.link = options.link;

    _self.width = options.width - _self.margin.left - _self.margin.right;

    _self.height = options.height - _self.margin.top - _self.margin.bottom;

    var parseDate = d3.time.format("%Y").parse;

    var query = new Query({
        index: "Date",
        value: ["1990", "2009"],
        operator: "range",
        logic: "CLEAN"
    });

    setGlobalQuery(query);

    _self.postUpdate();

}

TimeChart.prototype.refreshChart = function () {

    var _self = this;

    if (!_self.svg || _self.svg.select("path").empty()) {

        _self.svg = d3.select("#" + _self.parentId)
            .append("svg")
            .attr("id", "timechart")
            .attr("width", _self.width + _self.margin.left + _self.margin.right)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (_self.margin.left) + "," +
                _self.margin.top + ")");

        _self.x = d3.time.scale().range([0, _self.width]);

        var x = _self.x;

        _self.brush = d3.svg.brush()
            .x(_self.x)
            .on("brushend", brushed);

        var y = _self.y = d3.scale.linear()
            .range([_self.height, 0]);

        var xAxis = _self.xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(function (d) {
                return d3.time.format('%Y')(new Date(d));
            })
            .innerTickSize(-_self.height)
            .outerTickSize(0)
            .tickPadding(10);

        _self.xAxis.ticks(d3.time.years, 1);

        if (_self.width < 400) {

            _self.xAxis.ticks(d3.time.years, 6);

        }

        var yAxis = _self.yAxis = d3.svg.axis()
            .scale(y)
            .orient("left").tickFormat(d3.format("s"))
            .innerTickSize(-_self.width)
            .outerTickSize(0)
            .tickPadding(10)
            .ticks(_self.height / 20);

        var area = _self.area = d3.svg.area()
            .x(function (d) {
                return x(parseDate(d["_id"][date]));
            })
            .y0(_self.height)
            .y1(function (d) {
                return y(d[_self.target]);
            });

        x.domain(d3.extent(_self.targetData, function (d) {
            return parseDate(d["_id"][date]);
        }));

        x.domain([parseDate("1990"), parseDate("2009")]);

        y.domain(d3.extent(_self.targetData, function (d) {
            return d[_self.target];
        }));

        _self.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + _self.height + ")")
            .call(xAxis);

        _self.svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(_self.text);

        _self.targetData.sort(function (a, b) {
            if (parseDate(b["_id"][date]).getTime() <
                parseDate(a["_id"][date]).getTime()) return 1;
            return -1;
        });

        _self.svg.append("path")
            .datum(_self.targetData)
            .attr("id", "time")
            .attr("class", "flightsTime")
            .attr("d", area)
            .attr("fill", "#9ecae1")
            .attr("fill-opacity", 0.5)
            .attr("stroke", "#9ecae1")
            .attr("stroke-width", "1.5px");

        _self.svg.append("g")
            .attr("class", "brush")
            .call(_self.brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", _self.height + 7);

        function brushed() {

            var left = _self.brush.extent()[0];
            var right = _self.brush.extent()[1];

            var leftYear = left.getFullYear().toString();
            var leftMonth = left.getMonth() < 10 ? "0" + left.getMonth().toString() : left.getMonth().toString();

            left = leftYear + leftMonth;

            var rightYear = right.getFullYear().toString();
            var rightMonth = right.getMonth() < 10 ? "0" + right.getMonth().toString() : right.getMonth().toString();

            right = rightYear + rightMonth;

            console.log(left + ", " + right);

            var query = new Query({
                index: "Date",
                value: [left, right],
                operator: "range",
                logic: currentLogic
            });

            setGlobalQuery(query, 1);
        }

    } else {

        _self.targetData.sort(function (a, b) {
            if (parseDate(a["_id"]["Date"]).getTime() <
                parseDate(b["_id"]["Date"]).getTime()) {
                return 1;
            }
            return -1;
        });

        _self.y.domain(d3.extent(_self.targetData, function (d) {
            return d[_self.target];
        }));

        _self.yAxis.scale(_self.y);

        _self.svg.select(".y.axis")
            .call(_self.yAxis);

        _self.svg.select("#time")
            .datum(_self.targetData)
            .attr("d", _self.area)
            .attr("fill", "#9ecae1")
            .attr("fill-opacity", 0.5)
            .attr("stroke", "#9ecae1")
            .attr("stroke-width", "1.5px");

    }

}

TimeChart.prototype.refreshMicroViz = function () {

    var _self = this;

    var div = _self.parentId;

    div = div.replace("div", "");

    var y = parseInt(div[0]);

    var x = parseInt(div[1]);

    var direction = "left";
    var axisDirection = "right";

    _self.horizonWidth = _self.width + _self.margin.left + _self.margin.right;
    _self.horizonHeight = _self.height + _self.margin.top + _self.margin.bottom;

    var majorDimension = _self.majorDimension = _self.horizonHeight;
    var minorDimension = _self.minorDimension = _self.horizonWidth;

    if (x - mainView[1] > 0) {

        direction = "right";
        axisDirection = "left";

    }

    if (y - mainView[0] > 0) {

        direction = "bottom";
        axisDirection = "top";

        _self.majorDimension = _self.horizonWidth;
        _self.minorDimension = _self.horizonHeight;

    }

    if (y - mainView[0] < 0) {

        direction = "top";
        axisDirection = "bottom";

        _self.majorDimension = _self.horizonWidth;
        _self.minorDimension = _self.horizonHeight;

    }

    if (d3.select("#horizon-" + _self.target).empty() || _self.svg.select("path").empty()) {

        $("#" + _self.parentId).empty();

        _self.targetData.sort(function (a, b) {
            if (parseDate(b["_id"][date]).getTime() <
                parseDate(a["_id"][date]).getTime()) return 1;
            return -1;
        });

        if (!_self.chart) {

            _self.chart = d3.horizon()
                .width(_self.majorDimension)
                .height(_self.minorDimension)
                .bands(3)
                .mode("mirror")
                .interpolate("basis");

        } else {

            _self.chart.width(_self.majorDimension)
                .height(_self.minorDimension);

        }

        var chart = _self.chart;

        _self.svg = d3.select("#" + _self.parentId).append("svg")
            .attr("id", "horizon-" + _self.target)
            .attr("width", _self.majorDimension)
            .attr("height", _self.minorDimension)
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
            .style("transform-origin", function () {
                if (direction == "left")
                    return "left bottom";

                if (direction == "right")
                    return "left bottom";


            })
            .style("-webkit-transform", function () {
                if (direction == "left")
                    return "translate(0px," + (-_self.minorDimension) + "px)" + " " + "rotate(90deg)";

                if (direction == "right")
                    return "translate(0px," + (-_self.minorDimension) + "px)" + " " + "rotate(90deg)";

                return "translate(0px,0px)";
            });

        // Offset so that positive is above-average and negative is below-average.
        var mean = _self.targetData.reduce(function (sum, v) {

            if (sum[_self.target])
                return sum[_self.target] + v[_self.target];
            else
                return sum + v[_self.target];

        }) / _self.targetData.length;

        console.log(mean);

        // Transpose column values to rows.
        var data = _self.targetData.map(function (d, i) {
            return [parseDate(d["_id"][date]), d[_self.target] - mean];
        });

        _self.svg.data([data]).call(chart);

        _self.x = _self.svg[0][0].__chart__.x;

        var xAxis = _self.xAxis = d3.svg.axis()
            .scale(_self.x)
            .orient("bottom")
            .tickFormat(function (d) {
                return d3.time.format('%Y')(new Date(d));
            });

        _self.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (_self.minorDimension - _self.margin.bottom) + ")")
            .call(xAxis);

        _self.svg.select(".x.axis").select("path")
            .style("display", "none");

        _self.svg.append("text")
            .attr("transform", "translate(" + 10 + "," + 15 + ")")
            .text(_self.text)
            .style("font-size", "13px");

    } else {

        _self.chart.width(_self.majorDimension)
            .height(_self.minorDimension);

        _self.svg
            .attr("width", _self.majorDimension)
            .attr("height", _self.minorDimension)
            .style("transform-origin", function () {
                if (direction == "left")
                    return "left bottom";

                if (direction == "right")
                    return "left bottom";


            })
            .style("-webkit-transform", function () {
                if (direction == "left")
                    return "translate(0px," + (-_self.minorDimension) + "px)" + " " + "rotate(90deg)";

                if (direction == "right")
                    return "translate(0px," + (-_self.minorDimension) + "px)" + " " + "rotate(90deg)";

                return "translate(0px,0px)";
            });

        _self.targetData.sort(function (a, b) {
            if (parseDate(b["_id"][date]).getTime() <
                parseDate(a["_id"][date]).getTime()) return 1;
            return -1;
        });

        var chart = _self.chart;

        // Offset so that positive is above-average and negative is below-average.
        var mean = _self.targetData.reduce(function (sum, v) {

            if (sum[_self.target])
                return sum[_self.target] + v[_self.target];
            else
                return sum + v[_self.target];

        }) / _self.targetData.length;

        console.log(mean);

        // Transpose column values to rows.
        var data = _self.targetData.map(function (d, i) {
            return [parseDate(d["_id"][date]), d[_self.target] - mean];
        });

        _self.svg.data([data]).call(chart);

        _self.x = _self.svg[0][0].__chart__.x;

        var xAxis = _self.xAxis = d3.svg.axis()
            .scale(_self.x)
            .orient("bottom")
            .tickFormat(function (d) {
                return d3.time.format('%Y')(new Date(d));
            });

        _self.svg.select(".x.axis")
            .attr("transform", "translate(0," + (_self.minorDimension - _self.margin.bottom) + ")")

        .call(xAxis);

        _self.svg.select(".x.axis").select("path")
            .style("display", "none");


        _self.svg.select("text")
            .attr("transform", "translate(" + 10 + "," + 15 + ")")
    }
}

TimeChart.prototype.refreshThumbnail = function () {

    var _self = this;

    if (d3.select("#thumbnail" + _self.target).empty() || _self.svg.select("path").empty()) {

        $("#" + _self.parentId).empty();

        _self.thumbnailscale = THUMBNAIL_SCALE;

        _self.svg = d3.select("#" + _self.parentId)
            .append("svg")
            .attr("class", "thumbnail" + _self.target)
            .attr("id", "timechart")
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

            })
            .append("g")
            .attr("transform", "translate(" + (_self.margin.left * _self.thumbnailscale + 5) + "," + 1 + ")")
            .style("pointer-events", "none")
            .style("font-size", 10 * _self.thumbnailscale + "px");

        var x = _self.x = d3.time.scale()
            .range([0, _self.width + _self.margin.left * _self.thumbnailscale]);

        var y = _self.y = d3.scale.linear()
            .range([_self.height + _self.margin.bottom * _self.thumbnailscale, 0]);

        var xAxis = _self.xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(function (d) {
                return d3.time.format('%b %y')(new Date(d));
            });

        _self.xAxis.ticks(d3.time.years, 6 / _self.thumbnailscale);

        var yAxis = _self.yAxis = d3.svg.axis()
            .scale(y)
            .orient("left").tickFormat(d3.format("s"));

        var area = _self.area = d3.svg.area()
            .x(function (d) {
                return x(parseDate(d["_id"][date]));
            })
            .y0(_self.height + _self.margin.bottom * _self.thumbnailscale)
            .y1(function (d) {
                return y(d[_self.target]);
            });

        x.domain(d3.extent(_self.targetData, function (d) {
            return parseDate(d["_id"][date]);
        }));

        x.domain([parseDate("1990"), parseDate("2009")]);

        y.domain(d3.extent(_self.targetData, function (d) {
            return d[_self.target];
        }));

        _self.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (_self.height + _self.margin.bottom * _self.thumbnailscale) + ")")
            .call(xAxis);

        _self.svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6 * _self.thumbnailscale)
            .attr("dy", ".31em")
            .style("text-anchor", "end")
            .text("Flights");

        _self.targetData.sort(function (a, b) {
            if (parseDate(b["_id"][date]).getTime() <
                parseDate(a["_id"][date]).getTime()) return 1;
            return -1;
        });

        _self.svg.append("path")
            .datum(_self.targetData)
            .attr("id", "time")
            .attr("class", "flightsTime")
            .attr("d", area)
            .attr("fill", "#9ecae1")
            .attr("fill-opacity", 0.5)
            .attr("stroke", "#9ecae1")
            .attr("stroke-width", 1.5 * _self.thumbnailscale + "px");


    } else {

        _self.targetData.sort(function (a, b) {
            if (parseDate(a["_id"]["Date"]).getTime() <
                parseDate(b["_id"]["Date"]).getTime()) {
                return 1;
            }
            return -1;
        });

        _self.y.domain(d3.extent(_self.targetData, function (d) {
            return d[_self.target];
        }));

        _self.yAxis.scale(_self.y);

        _self.svg.select(".y.axis")
            .call(_self.yAxis);

        _self.svg.select("#time")
            .datum(_self.targetData)
            .transition().duration(500)
            .attr("d", _self.area)
            .attr("fill", "#9ecae1")
            .attr("fill-opacity", 0.5)
            .attr("stroke", "#9ecae1")
            .attr("stroke-width", 1.5 * _self.thumbnailscale + "px");

    }

}

TimeChart.prototype.reDrawChart = function (flag, width, height) {

    var _self = this;

    _self.width = width - _self.margin.left - _self.margin.right;

    _self.height = height - _self.margin.top - _self.margin.bottom;


    if (flag) {

        _self.svg = null;

        $("#" + _self.parentId).empty();

        _self.refreshChart();

    } else {

        device == 1 ? _self.refreshMicroViz() : _self.refreshThumbnail();

    }


}

TimeChart.prototype.postUpdate = function () {

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