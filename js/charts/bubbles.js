(function () {
  'use strict';

  var COLORS = {
    'Black': '#ffd92f',
    'Latinx/Hispanic': '#a6d854',
    'White': '#e78ac3',
    'Asian/Pacific Islander': '#8da0cb',
    'Other/Unknown': '#66c2a5'
  };
  var GROUP_LABELS = {
    GEN: 'City Population by Race/Ethnicity',
    DX: 'New HIV Diagnoses by Race/Ethnicity'
  };

  var split = false;
  var setSplit = function () {};

  var splitBtn = document.getElementById('byyear');
  var combineBtn = document.getElementById('combine');
  splitBtn.addEventListener('click', function () { setSplit(true); });
  combineBtn.addEventListener('click', function () { setSplit(false); });

  d3.csv('data/race.csv', d3.autoType).then(function (data) {
    NYCCharts.responsive('#bubble-chart', function (width, el) {
      var narrow = NYCCharts.isNarrow(width);
      var maxR = Math.min(80, width / (narrow ? 7 : 11));
      var radius = d3.scaleSqrt().domain([0, d3.max(data, function (d) { return d.percent; })]).range([maxR * 15 / 80, maxR]);
      // On phones the split view stacks the groups, so it needs a taller chart than the combined view
      var combinedHeight = narrow ? width * 1.05 : Math.min(500, width * 0.6);
      var splitHeight = narrow ? width * 1.6 : combinedHeight;
      var height = split ? splitHeight : combinedHeight;
      var nodes = data.map(function (d, i) {
        // Start near the middle so the bubbles don't fly in from the corner
        return Object.assign({ x: width / 2 + Math.cos(i) * 40, y: height / 2 + Math.sin(i) * 40 }, d);
      });

      // Where each group settles when split: side by side on wide screens, stacked on phones
      function groupX(d) {
        if (!split || narrow) return width / 2;
        return d.category === 'GEN' ? width * 0.25 : width * 0.72;
      }
      function groupY(d) {
        if (!split || !narrow) return height / 2;
        return d.category === 'GEN' ? splitHeight * 0.27 : splitHeight * 0.75;
      }

      var svg = el.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('role', 'img')
        .attr('aria-label', 'Bubble chart comparing the racial makeup of NYC with people living with HIV/AIDS');

      var labels = svg.append('g')
        .attr('class', 'bubble-labels')
        .selectAll('text')
        .data(['GEN', 'DX'])
        .join('text')
        .attr('text-anchor', 'middle')
        .attr('x', function (c) { return narrow ? width / 2 : (c === 'GEN' ? width * 0.25 : width * 0.72); })
        .attr('y', function (c) { return narrow ? (c === 'GEN' ? 20 : splitHeight * 0.52) : 24; })
        .text(function (c) { return GROUP_LABELS[c]; });

      var circles = svg.selectAll('.rate')
        .data(nodes)
        .join('circle')
        .attr('class', 'rate')
        .attr('r', function (d) { return radius(d.percent); })
        .attr('fill', function (d) { return COLORS[d.race]; })
        .on('pointerenter pointermove', function (event, d) {
          NYCCharts.showTooltip(event, '<b>' + d.race + '</b><br>' +
            (d.category === 'GEN' ?
              d.percent + '% of New Yorkers 13+ (about ' + NYCCharts.format(d.number) + ')' :
              d.percent + '% of new HIV diagnoses (' + NYCCharts.format(d.number) + ')'));
        })
        .on('pointerleave', NYCCharts.hideTooltip);

      var simulation = d3.forceSimulation(nodes)
        .force('collide', d3.forceCollide(function (d) { return radius(d.percent) + 2; }))
        .on('tick', function () {
          circles.attr('cx', function (d) { return d.x; }).attr('cy', function (d) { return d.y; });
        });

      setSplit = function (value) {
        split = value;
        height = split ? splitHeight : combinedHeight;
        svg.transition().duration(600).attr('height', height);
        splitBtn.setAttribute('aria-pressed', String(split));
        combineBtn.setAttribute('aria-pressed', String(!split));
        labels.transition().duration(600).style('opacity', split ? 1 : 0);
        simulation
          .force('x', d3.forceX(groupX).strength(0.05))
          .force('y', d3.forceY(groupY).strength(narrow ? 0.08 : 0.05))
          .alpha(0.9)
          .restart();
      };
      labels.style('opacity', split ? 1 : 0);
      setSplit(split);
    });
  });
})();
