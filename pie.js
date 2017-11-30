(function() {
// margin
var pie_margin = {top: 20, right: 20, bottom: 20, left: 20},
    pie_width = 400 - pie_margin.right - pie_margin.left,
    pie_height = 400 - pie_margin.top - pie_margin.bottom,
    pie_radius = pie_width/2;

// color range
var color = d3.scaleOrdinal()
    .range(["#03CEA4", "#E40066", "#345995", "#FA7921", "#EAC435"]);

// pie chart arc. Need to create arcs before generating pie
var arc = d3.arc()
    .outerRadius(pie_radius - 10)
    .innerRadius(0);

// arc for the labels position
var labelArc = d3.arc()
    .outerRadius(pie_radius - 40)
    .innerRadius(pie_radius - 40);

// generate pie chart
var pie = d3.pie()
    .sort(null)
    .value(function(d) { return d.number; });

// define the svg for pie chart
var pie_svg = d3.select("#pie").append("svg")
    .attr("width", pie_width)
    .attr("height", pie_height)
    .append("g")
    .attr("transform", "translate(" + pie_width / 2 + "," + pie_height / 2 + ")");

// import data
d3.csv("transpie.csv", function(error, data) {
  if (error) throw error;

    // parse data
    data.forEach(function(d) {
        d.number = +d.number;
        d.level = d.level;
    })

  // "g element is a container used to group other SVG elements"
  var g = pie_svg.selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc")

    // transition
    .transition()
      .ease(d3.easeLinear)
      .duration(2000)
      .attrTween("d", tweenPie);
    });

// Helper function for animation of pie chart
function tweenPie(b) {
  b.innerRadius = 0;
  var i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
  return function(t) { return arc(i(t)); };
}
})();
