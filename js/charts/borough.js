(function () {
  'use strict';

  var COLORS = {
    Bronx: '#E40066',
    Brooklyn: '#FA7921',
    Manhattan: '#03CEA4',
    Queens: '#345995',
    'Staten Island': '#EAC435'
  };

  d3.csv('data/borough.csv', d3.autoType).then(function (data) {
    d3.select('#boroughlegend')
      .selectAll('li')
      .data(data)
      .join('li')
      .html(function (d) {
        return '<span class="key-dot" style="background:' + COLORS[d.borough] + '"></span>' +
          d.borough + ' (' + d.prevalence.toFixed(1) + '%)';
      });

    NYCCharts.responsive('#borough-chart', function (width, el) {
      var size = Math.min(width, 360);
      var maxR = size / 6;
      var max = d3.max(data, function (d) { return d.prevalence; });
      var radius = d3.scaleSqrt().domain([0, max]).range([0, maxR]);
      var nodes = data.map(function (d) { return Object.assign({}, d); });

      var svg = el.append('svg')
        .attr('width', size)
        .attr('height', size)
        .attr('role', 'img')
        .attr('aria-label', 'Bubble chart of HIV prevalence rate by borough');

      var circles = svg.selectAll('.rate')
        .data(nodes)
        .join('circle')
        .attr('class', 'rate')
        .attr('r', function (d) { return radius(d.prevalence); })
        .attr('fill', function (d) { return COLORS[d.borough]; })
        .on('pointerenter pointermove', function (event, d) {
          NYCCharts.showTooltip(event, '<b>' + d.borough + '</b><br>' +
            d.prevalence.toFixed(1) + '% living with HIV<br>' +
            NYCCharts.format(d.hiv_diagnoses) + ' new diagnoses in 2022');
        })
        .on('pointerleave', NYCCharts.hideTooltip);

      d3.forceSimulation(nodes)
        .force('x', d3.forceX(size / 2).strength(0.07))
        .force('y', d3.forceY(size / 2).strength(0.07))
        .force('collide', d3.forceCollide(function (d) { return radius(d.prevalence) + 2; }))
        .on('tick', function () {
          circles.attr('cx', function (d) { return d.x; }).attr('cy', function (d) { return d.y; });
        });
    });
  });
})();
