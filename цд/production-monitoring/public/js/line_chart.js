var labelsx = [], labelsy = [];

function lineChart ($elem, opts, inputHour, inputHourSecond, hourForCond) {

    // console.log(opts);
    console.log('lineChart funciton');
    var ratio = opts.ratio ? opts.ratio : 4;

    var viewBox = {
        left: 160 / ratio,
        top: 100 / ratio,
        right: 220 / ratio,
        bottom: 80 / ratio
    };

    opts  = jQuery.extend({
        interpolate : 'monotone',
        labelValues : [],
        types : [],
        dashedLines : [],
    }, opts);

    if (typeof(opts.labels) == 'undefined') {
        opts.labels = [];
        opts.values.filter(function () {
            opts.labels.push(1);
        });
    }

    opts.round = typeof(opts.round) == 'undefined' ? 0 : opts.round;

    var dates = opts.scaleH.slice(0);
    var filter = opts.scaleH.length <= 31 ? 1 : parseInt(opts.scaleH.length / 30);

    var width = $elem.width() - viewBox.left - viewBox.right;
    var height = $elem.height() - viewBox.top - viewBox.bottom;

    function normalCords (opts) {
        var scaleH = [];
        var values = [];
        var labelValues = [];
        var divisions = opts.scaleH.length;
        var labelWidth = 140 / ratio;
        var divisionWidth = width / divisions;
        var labelDivisions = labelWidth / divisionWidth;
        var labels = Math.floor(width / labelWidth);

        var years = getYears(opts.scaleH);
        var months = getMonths(opts.scaleH);

        if (years.length > 1) { // by Years and Months
            var minYear = d3.min(years);
            var maxYear = d3.max(years);
            var yearDivisions = Math.round(divisions / ((maxYear - minYear) + 1));//Math.round(divisions / 10);

            for (var year = minYear; year <= maxYear; year++) {
                var range = findByYear(year, opts.scaleH);
                var dates = opts.scaleH.slice(range[0], range[1]);

                yearDivisions = dates.length;
                if (year === maxYear) {
                    yearDivisions = divisions;
                }

                if (yearDivisions < 1) {
                    break;
                }

                dates = getDates(dates, yearDivisions);

                var lastLabelIndex = 0;
                var fn = (function (m) {
                    m = 1;
                    return function (d, i) {
                        var label = (i == 0) ? d.date.getFullYear() : '';
                        if (i > 0 && m != d.date.getMonth()) {
                            label = getShortMonthName(d.date.getMonth());
                            m = d.date.getMonth();

                            var w = (i - lastLabelIndex) * divisionWidth;
                            if (w < labelWidth) {
                                label = '';
                            }
                        }
                        if (label.length > 0) {
                            lastLabelIndex = i;
                        }
                        //if (i > dates.length / labels && year === maxYear) {
                        //    if (m != d.date.getMonth()) {
                        //        m = d.date.getMonth();
                        //        label = getShortMonthName(m);
                        //    }
                        //}
                        scaleH.push({
                            date : d.date,
                            index : d.index + range[0],
                            label : label
                        });
                    }
                })(0);
                dates.filter(fn);
                divisions -= yearDivisions;
            }
        }
        else if (Object.size(months) > 3) { // by Months and Days
            var index = 0;
            var maxIndex = Object.size(months);
            var monthDivisions = Math.round(divisions / maxIndex);
            var monthLabels = (labels / maxIndex) - 2;

            jQuery.each(months, function (key, m) {
                index++;

                var range = findByMonth(m.year, m.month, opts.scaleH);
                var dates = opts.scaleH.slice(range[0], range[1]);
                monthDivisions = dates.length;
                var monthWidth = monthDivisions * divisionWidth;
                monthLabels = (monthWidth / labelWidth);

                //if (index === maxIndex)
                //    monthDivisions = divisions;

                dates = getDates(dates, monthDivisions);

                var fn = (function (m) {
                    return function (d, i) {
                        var label = (i == 0) ? getShortMonthName(d.date.getMonth()) : '';
                        //if (labelDivisions > monthDivisions && index % 2 == 0 && index != maxIndex) {
                        //    label = '';
                        //}

                        //if (i % Math.ceil(filter) == 0 && i > 0) {
                        //    label = d.date.getDate();
                        //}

                        scaleH.push({
                            date : d.date,
                            index : d.index + range[0],
                            label : label,
                            bold : label != ''
                        });
                    }
                })(-1);
                var startIx = scaleH.length;

                dates.filter(fn);

                var startDivisions = Math.floor(monthDivisions / (monthLabels)) / 2;
                var daysDivisions = dates.length - (startDivisions * 2);
                var filter = dates.length > monthLabels ? Math.floor(daysDivisions / monthLabels) : 1;
                filter = Math.max(1, filter);
                startIx += Math.ceil(startDivisions);
                var endIx = startIx + daysDivisions;

                if (dates.length > 1) {
                    for (i = startIx; i < endIx; i += filter) {
                        var ix = Math.ceil(i);
                        if (scaleH[ix].label != '') continue;
                        scaleH[ix].label = scaleH[ix].date.getDate();
                    }
                }

                divisions -= monthDivisions;
            });

            ix = scaleH.length - 1;
            if (scaleH[ix].label == '') {
                scaleH[ix].label = scaleH[ix].date.getDate();
            }
            //if (m != scaleH[ix].date.getMonth()) {
            //    m = scaleH[ix].date.getMonth();
            //    scaleH[ix].label += '.'+getShortMonthName(m);
            //}
        }
        else { // by Days
            dates = getDates(opts.scaleH, divisions);
            var fn = function (d, i) {
                scaleH.push({
                    date : d.date,
                    index : d.index,
                    label : ''
                });
            };
            dates.filter(fn);

            filter = dates.length > labels ? Math.floor(dates.length / labels) : 1;

            /*
            m = -1;
            for (i = 0; i < dates.length; i += filter) {
                var ix = parseInt(i);
                scaleH[ix].label = scaleH[ix].date.getDate();
                if (m != scaleH[ix].date.getMonth()) {
                    m = scaleH[ix].date.getMonth();
                    scaleH[ix].label += '.'+getShortMonthName(m);
                }
            }
            ix = dates.length - 1;
            scaleH[ix].label = scaleH[ix].date.getDate();
            if (m != scaleH[ix].date.getMonth()) {
                m = scaleH[ix].date.getMonth();
                scaleH[ix].label += '.'+getShortMonthName(m);
            }
            */
            for (i = 0; i < dates.length; i += filter) {
                var ix = parseInt(i);
                // scaleH[ix].label = (i%2==0)?(i<5)?'0'+(i * 2):(i * 2):'';
                var hour = (ix * 2) + inputHour;
                hour = hour >= 24 ? hour - 24 : hour;
                hour = hour < 10 ? '0'+hour : hour;
                if (ix > 0 && hour == hourForCond) {
                    hour = inputHourSecond;
                }
                scaleH[ix].label = hour;
            }
        }

        for (var i = 0; i < opts.values.length; i++) {
            var vals = opts.values[i];
            var labelVals = $.type(opts.labelValues[i]) != 'undefined' ? opts.labelValues[i] : [];
            values[i] = [];
            labelValues[i] = [];
            for (var j = 0; j < scaleH.length; j++) {
                if (typeof(vals[scaleH[j].index]) == 'undefined') continue;
                var val = vals[scaleH[j].index];
                values[i].push(val);
                if ($.type(labelVals[scaleH[j].index]) != 'undefined') {
                    labelValues[i].push(labelVals[scaleH[j].index]);
                }
            }
        }


        return jQuery.extend(opts, {
            values : values,
            labelValues : labelValues,
            scaleH : scaleH
        });

        function getDates (dates, count) {
            var ret = [];
            var indexes = [];
            var filter = dates.length / count;

            for (var i = 0; i < dates.length; i += filter) {
                var index = parseInt(i);
                //if (jQuery.inArray(index, indexes) >= 0) continue;
                indexes.push(index);
                ret.push({
                    time : dates[index],
                    date : new Date(dates[index] * 1000),
                    index : index

                });
            }

            if (ret.length > count)
                ret = ret.slice(0, count);
            ret.pop();

            index = dates.length - 1;
            ret.push({
                time : dates[index],
                date : new Date(dates[index] * 1000),
                index : index
            });

            return ret;
        }

        function getYears (dates) {
            var years = [];
            dates.filter(function (d) {
                var year = new Date(d * 1000).getFullYear();
                if (jQuery.inArray(year, years) < 0)
                    years.push(year);
                return false;
            });

            return years;
        }

        function getMonths (dates) {
            var months = {};
            dates.filter(function (d) {
                var date = new Date(d * 1000);
                var month = date.getMonth();
                var year = date.getFullYear();

                if (typeof(months[year+' '+month]) == 'undefined')
                    months[year+' '+month] = {month : month, year: year};

                return false;
            });
            return months;
        }

        function findByYear (year, dates) {
            var start = -1;
            var end = -1;

            dates.filter(function (d, i) {
                var date = new Date(d * 1000);
                if (year == date.getFullYear() && start === -1)
                    start = i;
                else if (start >= 0 && end === -1 && date.getFullYear() > year)
                    end = i;
                return false;
            });

            if (start >= 0 && end === -1)  {
                end = dates.length;
            }

            return [start, end];
        }

        function findByMonth (year, month, dates) {
            var start = -1;
            var end = -1;

            dates.filter(function (d, i) {
                var date = new Date(d * 1000);
                if (year == date.getFullYear() && month == date.getMonth() && start === -1)
                    start = i;
                else if (start >= 0 && end === -1 && date.getMonth() != month)
                    end = i;
                return false;
            });

            if (start >= 0 && end === -1)  {
                end = dates.length;
            }

            return [start, end];
        }
    }
    opts = normalCords(opts);

    opts.colors.push('#369');

    var elem = d3.select($elem[0]);
    if ($elem.find('svg').length < 1)
        $elem.append('<svg/>');
    var svg = elem.selectAll('svg');
    svg.attr('width', width + viewBox.left + viewBox.right);
    svg.attr('height', height + viewBox.top + viewBox.bottom);
    svg.attr('class', 'svg-line-chart');
    svg.append('svg:defs')
        .append('svg:g')
        .attr('id', 'graph-label')
        .append('svg:path')
        .attr('d', 'M798 0l-179 0c-280,0 -619,575 -619,671 0,96 339,671 619,671l192 0c60,0 43,-245 43,-324l0 -610c0,-79 3,-408 -56,-408z');

    //svg.select('defs')
    //.selectAll('.gradient')
    //.data(opts.fills)
    //.enter()
    //.append('svg:linearGradient')
    //.attr({
    //id : function (d, i) { return 'fill-'+i; },
    //x1 : 0,
    //y1 : 0,
    //x2 : 0,
    //y2 : 1
    //})
    //.append('svg:stop')
    //.attr({
    //offset : '0%',
    //'stop-color' : String,
    //'stop-opacity' : 1,
    //})
    //.select(function () { return this.parentNode })
    //.append('svg:stop')
    //.attr({
    //offset : '100%',
    //'stop-color' : 'rgba(0, 0, 0, 0)',
    //'stop-opacity' : 0,
    //})
    //.select(function () { return this.parentNode.parentNode })
    //.append('svg:pattern'

    var maxVal = 0, minVal = 99999999999999999;
    for (i = 0; i < opts.values.length; i++) {
        var m = d3.max(opts.values[i]);
        if ( ! isNaN(m)) {
            maxVal = Math.max(maxVal, m);
        }

        m = d3.min(opts.values[i], function (d) {
            return d === false ? 99999999999999999 : d;
        });
        if (isNaN(m)) continue;
        minVal = Math.min(minVal, m);
    }
    maxVal = Math.max(1, maxVal);
    //minVal = Math.max(0, minVal);
    if (minVal > maxVal)
        minVal = 0;

    var stepV = (maxVal - minVal) / opts.scaleV;
    stepV /= 2;
    maxVal += Math.round(stepV);
    minVal -= Math.round(stepV);

    var yRange = d3.scale.linear()
        .range([height + viewBox.top, viewBox.top])
        .domain([minVal, maxVal]);

    var xRange = d3.scale.linear()
        .range([viewBox.left, width + viewBox.left - 1])
        .domain([0, opts.scaleH.length - 1]);

    var xScaleRange = d3.scale.linear()
        .range([viewBox.left, width + viewBox.left - 1])
        .domain([0, opts.scaleH.length - 1]);

    svg.selectAll('line.verticalGrid').data(opts.scaleH).enter()
        .append('line')
        .attr({
            'class' : 'verticalGrid',
            'x1' : function (d, i) { return Math.round(xScaleRange(i)) + 0.5; },
            'y1' : viewBox.top,
            'x2' : function (d, i) { return Math.round(xScaleRange(i)) + 0.5; },
            'y2' : viewBox.top + height,
            'fill' : 'none',
            'stroke' : '#3f3f46',
            'stroke-width' : 1 / ratio,
            'display' : function (d, i) {
                return 'block';//'(d.label != '' || i == opts.scaleH.length - 1) ? 'block' : 'none';
                //return (i % filter == 0 || i == opts.scaleH.length - 1) ? 'block' : 'none';
            }
        });

    svg.selectAll('line.horizontalGrid').data(yRange.ticks(opts.scaleV)).enter()
        .append('line')
        .attr({
            'class' : 'horizontalGrid',
            'x1' : viewBox.left - 32 / ratio,
            'y1' : function (d, i) { return Math.round(yRange(d)) + 0.5; },
            'x2' : viewBox.left + width,
            'y2' : function (d, i) { return Math.round(yRange(d)) + 0.5; },
            'fill' : 'none',
            'stroke' : '#3f3f46',
            'stroke-width' : 1 / ratio
        });

    svg
        .append('line')
        .attr({
            'class' : 'horizontalGrid',
            'x1' : viewBox.left - 32 / ratio,
            'y1' : viewBox.top + 0.5,
            'x2' : viewBox.left + width,
            'y2' : viewBox.top + 0.5,
            'fill' : 'none',
            'stroke' : '#3f3f46',
            'stroke-width' : 1 / ratio
        });

    var yAxis = d3.svg.axis()
        .scale(yRange)
        .orient('left')
        .ticks(opts.scaleV)
        .tickFormat(function (d) {
            if (maxVal > 1000)
                return (d / 1000) + 'k';

            return d;
        });
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate("+(viewBox.left - (30 / ratio))+", 0)")
        .call(yAxis);

    var tickValues = [];
    for (var i = 0; i < opts.scaleH.length; i++) {
        tickValues.push(i);
    }
    var xAxis = d3.svg.axis()
        .scale(xScaleRange)
        .ticks(opts.scaleH.length)
        .tickValues(tickValues)
        .tickFormat(function (d) {
            return opts.scaleH[d].label;
        });

    svg.append('svg:g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, '+(viewBox.top + height)+')')
        //.call(xAxis);
        .append('svg:line')
        .attr({
            x1 : xScaleRange(0),
            y1 : 0.5,
            x2 : xScaleRange(opts.scaleH.length - 1),
            y2 : 0.5,
            stroke : '#FFF',
            'stroke-width' : 4 / ratio
        })
        .select(function () { return this.parentNode; })
        .append('svg:text')
        .attr({
            x : xScaleRange(opts.scaleH.length - 1) + (40 / ratio),
            y : 0,
            'class' : 'label',
            'dy' : '0.60em'
        })
        .text(opts.labelH)
        .select(function () { return this.parentNode; })
        .selectAll('.tick')
        .data(opts.scaleH)
        .enter()
        .append('svg:g')
        .attr('class', 'tick')
        .attr('transform', function (d, i) {
            return 'translate('+xScaleRange(i)+', 0)';
        })
        .append('text')
        .attr({
            'y' : 30 / ratio,
            'text-anchor' : 'middle',
            'dy' : '1em',
            'font-weight' : function (l) {
                return l.bold ? 'bold' : 'normal';
            }
        })
        .text(function (d, i) {
            return d.label;
        })
        .select(function () {
            return this.parentNode;
        })
        .append('svg:line')
        .attr({
            x1 : 0,
            y1 : 0,
            x2 : 0,
            y2 : function (d, i) {
                var h = d.label == '' ? 12 : 24;
                return h / ratio;
            }
        });

    var lineFunc = d3.svg.line()
        .x(function(d, i) {
            return xRange(i);
        })
        .y(function(d, i) {
            return yRange(d);
        })
        .interpolate(opts.interpolate);

    var labels = [];

    svg
        .on('mouseout', function () {
            for (var i = 0; i < labelsx.length; i++) $('#leg'+(i+1)).hide();
            svg.select('.tooltipChart')
                .attr('display', 'none');
        })
        .on('mousemove', function (d, i, j, e) {
            // console.log('move');
            var cords = d3.mouse(this);
            var points = getPoints(cords[0]);
            if (points !== false) {

                for (var i = 0; i < labelsx.length; i++)
                    if (cords[0]>=labelsx[i] && cords[0]<labelsx[i]+105 && cords[1]>=labelsy[i] && cords[1]<labelsy[i]+37) {
                        $('#leg'+(i+1)).css('top', labelsy[i]+80);
                        $('#leg'+(i+1)).show();
                    }


                var now = opts.scaleH[points[0].x].date;
                points.push({
                    val : d3.time.format('%d.%m.%Y')(now),
                    x : 0
                });
                // console.log(ratio);
                // console.log(20 / ratio);
                var ePoints = svg.select('.tooltipChart')
                    .attr({
                        display : 'block',
                        transform: 'translate('+xRange(points[0].x)+', '+(70 / ratio)+')'
                    })
                    .select('.labels')
                    .selectAll('g')
                    .data(points);

                ePoints
                    .select('text')
                    .text(function (d) {
                        return d.val;
                    });

                ePoints
                    .enter()
                    .append('svg:g')
                    .append('svg:rect')
                    .attr({
                        x : 0,
                        y : 0
                    })
                    .select(function () {
                        return this.parentNode;
                    })
                    .append('svg:text')
                    .attr({
                        fill : '#000',
                        y : 30 / ratio,
                        'dy' : '0.40em'
                    })
                    .text(function (d) {
                        return d.val;
                    });

                var x = 0;
                ePoints.each(function (p, i) {
                    if (i > 0) {
                        var prev = d3.select(ePoints[0][i - 1]);
                        var txt = prev.select('text')[0][0];
                        var box = txt.getBBox();
                        x += box.width;
                        if (box.width > 0)
                            x += (40 / ratio);
                    }

                    var elem = d3.select(this);
// console.log(p);
                    if (p.val == undefined) {
                        // elem
                        //     .attr('display', 'none');
                        // return;
                    }
                    elem
                        .attr('display', 'block');

                    var box = elem.select('text')[0][0].getBBox();

                    elem
                        .select('rect')
                        .attr({
                            x : - 8 / ratio,
                            y : 0,
                            width : box.width + 16 / ratio,
                            height : 60 / ratio,
                            fill : opts.colors[i],
                            rx : 12 / ratio,
                            ry : 12 / ratio
                        });
                    this.setAttribute('transform', 'translate('+x+', 0)');
                });

                var labels = svg.select('.tooltipChart .labels');
                var w = labels[0][0].getBBox().width;
                var x = - w / 2;
                var tooltipChartX = xRange(points[0].x);
                if (tooltipChartX + x < viewBox.left) {
                    x = - (tooltipChartX - viewBox.left);
                }
                if (tooltipChartX + x + w > xRange(opts.scaleH.length - 1)) {
                    x = - w + (viewBox.left + width - tooltipChartX);
                }
                labels.attr('transform', 'translate('+x+', 0)');
            }
        });

    function normalTypes () {
        $.each(opts.values, function (i, values) {
            if ($.type(opts.types[i]) == 'undefined') {
                opts.types[i] = {solid : [0, values.length]};
                return true;
            }

            if ($.type(opts.types[i]) == 'string') {
                var type = {};
                type[opts.types[i]] = [0, values.length];
                opts.types[i] = type;
                return true;
            }
        });
    }

    normalTypes();

    for (i = 0; i < opts.values.length; i++) {
        var type = opts.types[i];

        if (opts.values[i].length < 1) continue;

        $.each(type, function (type, range) {

            var lineFunc = d3.svg.line()
                .x(function(d, i) {
                    var val = $.type(d) == 'object' ? d.index : i;
                    return xRange(val + range[0]);
                })
                .y(function(d, i) {
                    var val = $.type(d) == 'object' ? d.val : d;
                    return yRange(val);
                })
                .interpolate(opts.interpolate);

            var values = opts.values[i].slice(range[0], range[1]);
            var scaleH = opts.scaleH.slice(range[0], range[1]);

            var lines = svg
                .append('g')
                .attr('class', 'chart-group chart-group-'+(i+1));

            if (values.length < 1) return true;

            if (type == 'polygon') {
                lines
                    .selectAll('.chart-line')
                    .data(values)
                    .enter()
                    .append('svg:polygon')
                    .attr('fill', function (d, j) {
                        var color = opts.fills[i];
                        if (j < 1 || typeof(opts.warnings) == 'undefined') return color;
                        var date = opts.scaleH[j].date.getTime();
                        for (var prevIndex = j - 1; prevIndex >= 0; prevIndex--) {
                            if (opts.scaleH[prevIndex].date.getTime() != date)
                                break;
                        }
                        var prev = values[prevIndex];
                        if (d == prev && date != opts.scaleH[prevIndex].date.getTime()) {
                            color = opts.warnings[i];
                        }
                        return color;
                    })
                    .attr('fill-opacity', 0.3)
                    .attr('points', function (d, j) {
                        if (j < 1) return null;
                        var prev = values[j-1]
                        var x1 = xRange(j-1);
                        var x2 = xRange(j);
                        var y1 = yRange(prev);
                        var y2 = yRange(d);
                        var y3 = height + viewBox.top;
                        return x1+','+y1+' '+x1+','+y3+' '+x2+','+y3+' '+x2+','+y2;
                    });

                lines
                    .append('svg:path')
                    .attr({
                        'stroke' : opts.colors[i],
                        'fill' : 'none',
                        'stroke-width' : 6 / ratio,
                        'd' : lineFunc(values)
                    });
            } else if (type == 'dashed') {
                lines
                    .append('svg:path')
                    .attr({
                        'stroke' : opts.colors[i],
                        'fill' : 'none',
                        'stroke-width' : 6 / ratio,
                        'stroke-dasharray' : (16 / ratio)+','+(16 / ratio),
                        'd' : lineFunc(getNormalValues(values))
                    });
            } else if (type == 'solid') {
                lines
                    .append('svg:path')
                    .attr({
                        'stroke' : opts.colors[i],
                        'fill' : 'none',
                        'stroke-width' : 6 / ratio,
                        //'stroke-dasharray' : (16 / ratio)+','+(16 / ratio),
                        'd' : lineFunc(getNormalValues(values))
                    });
            }
        });

        var last = opts.values[i].length - 1;

        if (opts.labels[i] > 0) {
            labels.push({
                x : last,
                val : opts.values[i][last],
                color : opts.colors[i],
                cls : 'chart-group-'+(i+1),
                index : i
            });
        }
    }

    function getNormalValues (values) {
        var normalVals = [];
        for (var i = 0; i < values.length; i++) {
            if (values[i] !== false) {
                normalVals.push({val : values[i], index : i});
            }
        }
        return normalVals;
    }

    labels = labels.sort(function (a, b) {
        return b.val - a.val;
    });
    drawLabels();

    function drawLabels () {

        var labelHeight = 56 / ratio;
        var labelWidth = 0;
        var maxTextLabel = svg
            .append('svg:text');

        for (var i = 0; i < labels.length; i++) {
            maxTextLabel.text(number_format(labels[i].val, opts.round));
            maxTextLabel.each(function () {
                var rect = this.getBBox();
                labelWidth = Math.max(rect.width, labelWidth);
            });
        }
        maxTextLabel.remove();
        labelWidth += 20 / ratio;
        var x1 = [];
        var x2 = [];
        var y = [];

        var prev = -100;
        var prevX = -100;
        for (i = 0; i < labels.length; i++) {
            var cx = width + viewBox.left;
            var t = yRange(labels[i].val) - labelHeight / 2;

            if (opts.labelOnPoint) {
                cx = xRange(labels[i].x);
            }
            cx += 20 / ratio;
            x1.push(xRange(labels[i].x));

            if (t <= prev + labelHeight + 16 / ratio)
                t = prev + labelHeight + 16 / ratio;
            prev = t;
            prevX = cx;
            y.push(t);
            x2.push(cx);
        }

        var last = labels.length - 1;
        if (y[last] + labelHeight > height + viewBox.top)
            y[last] = viewBox.top + height - labelHeight;

        prev = 100000;
        for (i = labels.length - 1; i >= 0; i--) {
            t = y[i];
            if (t + labelHeight + 16 >= prev)
                t = prev - labelHeight - 16 / ratio;
            prev = t;
            y[i] = t;
        }

        opts.labelsx = [];
        opts.labelsy = [];
        for (i = 0; i < labels.length; i++) {
            svg.append('svg:line')
                .attr({
                    'x1' : x2[i] - 20 / ratio,
                    'y1' : yRange(labels[i].val),
                    'x2' : x2[i],
                    'y2' : y[i] + labelHeight / 2,
                    'stroke' : labels[i].color,
                    'stroke-width' : 6 / ratio,
                    'class' : labels[i].cls
                });
            svg.append('svg:line')
                .attr({
                    'x1' : x1[i],
                    'y1' : yRange(labels[i].val),
                    'x2' : x2[i] - 20 / ratio,
                    'y2' : yRange(labels[i].val),
                    'stroke' : labels[i].color,
                    'stroke-dasharray' : (16 / ratio)+','+(16 / ratio),
                    'stroke-width' : 6 / ratio,
                    'class' : labels[i].cls
                });

            labelsx.push(x2[i]);labelsy.push(y[i]);
            var label = svg.append('svg:g')
                .attr('class', 'graph-label '+labels[i].cls)
                .attr('transform', 'translate('+x2[i]+','+y[i]+')')
                .attr('data-index', labels[i].index);

            var scale = 0.04 / ratio;
            var arrow = label
                .append('svg:use')
                .attr('xlink:href', '#graph-label')
                .attr('transform', 'scale('+scale+')')
                .attr('fill', labels[i].color);

            var arrowWidth = 0;
            arrow.each(function () {
                var rect = this.getBBox();
                arrowWidth = rect.width * scale;
            });

            label
                .append('svg:rect')
                .attr('x', arrowWidth - 10 / ratio)
                .attr('rx', 8 / ratio)
                .attr('ry', 8 / ratio)
                .attr('width', labelWidth)
                .attr('height', labelHeight - 2 / ratio)
                .attr('fill', labels[i].color);

            label
                .append('svg:text')
                .text(number_format(labels[i].val, opts.round))
                .attr({
                    'x' : arrowWidth,
                    'y' : labelHeight / 2,
                    'dy' : '0.38em'
                });
        }
    }

    function getPoints (x) {
        var range = 5;
        var values = opts.values;
        var points = [];
        var pointsX = [];

        opts.scaleH.filter(function (d, i) {
            var cx = xRange(i);
            pointsX.push({
                x: i,
                distance: Math.abs(cx - x)
            });
        });
        pointsX = pointsX.sort(function (a, b) {
            if (a.distance == b.distance) return 0;
            if (a.distance > b.distance) return 1;
            return -1;
        });

        for (i = 0; i < values.length; i++) {
            var val = typeof(values[i][pointsX[0].x]) == 'undefined' ? null : number_format(values[i][pointsX[0].x], opts.round);
            val = values[i][pointsX[0].x] === false ? null : val;
            if ($.type(opts.labelValues[i][pointsX[0].x]) != 'undefined') {
                val = opts.labelValues[i][pointsX[0].x];
            }
            points.push({
                val : val,
                x : pointsX[0].x
            });
        }

        return points;
    }

    for (i = 0; i < opts.dashedLines.length; i++) {
        var x = xRange(opts.dashedLines[i].index) + 0.5;
        svg.append('svg:line')
            .attr({
                'class' : 'dashed-line',
                x1 : x,
                y1 : yRange(minVal),
                x2 : x,
                y2 : yRange(maxVal),
                stroke : '#FFF',
                'stroke-dasharray' : (16 / ratio)+','+(16 / ratio),
                'stroke-width' : 2 / ratio
            });
    }

    svg.append('svg:g')
        .attr('class', 'tooltipChart')
        .attr('display', 'none')
        .append('svg:line')
        .attr({
            x1 : 0,
            y1 : yRange(minVal),
            x2 : 0,
            y2 : yRange(maxVal) - (20 / ratio),
            stroke : '#369',
            'stroke-width' : 8 / ratio
        })
        .select(function () {
            return this.parentNode;
        })
        .append('svg:g')
        .attr('class', 'labels');
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function getShortMonthName (month) {
    var months = [
        'Янв',
        'Фев',
        'Мрт',
        'Апр',
        'Май',
        'Июн',
        'Июл',
        'Авг',
        'Сен',
        'Окт',
        'Ноя',
        'Дек'
    ];

    return months[month];
}

function number_format(number, decimals, dec_point, thousands_sep)
{
    var i, j, kw, kd, km;

    if(isNaN(decimals = Math.abs(decimals))) {
        decimals = 0;
    }
    if(dec_point == undefined) {
        dec_point = ",";
    }
    if(thousands_sep == undefined) {
        thousands_sep = " ";
    }

    i = parseInt(number = (+number || 0).toFixed(decimals)) + "";

    if((j = i.length) > 3){ j = j%3; }
    else { j = 0; }

    km = (j ? i.substr(0, j) + thousands_sep : "");
    kw = i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep);
    kd = (decimals ? dec_point + Math.abs(number - i).toFixed(decimals).replace(/-/, 0).slice(2) : "");

    return km + kw + kd;

}
