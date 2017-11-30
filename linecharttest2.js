(function(){

var margin = {top: 30, right: 40, bottom: 30, left: 160},
    width = 850 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var parseDate = d3.timeParse("%Y"),
    bisectDate = d3.bisector(function(d) { return d.date; }).left,
    formatValue = d3.format(",.2f");


var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

var xAxis = d3.axisBottom().scale(x).ticks(15);

var yAxis = d3.axisLeft().scale(y).ticks(10);

var valueline2 = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.close ); });

var valueline3 = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.diag ); });


var svgo = d3.select("#linechart")
    .append("svg")
        .attr("width", width + margin.left + margin.right + 50)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "graph-svg-component")
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

tmp = null;
// Get the data
d3.csv("data.csv", function(error, data) {

    var flatData = [];
    data.forEach(function(d) {
        d.date = parseDate(d.date);
        d.close = +d.close;
        d.diag = +d.diag;
        flatData.push({date: d.date, value: d.close, key: "close"});
        flatData.push({date: d.date, value: d.diag, key: "diag"});
    });


    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return Math.max( d.close, d.diag ); })]) //, d.geothermal, d.biomass, d.wind, d.solar, d.other, d.direct_coal_imports, d.other_imports); })]);

//line1
    svgo.append("path")
        .attr("class", "line close")
        .attr("d", valueline2(data));
//line2
    svgo.append("path")
           .attr("class", "line diag")
           .attr("d", valueline3(data))
           .style("stroke", "#E40066");

    svgo.append("g")         // Add the X Axis
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svgo.append("g")         // Add the Y Axis
        .attr("class", "y axis")
        .call(yAxis);

    var lineGen = d3.line()
      .x(function(d) {
        return x(parseDate(d.date));
      })
      .y(function(d) {
        return y(d.close);
      });

    var focus = svgo.append("g")
      .attr("class", "focus")
      .attr("transform", "translate(-100,-100)")

    focus.append("circle")
      .attr("r", 4.5);

    focus.append("text")
      .attr("x", 3)
      .attr("dy", ".35em")
      .attr("dx", ".5em")
      .style("fill", "FA7921");

    svgo.append("text")
        .attr("transform", "translate(" + (width+3) + "," + y(data[30].diag) + ")")
        .attr("dy", "1em")
        .attr("text-anchor", "start")
        .style("fill", "#E40066")
        .text("diagnoses");

    svgo.append("text")
       .attr("transform", "translate(" + (width+3) + "," + y(data[30].close) + ")")
       .attr("dy", "2em")
       .attr("text-anchor", "start")
       .style("fill", "#03CEA4")
       .text("deaths");

    svgo.append("rect")
     .attr("class", "overlay")
     .attr("width", width)
     .attr("height", height)
     .on("mouseover", function() { focus.style("display", null); })
     .on("mouseout", function() { focus.style("display", "none"); })
     .on("mousemove", mousemove)

   function mousemove() {
     var x0 = x.invert(d3.mouse(this)[0]),
       i = bisectDate(data, x0, 1),
       d0 = data[i - 1],
       d1 = data[i],
       d = x0 - d0.date > d1.date - x0 ? d1 : d0;
     console.log((d.close));
     focus.attr("transform", "translate(" + x(d.date) + "," + y(d.close) + ")");
     focus.select("text").text(d.close);
}

});
})();
