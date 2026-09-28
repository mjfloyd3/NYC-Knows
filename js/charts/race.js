// Race/ethnicity: share of population vs share of new diagnoses (dumbbell),
// with a toggle to diagnosis rate per 100,000 (bars + citywide average line)
(function () {
  'use strict';

  var POP_COLOR = '#345995';
  var DX_COLOR = '#E40066';
  var CONNECTOR = '#b5b5b5';
  var SURFACE = '#f3f3f3';
  var MUTED = '#555';
  var DURATION = 750;

  var view = 'share';
  var setView = function () {};

  var shareBtn = document.getElementById('view-share');
  var rateBtn = document.getElementById('view-rate');
  shareBtn.addEventListener('click', function () { setView('share'); });
  rateBtn.addEventListener('click', function () { setView('rate'); });

  var pct = function (v) { return d3.format('.1f')(v) + '%'; };

  // Bar with a 4px rounded data end and a square baseline
  function barPath(x0, x1, y, h) {
    var r = Math.max(0, Math.min(4, (x1 - x0) / 2, h / 2));
    return 'M' + x0 + ',' + y + 'H' + (x1 - r) +
      'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r +
      'V' + (y + h - r) +
      'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + r +
      'H' + x0 + 'Z';
  }

  // Wait for web fonts so label widths are measured in the real font
  Promise.all([d3.csv('data/race.csv', d3.autoType), document.fonts.ready]).then(function (results) {
    var rows = results[0];
    var city = rows.find(function (d) { return d.race === 'All'; });
    var data = rows.filter(function (d) { return d.race !== 'All'; });

    // Rows keep a stable order per view; switching views re-sorts them with an animation
    var ORDER = {
      share: data.slice().sort(function (a, b) { return b.diagnosis_share - a.diagnosis_share; }).map(function (d) { return d.race; }),
      rate: data.slice().sort(function (a, b) { return b.diagnosis_rate - a.diagnosis_rate; }).map(function (d) { return d.race; })
    };

    // Headline for the share view: the two groups most over-represented
    var over = data.filter(function (d) { return d.diagnosis_share > d.population_share; });
    var CAPTIONS = {
      share: over.map(function (d) { return d.race; }).join(' and ') + ' New Yorkers are ' +
        Math.round(d3.sum(over, function (d) { return d.population_share; })) + '% of the population but ' +
        Math.round(d3.sum(over, function (d) { return d.diagnosis_share; })) + '% of new HIV diagnoses.',
      rate: 'New HIV diagnoses per 100,000 New Yorkers aged 13 and over. The citywide rate is ' + city.diagnosis_rate + '.'
    };

    d3.select('#race-table').html(
      '<thead><tr><th>Race/ethnicity</th><th>Share of population</th><th>Share of new diagnoses</th>' +
      '<th>New diagnoses</th><th>Rate per 100,000</th></tr></thead><tbody>' +
      rows.map(function (d) {
        return '<tr><td>' + (d.race === 'All' ? 'All New Yorkers' : d.race) + '</td><td>' + pct(d.population_share) +
          '</td><td>' + pct(d.diagnosis_share) + '</td><td>' + NYCCharts.format(d.hiv_diagnoses) +
          '</td><td>' + d.diagnosis_rate + '</td></tr>';
      }).join('') + '</tbody>');

    NYCCharts.responsive('#race-chart', function (width, el) {
      var narrow = NYCCharts.isNarrow(width);

      var svg = el.append('svg')
        .attr('width', width)
        .attr('role', 'img')
        .attr('aria-label', 'Chart comparing each racial/ethnic group\'s share of the NYC population with its share of new HIV diagnoses; the data table below has the values');

      // On phones the race name and values sit on a line above each row, so the plot gets the full width
      var labelWidth = 0;
      if (!narrow) {
        var probe = svg.append('text').attr('class', 'race-label');
        data.forEach(function (d) {
          probe.text(d.race);
          labelWidth = Math.max(labelWidth, probe.node().getComputedTextLength());
        });
        probe.remove();
      }

      var margin = narrow ?
        { top: 24, right: 14, bottom: 28, left: 10 } :
        { top: 24, right: 130, bottom: 28, left: labelWidth + 24 };
      var rowHeight = narrow ? 58 : 46;
      var dotOffset = narrow ? 36 : rowHeight / 2;   // where the dots sit within a row
      var w = width - margin.left - margin.right;
      var h = rowHeight * data.length;
      svg.attr('height', h + margin.top + margin.bottom);

      var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      var x = d3.scaleLinear().range([0, w]);
      var y = d3.scaleBand().range([0, h]);

      var grid = g.append('g').attr('class', 'race-grid');
      var axis = g.append('g').attr('class', 'axis').attr('transform', 'translate(0,' + h + ')');

      var avg = g.append('g').attr('class', 'race-average').style('opacity', 0);
      avg.append('line').attr('y1', -8).attr('y2', h);
      avg.append('text').attr('y', -12).attr('text-anchor', 'middle').text('NYC overall: ' + city.diagnosis_rate);

      var row = g.selectAll('.race-row')
        .data(data, function (d) { return d.race; })
        .join('g')
        .attr('class', 'race-row');

      // Full-width invisible rect so the whole row is the hover/tap target
      row.append('rect')
        .attr('class', 'race-hit')
        .attr('x', -margin.left)
        .attr('width', width)
        .attr('height', rowHeight)
        .attr('fill', 'transparent');

      row.append('text')
        .attr('class', 'race-label')
        .attr('x', narrow ? 0 : -12)
        .attr('y', narrow ? 14 : dotOffset)
        .attr('dy', '0.35em')
        .attr('text-anchor', narrow ? 'start' : 'end')
        .text(function (d) { return d.race; });

      var value = row.append('text')
        .attr('class', 'race-value')
        .attr('x', narrow ? w : w + margin.right - 4)
        .attr('y', narrow ? 14 : dotOffset)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end');

      var bar = row.append('path').attr('fill', DX_COLOR);
      var connector = row.append('line')
        .attr('stroke', CONNECTOR)
        .attr('stroke-width', 2)
        .attr('y1', dotOffset)
        .attr('y2', dotOffset);
      var popDot = row.append('circle')
        .attr('r', 6)
        .attr('cy', dotOffset)
        .attr('fill', SURFACE)
        .attr('stroke', POP_COLOR)
        .attr('stroke-width', 2.5);
      var dxDot = row.append('circle')
        .attr('r', 6)
        .attr('cy', dotOffset)
        .attr('fill', DX_COLOR)
        .attr('stroke', SURFACE)
        .attr('stroke-width', 2);

      row
        .on('pointerenter pointermove', function (event, d) {
          row.classed('is-dimmed', function (o) { return o !== d; });
          NYCCharts.showTooltip(event, '<b>' + d.race + '</b><br>' +
            pct(d.population_share) + ' of New Yorkers 13+<br>' +
            pct(d.diagnosis_share) + ' of new diagnoses (' + NYCCharts.format(d.hiv_diagnoses) + ')<br>' +
            d.diagnosis_rate + ' diagnoses per 100,000');
        })
        .on('pointerleave', function (event) {
          if (!NYCCharts.isMouseLeave(event)) return;
          row.classed('is-dimmed', false);
          NYCCharts.hideTooltip();
        });

      function render(animate) {
        var t = svg.transition().duration(animate ? DURATION : 0);
        var isShare = view === 'share';
        var barH = 16;

        x.domain([0, isShare ?
          Math.ceil(d3.max(data, function (d) { return Math.max(d.population_share, d.diagnosis_share); }) / 10) * 10 :
          Math.ceil(d3.max(data, function (d) { return d.diagnosis_rate; }) / 10) * 10]);
        y.domain(ORDER[view]);

        var ticks = x.ticks(narrow ? 5 : 10);
        grid.selectAll('line')
          .data(ticks, function (d) { return d; })
          .join('line')
          .attr('y1', 0)
          .attr('y2', h)
          .transition(t)
          .attr('x1', x)
          .attr('x2', x);

        axis.transition(t).call(d3.axisBottom(x).ticks(narrow ? 5 : 10)
          .tickFormat(isShare ? function (v) { return v + '%'; } : d3.format('d')));

        row.transition(t).attr('transform', function (d) { return 'translate(0,' + y(d.race) + ')'; });

        connector.transition(t)
          .attr('x1', function (d) { return isShare ? x(d.population_share) : 0; })
          .attr('x2', function (d) { return isShare ? x(d.diagnosis_share) : 0; })
          .style('opacity', isShare ? 1 : 0);
        popDot.transition(t)
          .attr('cx', function (d) { return isShare ? x(d.population_share) : 0; })
          .style('opacity', isShare ? 1 : 0);
        // The diagnosis dot slides out to the end of its bar and fades as the bar grows under it
        dxDot.transition(t)
          .attr('cx', function (d) { return x(isShare ? d.diagnosis_share : d.diagnosis_rate); })
          .style('opacity', isShare ? 1 : 0);
        bar.transition(t)
          .attr('d', function (d) {
            return barPath(0, isShare ? 0 : x(d.diagnosis_rate), dotOffset - barH / 2, barH);
          });

        value.text(function (d) {
          return isShare ? pct(d.population_share) + ' → ' + pct(d.diagnosis_share) : d.diagnosis_rate + ' per 100k';
        });

        avg.transition(t)
          .attr('transform', 'translate(' + x(isShare ? 0 : city.diagnosis_rate) + ',0)')
          .style('opacity', isShare ? 0 : 1);

        d3.select('#race-legend').style('display', isShare ? null : 'none');
        d3.select('#race-caption').text(CAPTIONS[view]);
      }

      // Touch has no pointerleave to undo the dimming, so a tap outside the chart clears it
      document.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' && !svg.node().contains(e.target)) row.classed('is-dimmed', false);
      });

      setView = function (next) {
        if (next === view) return;
        view = next;
        shareBtn.setAttribute('aria-pressed', String(view === 'share'));
        rateBtn.setAttribute('aria-pressed', String(view === 'rate'));
        render(true);
      };

      render(false);
    });
  });
})();
