function Bar(options) {

    var _self = this;

    _self.parentId = options.parentId;

    _self.cols = options.cols;

    _self.target = options.target;

    _self.link = options.link;

    _self.text = options.text;

    _self.margin = {
        top: 5,
        right: 20,
        bottom: 30,
        left: 40
    };


    _self.width = options.width - _self.margin.left - _self.margin.right;

    _self.actualheight = options.height - _self.margin.top - _self.margin.bottom;

    var query = new Query({
        index: "Date",
        value: ["1990", "2009"],
        operator: "range",
        logic: "CLEAN"
    });

    setGlobalQuery(query);

    _self.postUpdate();
}

Bar.prototype.refreshChart = function () {

    var _self = this;

    if (!_self.svg || _self.svg.select("rect").empty()) {

        _self.height = 10000;

        d3.select("#" + _self.parentId).append("text")
            .text(_self.text)
            .style("font-size", "12px");

        _self.svg = d3.select("#" + _self.parentId).append("div")
            .style("overflow", "scroll")
            .style("width", _self.width + _self.margin.left + _self.margin.right)
            .style("height", _self.actualheight + _self.margin.top + _self.margin.bottom - 15)
            .append("svg")
            .attr("id", _self.target + "bar")
            .attr("width", _self.width + _self.margin.left + _self.margin.right - 5)
            .attr("height", _self.height + _self.margin.top + _self.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (_self.margin.left) + "," +
                _self.margin.top + ")");

        _self.x = d3.scale.linear()
            .domain([0, d3.max(_self.targetData, function (d) {
                return Math.pow(d[_self.target], 1);
            })])
            .range([0, _self.width]);

        _self.y = d3.scale.ordinal()
            .domain(_self.targetData.map(function (d) {
                return d["_id"][source];
            }))
            .rangeBands([0, _self.height]);

        //_self.barH = _self.height / _self.targetData.length;
        _self.barH = 20;

        _self.bars = _self.svg.selectAll("g")
            .data(_self.targetData)
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + _self.margin.left + "," + i * _self.barH + ")";
            });

        _self.bars.append("rect")
            .attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
            })
            .attr("height", _self.barH - 5)
            .attr("fill", "#9ecae1")
            .on("click", function () {

                var query = new Query({
                    index: source,
                    value: d3.select(this)[0][0].__data__["_id"][source],
                    operator: "equal",
                    logic: currentLogic
                });

                setGlobalQuery(query, 1);

            });

        _self.bars.append("text")
            .attr("x", function (d) {
                return 5;
            })
            .attr("y", _self.barH / 3)
            .attr("fill", "#222")
            .attr("text-anchor", "start")
            .attr("dy", ".35em")
            .text(function (d) {
                return Math.round(d[_self.target]);
            })
            .style("pointer-events", "none");

        _self.svg.selectAll("text.name")
            .data(_self.targetData)
            .enter().append("text")
            .attr("x", _self.margin.left - 5)
            .attr("y", function (d, i) {
                return i * _self.barH + _self.barH / 2;
            })
            .attr("fill", "#222")
            .attr("text-anchor", "end")
            .attr('class', 'name')
            .style("cursor", "pointer")
            .text(function (d) {
                return d["_id"][source];
            })
            .on("click", function () {
                alert(d3.select(this)[0][0].__data__["_id"][source]);

                var query = new Query({
                    index: source,
                    value: d3.select(this)[0][0].__data__["_id"][source],
                    operator: "equal",
                    logic: currentLogic
                });

                setGlobalQuery(query, 1);
            });


        if (device == 2 && _self.parentId != "div" + mainView[0] + "" + mainView[1]) {

            d3.select("#" + _self.parentId).select("div")
                .style("overflow", "hidden");

        }

    } else {

        var allBars = _self.svg.selectAll("g").data(_self.targetData);

        allBars.exit().remove();

        _self.x = d3.scale.linear()
            .domain([0, d3.max(_self.targetData, function (d) {
                return Math.pow(d[_self.target], 1);
            })])
            .range([0, _self.width]);

        var rects = allBars.enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + _self.margin.left + "," + i * _self.barH + ")";
            });

        rects.append("rect")
            .attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
            })
            .attr("height", _self.barH - 5)
            .attr("fill", "#9ecae1")
            .style("cursor", "pointer")
            .on("click", function () {
                
                var query = new Query({
                    index: source,
                    value: d3.select(this)[0][0].__data__["_id"][source],
                    operator: "equal",
                    logic: currentLogic
                });

                setGlobalQuery(query, 1);
            });

        rects.append("text")
            .attr("x", function (d) {
                return 5;
            })
            .attr("y", _self.barH / 3)
            .attr("fill", "#222")
            .attr("text-anchor", "start")
            .attr("dy", ".35em")
            .text(function (d) {
                return Math.round(d[_self.target]);
            })
            .style("pointer-events", "none");

        allBars.select("rect").attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
            })
            .attr("height", _self.barH - 5)
            .attr("fill", "#9ecae1");

        allBars.select("text")
            .attr("x", function (d) {
                return 5;
            })
            .attr("y", _self.barH / 3)
            .attr("fill", "#222")
            .attr("text-anchor", "start")
            .attr("dy", ".35em")
            .text(function (d) {
                return Math.round(d[_self.target]);
            });

        _self.y = d3.scale.ordinal()
            .domain(_self.targetData.map(function (d) {
                return d["_id"][source];
            }))
            .rangeBands([0, _self.height]);

        var allText = _self.svg.selectAll("text.name").data(_self.targetData);

        allText.exit().remove();

        allText.enter().append("text")
            .attr("x", _self.margin.left - 5)
            .attr("y", function (d, i) {
                return i * _self.barH + _self.barH / 2;
            })
            .attr("fill", "#222")
            .attr("text-anchor", "end")
            .text(function (d) {
                return d["_id"][source];
            });

        allText.attr("x", _self.margin.left - 5)
            .attr("y", function (d, i) {
                return i * _self.barH + _self.barH / 2;
            })
            .attr("fill", "#222")
            .attr("text-anchor", "end")
            .attr('class', 'name')
            .text(function (d) {
                return d["_id"][source];
            })
            .style("cursor", "pointer")
            .on("click", function () {
        
                var query = new Query({
                    index: source,
                    value: d3.select(this)[0][0].__data__["_id"][source],
                    operator: "equal",
                    logic: currentLogic
                });

                setGlobalQuery(query, 1);
            });;

    }

}

