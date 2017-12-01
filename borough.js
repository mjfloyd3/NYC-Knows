(function() {
var width = 360,
  height = 360;

var svg = d3.select("#borough")
.append("svg")
.attr("height", height)
.attr("width", width)
.append("g")
.attr("transform", "translate(0,0)")

var toolTip = d3.select('body').append('div').attr('class', 'tooltipbor').style('opacity', 0)

var simulation = d3. forceSimulation()
  .force("x", d3.forceX(width / 2).strength(0.07))
  .force("y", d3.forceY(height / 2).strength(0.07))
  .force("collide", d3.forceCollide(function(d) {
    return radiusScale(d.number)+ 2;
  }))

var radiusScale;

d3.queue()
.defer(d3.csv, "borough.csv")
.await(ready)

function ready (error, datapoints) {
  var values = datapoints.map( dp => parseFloat(dp.number) || 0 ),
      min = Math.min.apply(null,values),
      max = Math.max.apply(null,values);
  console.log(values)
  radiusScale = d3.scaleSqrt().domain([min, max]).range([(min/max)*60,60])
  console.log(datapoints);
  var circles = svg.selectAll(".rate")
  .data(datapoints)
  .enter().append("circle")
  .attr("class", "rate")
  .attr("r", function(d) {
    return radiusScale(d.number)
  })
  .attr("fill", function (d) {
            if (d.borough === "StatenIsland") {
                return "#EAC435"
            } else if (d.borough === "Queens") {
                return "#345995"
            } else if (d.borough === "Manhattan") {
                return "#03CEA4"
            } else if (d.borough === "Brooklyn") {
                return "#FA7921"
              } else if (d.borough == "Bronx") {
                return "#E40066"
              }
                  })

    .on ('mouseover', function (d) {
      div.style("display", "inline")
      div.style("stoke", "5px")
    })
    .on('mousemove', function (d) {
          toolTip.transition()
          .duration(200)
          .style('opacity', 0.9)
          toolTip.html(`${d.borough}<br/>${d.no}<br/>${d.number}%`)
          .style('left', (d3.event.pageX + 10) + 'px')
          .style('top', (d3.event.pageY + 10) + 'px')
        })
        .on('mouseout', function (d) {
          toolTip.transition()
            .duration(500)
            .style('opacity', 0)
        })

  simulation.nodes(datapoints)
  .on('tick', ticked)

  function ticked() {
    circles
    .attr("cx", function(d) {
      return d.x
      })
      .attr("cy", function(d) {
        return d.y
        })
  }
}

})();
