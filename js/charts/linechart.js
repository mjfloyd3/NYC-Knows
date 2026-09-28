(function () {
  'use strict';

  var SERIES = [
    { key: 'aids_diagnoses', label: 'AIDS diagnoses', color: '#E40066' },
    { key: 'hiv_diagnoses', label: 'HIV diagnoses', color: '#345995' },
    { key: 'deaths', label: 'Deaths', color: '#03CEA4' }
  ];

  // 1981-2010 comes from the historical file; 2011 onward from the city's annual report data.
  // Deaths stop at 2015 because the city now reports a different (all-cause) measure.
  Promise.all([
    d3.csv('data/history-1981-2015.csv', d3.autoType),
    d3.csv('data/citywide.csv', d3.autoType)
  ]).then(function (results) {
    var history = results[0];
    var current = results[1];
    var byYear = {};

    function row(year) {
      return byYear[year] || (byYear[year] = { year: year, aids_diagnoses: null, hiv_diagnoses: null, deaths: null });
    }

    history.forEach(function (d) {
      row(d.year).deaths = d.deaths;
      if (d.year < 2011) row(d.year).aids_diagnoses = d.aids_diagnoses;
    });
    current.forEach(function (d) {
      row(d.year).aids_diagnoses = d.aids_diagnoses;
      row(d.year).hiv_diagnoses = d.hiv_diagnoses;
    });

    var first = d3.min(history, function (d) { return d.year; });
    var last = d3.max(current, function (d) { return d.year; });
    var data = d3.range(first, last + 1).map(function (y) {
      var d = row(y);
      d.date = new Date(y, 0, 1);
      return d;
    });
    var bisectDate = d3.bisector(function (d) { return d.date; }).center;

    d3.select('#linechart .chart-title').text('HIV/AIDS Trends, ' + first + ' - ' + last + ', New York City');

    NYCCharts.responsive('#linechart-chart', function (width, el) {
      var narrow = NYCCharts.isNarrow(width);
      var marginLeft = narrow ? 40 : 60;
      var height = Math.max(280, Math.min(420, width * 0.5));

      var svg = el.append('svg')
        .attr('width', width)
        .attr('class', 'graph-svg-component')
        .attr('role', 'img')
        .attr('aria-label', 'Line chart of HIV and AIDS diagnoses and deaths in NYC, ' + first + ' to ' + last);

      // Legend items flow left to right and wrap onto a new row when they run out of room
      var legendX = 0;
      var legendRow = 0;
      svg.append('g')
        .attr('transform', 'translate(' + marginLeft + ',6)')
        .selectAll('g')
        .data(SERIES)
        .join('g')
        .each(function (s) {
          var item = d3.select(this);
          item.append('line').attr('x1', 0).attr('x2', 18).attr('y1', 9).attr('y2', 9)
            .style('stroke', s.color).style('stroke-width', 3);
          var text = item.append('text').attr('x', 24).attr('y', 9).attr('dy', '0.35em')
            .style('font-size', narrow ? '12px' : '14px').text(s.label);
          var itemWidth = 24 + text.node().getComputedTextLength();
          if (legendX > 0 && marginLeft + legendX + itemWidth > width) {
            legendX = 0;
            legendRow++;
          }
          item.attr('transform', 'translate(' + legendX + ',' + legendRow * 20 + ')');
          legendX += itemWidth + (narrow ? 12 : 20);
        });

      var margin = { top: 36 + legendRow * 20, right: 16, bottom: 30, left: marginLeft };
      height += legendRow * 20;
      svg.attr('height', height);
      var w = width - margin.left - margin.right;
      var h = height - margin.top - margin.bottom;

      var x = d3.scaleTime().domain(d3.extent(data, function (d) { return d.date; })).range([0, w]);
      var y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return Math.max(d.aids_diagnoses || 0, d.hiv_diagnoses || 0, d.deaths || 0); })])
        .nice()
        .range([h, 0]);

      var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      g.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + h + ')')
        .call(d3.axisBottom(x).ticks(Math.max(4, Math.floor(w / 60))));

      g.append('g')
        .attr('class', 'y axis')
        .call(d3.axisLeft(y).ticks(narrow ? 6 : 10, narrow ? '~s' : ',d'));

      SERIES.forEach(function (s) {
        var line = d3.line()
          .defined(function (d) { return d[s.key] != null; })
          .x(function (d) { return x(d.date); })
          .y(function (d) { return y(d[s.key]); });

        g.append('path')
          .datum(data)
          .attr('class', 'line')
          .attr('d', line)
          .style('stroke', s.color);
      });

      var focus = g.append('g').attr('class', 'focus').style('display', 'none');
      focus.append('line').attr('class', 'focus-line').attr('y1', 0).attr('y2', h);
      var dots = focus.selectAll('circle')
        .data(SERIES)
        .join('circle')
        .attr('r', 4.5)
        .style('fill', function (s) { return s.color; })
        .style('stroke', '#fff');

      g.append('rect')
        .attr('class', 'overlay')
        .attr('width', w)
        .attr('height', h)
        .style('touch-action', 'pan-y')
        .on('pointerenter pointermove', function (event) {
          var d = data[bisectDate(data, x.invert(d3.pointer(event)[0]))];
          var cx = x(d.date);
          focus.style('display', null);
          focus.select('line').attr('x1', cx).attr('x2', cx);
          dots
            .style('display', function (s) { return d[s.key] == null ? 'none' : null; })
            .attr('cx', cx)
            .attr('cy', function (s) { return d[s.key] == null ? 0 : y(d[s.key]); });
          var lines = SERIES.filter(function (s) { return d[s.key] != null; }).map(function (s) {
            return '<span style="color:' + s.color + '">' + s.label + ': ' + NYCCharts.format(d[s.key]) + '</span>';
          });
          NYCCharts.showTooltip(event, '<b>' + d.year + '</b><br>' + (lines.length ? lines.join('<br>') : 'No data'));
        })
        .on('pointerleave', function (event) {
          if (!NYCCharts.isMouseLeave(event)) return;
          focus.style('display', 'none');
          NYCCharts.hideTooltip();
        });
    });
  });
})();
