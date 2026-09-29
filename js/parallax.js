// Parallax banners on the homepage. Same behavior as Materialize 0.100.2's parallax plugin,
// which the site used before: the image inside each .parallax container slides as you scroll.
(function () {
  'use strict';

  // Content height, the way jQuery's .height() measures it. Hidden elements have no height,
  // so like jQuery, briefly show them invisibly to measure.
  function contentHeight(el) {
    var cs = getComputedStyle(el);
    if (cs.display === 'none') {
      var saved = { position: el.style.position, visibility: el.style.visibility, display: el.style.display };
      el.style.position = 'absolute';
      el.style.visibility = 'hidden';
      el.style.display = 'block';
      var h0 = contentHeight(el);
      el.style.position = saved.position;
      el.style.visibility = saved.visibility;
      el.style.display = saved.display;
      return h0;
    }
    var h = parseFloat(cs.height) || 0;
    if (cs.boxSizing === 'border-box') {
      h -= parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) +
        parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    }
    return h;
  }

  function setup(container) {
    var img = container.querySelector(':scope > img');
    if (!img) return;

    function update(initial) {
      var height = contentHeight(container);
      if (!(height > 0)) height = document.documentElement.clientWidth < 601 ? contentHeight(img) : 500;

      var top = container.getBoundingClientRect().top + window.pageYOffset;
      var bottom = top + height;
      var scrollTop = window.pageYOffset;
      var windowHeight = window.innerHeight;
      var percentScrolled = (scrollTop + windowHeight - top) / (height + windowHeight);
      var offset = Math.round((contentHeight(img) - height) * percentScrolled);

      if (initial) img.style.display = 'block';
      if (bottom > scrollTop && top < scrollTop + windowHeight) {
        img.style.transform = 'translate3D(-50%,' + offset + 'px, 0)';
      }
    }

    if (img.complete) update(true);
    else img.addEventListener('load', function () { update(true); }, { once: true });
    window.addEventListener('scroll', function () { update(false); });
    window.addEventListener('resize', function () { update(false); });
  }

  // Start when the DOM is ready, as Materialize did (via jQuery's ready)
  function init() {
    document.querySelectorAll('.parallax').forEach(setup);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init);
})();
