(function () {
  'use strict';

  var color = d3.scaleOrdinal().range(['#345995', '#03CEA4']);

  d3.csv('data/living.csv', function (d, i, columns) {
    var total = 0;
    for (var c = 1; c < columns.length; ++c) total += d[columns[c]] = +d[columns[c]] || 0;
    d.total = total;
    return d;
  }).then(function (data) {
    var keys = data.columns.slice(1);
    color.domain(keys);
    var stacked = d3.stack().keys(keys)(data);

    NYCCharts.responsive('#stacked-chart', function (width, el) {
      var narrow = NYCCharts.isNarrow(width);
      var margin = { top: narrow ? 50 : 25, right: 10, bottom: 30, left: narrow ? 40 : 60 };
      var height = Math.max(280, Math.min(400, width * 0.5));
      var w = width - margin.left - margin.right;
      var h = height - margin.top - margin.bottom;

      var x = d3.scaleBand()
        .domain(data.map(function (d) { return d.year; }))
        .rangeRound([0, w])
        .paddingInner(0.15)
        .align(0.1);
      var y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.total; })])
        .nice()
        .rangeRound([h, 0]);

      var svg = el.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('role', 'img')
        .attr('aria-label', 'Stacked bar chart of people living with HIV and AIDS in NYC, 1981 to 2015');
      var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      g.append('g')
        .selectAll('g')
        .data(stacked)
        .join('g')
        .attr('fill', function (d) { return color(d.key); })
        .selectAll('rect')
        .data(function (d) { return d; })
        .join('rect')
        .attr('x', function (d) { return x(d.data.year); })
        .attr('y', function (d) { return y(d[1]); })
        .attr('height', function (d) { return y(d[0]) - y(d[1]); })
        .attr('width', x.bandwidth())
        .on('pointerenter pointermove', function (event, d) {
          var row = d.data;
          NYCCharts.showTooltip(event, '<b>' + row.year + '</b><br>' +
            keys.map(function (k) { return k + ': ' + NYCCharts.format(row[k]); }).join('<br>') +
            '<br>Total: ' + NYCCharts.format(row.total));
        })
        .on('pointerleave', NYCCharts.hideTooltip);

      // Only label every Nth year so the labels don't collide
      var every = Math.ceil(34 / (w / 28));
      g.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + h + ')')
        .call(d3.axisBottom(x).tickValues(x.domain().filter(function (d, i) { return i % every === 0; })));

      g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y).ticks(narrow ? 6 : 10, '~s'));

      var legend = svg.append('g')
        .attr('font-size', 12)
        .attr('transform', narrow ?
          'translate(' + margin.left + ',8)' :
          'translate(' + (margin.left + 12) + ',' + margin.top + ')')
        .selectAll('g')
        .data(keys.slice().reverse())
        .join('g')
        .attr('transform', function (d, i) { return 'translate(0,' + i * 20 + ')'; });

      legend.append('rect')
        .attr('width', 14)
        .attr('height', 14)
        .attr('fill', color);

      legend.append('text')
        .attr('x', 20)
        .attr('y', 7)
        .attr('dy', '0.35em')
        .text(function (d) { return d; });
    });
  });
})();
