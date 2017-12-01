(function() {
var width = 900,
  height = 500;

var svg = d3.select("#bubblechart")
.append("svg")
.style("margin-left", "8%")
.style("margin-top", "1%")
.attr("height", height)
.attr("width", width)
.append("g")
.attr("transform", "translate(0,0)")

var toolTip = d3.select('body').append('div').attr('class', 'tooltipbub').style('opacity', 0)

var radiusScale = d3.scaleSqrt().domain(["0", "43.96"]).range([15,80])

var forceXSeparate = d3.forceX(function(d) {
  if(d.category === 'GEN') {
  return 200
} else if (d.category === 'PLWHA') {
  return 650
}
}).strength(0.05)

var forceXCombine = d3.forceX(width / 2).strength(0.05)

var forceCollide = d3.forceCollide(function(d) {
  return radiusScale(d.PLWHA) + 2
  })

var simulation = d3.forceSimulation()
  .force("x", forceXCombine)
  .force("y", d3.forceY(height / 2).strength(0.05))
  .force("collide", forceCollide)

d3.queue()
.defer(d3.csv, "transmissionrisks.csv")
.await(ready)

function ready (error, datapoints) {

  var circles = svg.selectAll(".rate")
  .data(datapoints)
  .enter().append("circle")
  .attr("class", "rate")
  .attr("r", function(d) {
    return radiusScale(d.PLWHA)
    })
  .attr("fill", function (d) {
            if (d.race === "Other") {
                return "#66c2a5"
            } else if (d.race === "Multiracial") {
                return "#fc8d62"
            } else if (d.race == "Asian") {
                return "#8da0cb"
            } else if (d.race == "White") {
                return "#e78ac3"
            } else if (d.race == "Latino") {
                return "#a6d854"
            } else if (d.race == "Black") {
                return "#ffd92f"
              }
                  })
    .on ('mouseover', function (d) {
      div.style("display", "inline")
    })
    .on('mousemove', function (d) {
          toolTip.transition()
          .duration(200)
          .style('opacity', 0.9)
          toolTip.html(`Race/Ethnicity: ${d.race} <br/>${d.number} <br/>${d.PLWHA}%`)
          .style('left', (d3.event.pageX + 10) + 'px')
          .style('top', (d3.event.pageY + 10) + 'px')
        })
        .on('mouseout', function (d) {
          toolTip.transition()
            .duration(500)
            .style('opacity', 0)
        })

  d3.select("#byyear").on('click', function() {
    simulation
      .force("x", forceXSeparate)
      .alphaTarget(0.8)
      .restart()
    })
  d3.select("#combine").on('click', function() {
    simulation
      .force("x", forceXCombine)
      .alphaTarget(0.8)
      .restart()
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