Bar.prototype.refreshMicroViz = function () {

    var _self = this;

    var div = _self.parentId;

    div = div.replace("div", "");

    var y = parseInt(div[0]);

    var x = parseInt(div[1]);

    var direction = "left";
    var axisDirection = "right";

    _self.horizonWidth = _self.width + _self.margin.left + _self.margin.right;
    _self.horizonHeight = _self.actualheight + _self.margin.top + _self.margin.bottom;

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

    if (d3.select("#micro" + _self.parentId).empty() || _self.svg.select("rect").empty()) {

        $("#" + _self.parentId).empty();

        console.log("horizon" + _self.horizonHeight);

        var barSize = 45;

        var size = _self.majorDimension / barSize;

        var data = _self.targetData.slice(0, Math.ceil(size / 2));

        var data2 = _self.targetData.slice(
            _self.targetData.length - 1 - Math.ceil(size / 2),
            _self.targetData.length - 1);

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

        _self.opacityScale1 = d3.scale.linear()
            .range([0.4, 1]);

        _self.opacityScale1.domain([0, d3.max(data, function (d) {
            return d[_self.target];
        })]);

        _self.opacityScale2 = d3.scale.linear()
            .range([1, 0.4]);

        _self.opacityScale2.domain([0, d3.max(data2, function (d) {
            return d[_self.target];
        })]);

        var bar1 = _self.svg.selectAll(".high")
            .data(data).enter()
            .append("rect")
            .attr("class", "high")
            .attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 0;

                if (direction == "top" || direction == "bottom")
                    return i * barSize;

            })
            .attr("y", function (d, i) {

                if (direction == "left" || direction == "right")
                    return i * barSize;

                if (direction == "top" || direction == "bottom")
                    return 0;

            })
            .attr("height", function (d) {
                if (direction == "left" || direction == "right")
                    return barSize - 2;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension;

            })
            .attr("width", function (d) {
                if (direction == "left" || direction == "right")
                    return _self.minorDimension;

                if (direction == "top" || direction == "bottom")
                    return barSize - 2;
            })
            .attr("fill", "#9ecae1")
            .attr("fill-opacity", function (d) {
                return _self.opacityScale1(d[_self.target]);
            });

        var text1 = _self.svg.selectAll(".texthigh")
            .data(data).enter()
            .append("text")
            .attr("class", "texthigh")
            .attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 5;

                if (direction == "top" || direction == "bottom")
                    return i * barSize;

            })
            .attr("y", function (d, i) {
                if (direction == "left" || direction == "right")
                    return i * barSize - 5;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension - 5;
            })
            .style("width", barSize - 2)
            .attr("fill", "#222")
            .attr("font-size", "9px")
            .text(function (d) {
                return d["_id"][source].substr(0, 8);
            });

        var bar2 = _self.svg.selectAll(".low")
            .data(data2).enter()
            .append("rect")
            .attr("class", "low")
            .attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 0;

                if (direction == "top" || direction == "bottom")
                    return data.length * barSize + i * barSize;

            })
            .attr("y", function (d, i) {

                if (direction == "left" || direction == "right")
                    return data.length * barSize + i * barSize;

                if (direction == "top" || direction == "bottom")
                    return 0;

            })
            .attr("height", function (d) {
                if (direction == "left" || direction == "right")
                    return barSize - 2;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension;

            })
            .attr("width", function (d) {
                if (direction == "left" || direction == "right")
                    return _self.minorDimension;

                if (direction == "top" || direction == "bottom")
                    return barSize - 2;
            })
            .attr("fill", "#d62728")
            .attr("fill-opacity", function (d) {
                return _self.opacityScale2(d[_self.target]);
            });

        var text2 = _self.svg.selectAll(".textlow")
            .data(data2).enter()
            .append("text")
            .attr("class", "textlow")
            .attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 5;

                if (direction == "top" || direction == "bottom")
                    return data.length * barSize + i * barSize;

            })
            .attr("y", function (d, i) {
                if (direction == "left" || direction == "right")
                    return data.length * barSize + i * barSize - 5;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension - 5;
            })
            .style("width", barSize - 2)
            .attr("fill", "#222")
            .attr("font-size", "9px")
            .text(function (d) {
                return d["_id"][source].substr(0, 8).trim();
            });


        _self.svg.append("text")
            .attr("transform", "translate(" + 5 + "," + 10 + ")")
            .text(_self.text)
            .style("font-size", "11px");

    } else {

        _self.svg
            .attr("width", _self.horizonWidth)
            .attr("height", _self.horizonHeight)

        var barSize = 45;

        var size = _self.majorDimension / barSize;

        var data = _self.targetData.slice(0, Math.ceil(size / 2));

        var data2 = _self.targetData.slice(
            _self.targetData.length - 1 - Math.ceil(size / 2),
            _self.targetData.length - 1);

        _self.opacityScale1 = d3.scale.linear()
            .range([0.2, 1]);

        _self.opacityScale1.domain([0, d3.max(data, function (d) {
            return d[_self.target];
        })]);

        _self.opacityScale2 = d3.scale.linear()
            .range([1, 0.2]);

        _self.opacityScale2.domain([0, d3.max(data2, function (d) {
            return d[_self.target];
        })]);

        var bar1 = _self.svg.selectAll(".high")
            .data(data);

        bar1.exit().remove().transition().duration(500);

        bar1.enter()
            .append("rect")
            .transition().duration(500)
            .attr("class", "high")
            .attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 0;

                if (direction == "top" || direction == "bottom")
                    return i * barSize;

            })
            .attr("y", function (d, i) {

                if (direction == "left" || direction == "right")
                    return i * barSize;

                if (direction == "top" || direction == "bottom")
                    return 0;

            })
            .attr("height", function (d) {
                if (direction == "left" || direction == "right")
                    return barSize - 2;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension;

            })
            .attr("width", function (d) {
                if (direction == "left" || direction == "right")
                    return _self.minorDimension;

                if (direction == "top" || direction == "bottom")
                    return barSize - 2;
            })
            .attr("fill", "#9ecae1")
            .attr("fill-opacity", function (d) {
                return _self.opacityScale1(d[_self.target]);
            });

        bar1.attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 0;

                if (direction == "top" || direction == "bottom")
                    return i * barSize;

            })
            .attr("y", function (d, i) {

                if (direction == "left" || direction == "right")
                    return i * barSize;

                if (direction == "top" || direction == "bottom")
                    return 0;

            })
            .attr("height", function (d) {
                if (direction == "left" || direction == "right")
                    return barSize - 2;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension;

            })
            .attr("width", function (d) {
                if (direction == "left" || direction == "right")
                    return _self.minorDimension;

                if (direction == "top" || direction == "bottom")
                    return barSize - 2;
            })
            .attr("fill", "#9ecae1")
            .attr("fill-opacity", function (d) {
                return _self.opacityScale1(d[_self.target]);
            });

        var text1 = _self.svg.selectAll(".texthigh")
            .data(data);

        text1.exit().remove().transition().duration(500);

        text1.enter()
            .append("text")
            .transition().duration(500)
            .attr("class", "texthigh")
            .attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 5;

                if (direction == "top" || direction == "bottom")
                    return i * barSize;

            })
            .attr("y", function (d, i) {
                if (direction == "left" || direction == "right")
                    return i * barSize - 5;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension - 5;
            })
            .style("width", barSize - 2)
            .attr("fill", "#222")
            .attr("font-size", "9px")
            .text(function (d) {
                return d["_id"][source].substr(0, 8);
            });

        text1.attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 5;

                if (direction == "top" || direction == "bottom")
                    return i * barSize;

            })
            .attr("y", function (d, i) {
                if (direction == "left" || direction == "right")
                    return i * barSize - 5;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension - 5;
            })
            .style("width", barSize - 2)
            .attr("fill", "#222")
            .attr("font-size", "9px")
            .text(function (d) {
                return d["_id"][source].substr(0, 8);
            });

        var bar2 = _self.svg.selectAll(".low")
            .data(data2);

        bar2.exit().remove().transition().duration(500);

        bar2.enter()
            .append("rect")
            .transition().duration(500)
            .attr("class", "low")
            .attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 0;

                if (direction == "top" || direction == "bottom")
                    return data.length * barSize + i * barSize;

            })
            .attr("y", function (d, i) {

                if (direction == "left" || direction == "right")
                    return data.length * barSize + i * barSize;

                if (direction == "top" || direction == "bottom")
                    return 0;

            })
            .attr("height", function (d) {
                if (direction == "left" || direction == "right")
                    return barSize - 2;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension;

            })
            .attr("width", function (d) {
                if (direction == "left" || direction == "right")
                    return _self.minorDimension;

                if (direction == "top" || direction == "bottom")
                    return barSize - 2;
            })
            .attr("fill", "#d62728")
            .attr("fill-opacity", function (d) {
                return _self.opacityScale2(d[_self.target]);
            });

        bar2.attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 0;

                if (direction == "top" || direction == "bottom")
                    return data.length * barSize + i * barSize;

            })
            .attr("y", function (d, i) {

                if (direction == "left" || direction == "right")
                    return data.length * barSize + i * barSize;

                if (direction == "top" || direction == "bottom")
                    return 0;

            })
            .attr("height", function (d) {
                if (direction == "left" || direction == "right")
                    return barSize - 2;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension;

            })
            .attr("width", function (d) {
                if (direction == "left" || direction == "right")
                    return _self.minorDimension;

                if (direction == "top" || direction == "bottom")
                    return barSize - 2;
            })
            .attr("fill", "#d62728")
            .attr("fill-opacity", function (d) {
                return _self.opacityScale2(d[_self.target]);
            });

        var text2 = _self.svg.selectAll(".textlow")
            .data(data2);

        text2.exit().remove().transition().duration(500);

        text2.enter()
            .append("text")
            .transition().duration(500)
            .attr("class", "textlow")
            .attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 5;

                if (direction == "top" || direction == "bottom")
                    return data.length * barSize + i * barSize;

            })
            .attr("y", function (d, i) {
                if (direction == "left" || direction == "right")
                    return data.length * barSize + i * barSize - 5;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension - 5;
            })
            .style("width", barSize - 2)
            .attr("fill", "#222")
            .attr("font-size", "9px")
            .text(function (d) {
                return d["_id"][source].substr(0, 8);
            });

        text2.attr("x", function (d, i) {
                if (direction == "left" || direction == "right")
                    return 5;

                if (direction == "top" || direction == "bottom")
                    return data.length * barSize + i * barSize;

            })
            .attr("y", function (d, i) {
                if (direction == "left" || direction == "right")
                    return data.length * barSize + i * barSize - 5;

                if (direction == "top" || direction == "bottom")
                    return _self.minorDimension - 5;
            })
            .style("width", barSize - 2)
            .attr("fill", "#222")
            .attr("font-size", "9px")
            .text(function (d) {
                return d["_id"][source].substr(0, 8).trim();
            });

    }
}

