(function () {
  'use strict';

  var SET2 = d3.schemeSet2;

  function pieChart(selector, data, colors) {
    var color = d3.scaleOrdinal(colors);
    var total = d3.sum(data, function (d) { return d.value; });

    NYCCharts.responsive(selector, function (width, el) {
      var size = Math.min(200, width);
      var radius = size / 2 - 5;

      var svg = el.append('svg')
        .attr('class', 'pie')
        .attr('width', size)
        .attr('height', size)
        .attr('role', 'img')
        .attr('aria-label', data.map(function (d) { return d.name + ' ' + d.value; }).join(', '));

      var paths = svg.append('g')
        .attr('transform', 'translate(' + size / 2 + ',' + size / 2 + ')')
        .selectAll('path')
        .data(d3.pie().value(function (d) { return d.value; }).sort(null)(data))
        .join('path')
        .attr('d', d3.arc().innerRadius(0).outerRadius(radius))
        .attr('fill', function (d, i) { return color(i); })
        .on('pointerenter pointermove', function (event, d) {
          paths.style('opacity', 1);
          d3.select(this).style('opacity', 0.5);
          NYCCharts.showTooltip(event, '<b>' + d.data.name + '</b><br>' + NYCCharts.format(d.data.value) +
            ' (' + d3.format('.1%')(d.data.value / total) + ')');
        })
        .on('pointerleave', function (event) {
          if (!NYCCharts.isMouseLeave(event)) return;
          paths.style('opacity', 1);
          NYCCharts.hideTooltip();
        });

      var legend = el.append('ul').attr('class', 'legend');
      var keys = legend.selectAll('li')
        .data(data)
        .join('li')
        .attr('class', 'key');
      keys.append('span')
        .attr('class', 'symbol')
        .style('background-color', function (d, i) { return color(i); });
      keys.append('span')
        .attr('class', 'name')
        .text(function (d) { return d.name + ' (' + NYCCharts.format(d.value) + ')'; });
    });
  }

  pieChart('#pieChart-chart', [
    { name: 'Perinatal (mother to child)', value: 3 },
    { name: 'MSM who inject drugs', value: 33 },
    { name: 'Transgender', value: 41 },
    { name: 'Injection drug use', value: 43 },
    { name: 'Heterosexual', value: 412 },
    { name: 'Unknown', value: 511 },
    { name: 'Men who have sex with men (MSM)', value: 1450 }
  ], SET2.slice().reverse());

  d3.csv('data/gender.csv', d3.autoType).then(function (rows) {
    pieChart('#pieChart2-chart', rows.map(function (d) {
      return { name: d.gender, value: d.hiv_diagnoses };
    }), SET2);
  });
})();
