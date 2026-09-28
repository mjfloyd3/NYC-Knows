// Shared helpers for the charts on data.html
window.NYCCharts = (function () {
  'use strict';

  var tooltip = null;

  function getTooltip() {
    if (!tooltip) {
      tooltip = d3.select('body').append('div')
        .attr('class', 'chart-tooltip')
        .attr('role', 'tooltip')
        .style('opacity', 0);
    }
    return tooltip;
  }

  // Positions the tooltip next to the pointer, kept inside the viewport
  function showTooltip(event, html) {
    var t = getTooltip().html(html).style('opacity', 0.95);
    var node = t.node();
    var pad = 12;
    var x = event.pageX + pad;
    var y = event.pageY + pad;
    var maxX = window.scrollX + document.documentElement.clientWidth - node.offsetWidth - 4;
    if (x > maxX) x = Math.max(window.scrollX + 4, event.pageX - node.offsetWidth - pad);
    t.style('left', x + 'px').style('top', y + 'px');
  }

  // Touch screens fire pointerleave as soon as the finger lifts, so only a mouse leaving hides
  // the tooltip. On touch, tapping elsewhere hides it (below).
  function isMouseLeave(event) {
    return !event || !event.pointerType || event.pointerType === 'mouse';
  }

  function hideTooltip(event) {
    if (isMouseLeave(event)) getTooltip().style('opacity', 0);
  }

  // Tap anywhere else on a touch screen to dismiss the tooltip
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' && !e.target.closest('svg')) getTooltip().style('opacity', 0);
  });

  // Calls draw(width) now and again whenever the container's width changes
  function responsive(selector, draw) {
    var el = document.querySelector(selector);
    var lastWidth = 0;
    function render() {
      var style = getComputedStyle(el);
      var width = Math.floor(el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
      if (!width || width === lastWidth) return;
      lastWidth = width;
      d3.select(el).selectAll('*').remove();
      draw(width, d3.select(el));
    }
    if ('ResizeObserver' in window) {
      new ResizeObserver(render).observe(el);
    } else {
      window.addEventListener('resize', render);
    }
    render();
  }

  function isNarrow(width) {
    return width < 560;
  }

  var format = d3.format(',');

  return {
    showTooltip: showTooltip,
    hideTooltip: hideTooltip,
    isMouseLeave: isMouseLeave,
    responsive: responsive,
    isNarrow: isNarrow,
    format: format
  };
})();