Bar.prototype.refreshThumbnail = function () {

    var _self = this;

    if (d3.select("#thumbnail" + _self.target).empty() || _self.svg.select("rect").empty()) {

        _self.height = 10000;

        $("#" + _self.parentId).empty();

        _self.thumbnailscale = THUMBNAIL_SCALE;

        d3.select("#" + _self.parentId).append("text")
            .text(_self.text)
            .style("font-size", 10 * _self.thumbnailscale + "px");

        _self.svg = d3.select("#" + _self.parentId).append("div")
            .style("overflow", "scroll")
            .style("width", _self.width + _self.margin.left + _self.margin.right)
            .style("height", _self.actualheight + _self.margin.top + _self.margin.bottom - 10 * _self.thumbnailscale)
            .append("svg")
            .attr("id", _self.target + "bar")
            .attr("class", "thumbnail" + _self.target)
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

            })
            .append("g")
            .attr("transform", "translate(" + (_self.thumbnailscale * _self.margin.left) + "," +
                _self.thumbnailscale * _self.margin.top + ")")
            .style("pointer-events", "none")
            .style("font-size", 10 * _self.thumbnailscale + "px");


        _self.x = d3.scale.linear()
            .domain([0, d3.max(_self.targetData, function (d) {
                return Math.pow(d[_self.target], 1);
            })])
            .range([0, _self.width]);

        _self.y = d3.scale.ordinal()
            .domain(_self.targetData.map(function (d) {
                return d["_id"][source];
            }))
            .rangeBands([0, _self.height]);

        //_self.barH = _self.height / _self.targetData.length;
        _self.barH = 20 * _self.thumbnailscale;

        _self.bars = _self.svg.selectAll("g")
            .data(_self.targetData)
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + _self.margin.left + "," + i * _self.barH + ")";
            });

        _self.bars.append("rect")
            .attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
            })
            .attr("height", _self.barH - 5 * _self.thumbnailscale)
            .attr("fill", "#9ecae1");

        _self.bars.append("text")
            .attr("x", function (d) {
                return 5 * _self.thumbnailscale;
            })
            .attr("y", _self.barH / 3)
            .attr("fill", "#222")
            .attr("text-anchor", "start")
            .attr("dy", ".35em")
            .text(function (d) {
                return Math.round(d[_self.target]);
            });

        _self.svg.selectAll("text.name")
            .data(_self.targetData)
            .enter().append("text")
            .attr("x", _self.margin.left - 5 * _self.thumbnailscale)
            .attr("y", function (d, i) {
                return i * _self.barH + _self.barH / 2;
            })
            .attr("fill", "#222")
            .attr("text-anchor", "end")
            .attr('class', 'name')
            .text(function (d) {
                return d["_id"][source];
            });


    } else {

        var allBars = _self.svg.selectAll("g").data(_self.targetData);

        allBars.exit().remove();

        _self.x = d3.scale.linear()
            .domain([0, d3.max(_self.targetData, function (d) {
                return Math.pow(d[_self.target], 1);
            })])
            .range([0, _self.width]);

        var rects = allBars.enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + _self.margin.left + "," + i * _self.barH + ")";
            });

        rects.append("rect")
            .attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
            })
            .attr("height", _self.barH - 5 * _self.thumbnailscale)
            .attr("fill", "#9ecae1");

        rects.append("text")
            .attr("x", function (d) {
                return 5 * _self.thumbnailscale;
            })
            .attr("y", _self.barH / 3)
            .attr("fill", "#222")
            .attr("text-anchor", "start")
            .attr("dy", ".35em")
            .text(function (d) {
                return Math.round(d[_self.target]);
            });

        allBars.select("rect").attr("width", function (d) {
                return _self.x(Math.pow(d[_self.target], 1));
            })
            .attr("height", _self.barH - 5 * _self.thumbnailscale)
            .attr("fill", "#9ecae1");

        allBars.select("text")
            .attr("x", function (d) {
                return 5 * _self.thumbnailscale;
            })
            .attr("y", _self.barH / 3)
            .attr("fill", "#222")
            .attr("text-anchor", "start")
            .attr("dy", ".35em")
            .text(function (d) {
                return Math.round(d[_self.target]);
            });

        _self.y = d3.scale.ordinal()
            .domain(_self.targetData.map(function (d) {
                return d["_id"][source];
            }))
            .rangeBands([0, _self.height]);

        var allText = _self.svg.selectAll("text.name").data(_self.targetData);

        allText.exit().remove();

        allText.enter().append("text")
            .attr("x", _self.margin.left - 5 * _self.thumbnailscale)
            .attr("y", function (d, i) {
                return i * _self.barH + _self.barH / 2;
            })
            .attr("fill", "#222")
            .attr("text-anchor", "end")
            .text(function (d) {
                return d["_id"][source];
            });

        allText.attr("x", _self.margin.left - 5 * _self.thumbnailscale)
            .attr("y", function (d, i) {
                return i * _self.barH + _self.barH / 2;
            })
            .attr("fill", "#222")
            .attr("text-anchor", "end")
            .attr('class', 'name')
            .text(function (d) {
                return d["_id"][source];
            });

    }

}

Bar.prototype.reDrawChart = function (flag, width, height) {

    var _self = this;

    _self.width = width - _self.margin.left - _self.margin.right;

    _self.actualheight = height - _self.margin.top - _self.margin.bottom;



    if (flag) {

        _self.svg = null;

        $("#" + _self.parentId).empty();

        _self.refreshChart();

    } else {


        device == 1 ? _self.refreshMicroViz() : _self.refreshThumbnail();

    }


}

Bar.prototype.postUpdate = function () {

    var _self = this;

    $.ajax({

        type: "GET",
        url: "/" + _self.link,
        data: {
            data: queryStack
        }

    }).done(function (data) {

        console.log(data+"\n");
        
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