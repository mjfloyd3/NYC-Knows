(function () {
  'use strict';

  var NYC_CENTER = [40.730610, -73.935242];
  var GEOSEARCH_URL = 'https://geosearch.planninglabs.nyc/v2/search';
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MAX_RESULTS = 25;

  var map = L.map('map', { scrollWheelZoom: false }).setView(NYC_CENTER, 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  // Only zoom on scroll once the user has clicked into the map, so the page scrolls normally
  map.once('focus', function () { map.scrollWheelZoom.enable(); });

  var list = document.getElementById('infos');
  var countEl = document.getElementById('result-count');
  var statusEl = document.getElementById('search-status');
  var input = document.getElementById('pac-input');

  var sites = [];
  // NYC GeoSearch can't look up a bare zip code or neighborhood name, so we bundle their centers
  var zipCentroids = {};
  var neighborhoods = {};
  var NEIGHBORHOOD_ALIASES = {
    'bed stuy': 'bedford', 'bedstuy': 'bedford', 'bedford stuyvesant': 'bedford',
    'les': 'lower east side', 'ues': 'upper east side', 'uws': 'upper west side',
    'fidi': 'battery park city', 'financial district': 'battery park city',
    'dumbo': 'dumbo', 'williamsburg': 'north side south side', 'hells kitchen': 'clinton'
  };
  var origin = null;        // the point results are sorted by, once the user has searched
  var originMarker = null;

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function safeUrl(url) {
    return /^https?:\/\//i.test(url || '') ? url : '';
  }

  function fullAddress(s) {
    return [s.address, s.suite].filter(Boolean).join(', ') + ', ' + s.city + ', NY ' + s.zip;
  }

  function todaysHours(s) {
    var h = s.hours && s.hours[DAYS[new Date().getDay()]];
    return h ? h : 'Hours not listed';
  }

  function miles(a, b) {
    return map.distance(a, b) / 1609.344;
  }

  function siteHtml(s, withHours) {
    var website = safeUrl(s.website);
    var phoneDigits = (s.phone || '').replace(/[^\d]/g, '');
    var directions = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(fullAddress(s));
    var html = '<p class="site-name">' + escapeHtml(s.name) + '</p>' +
      '<p>' + escapeHtml(fullAddress(s)) + '</p>' +
      '<p class="site-hours">Today: ' + escapeHtml(todaysHours(s)) + '</p>';

    if (withHours && s.hours) {
      html += '<table class="hours-table">' + DAYS.slice(1).concat('Sun').map(function (d) {
        return '<tr><th>' + d + '</th><td>' + escapeHtml(s.hours[d] || '-') + '</td></tr>';
      }).join('') + '</table>';
    }

    html += '<p class="site-links">';
    if (phoneDigits.length >= 10) html += '<a href="tel:' + phoneDigits + '">' + escapeHtml(s.phone) + '</a>';
    html += '<a href="' + directions + '" target="_blank" rel="noopener">Directions</a>';
    if (website) html += '<a href="' + escapeHtml(website) + '" target="_blank" rel="noopener">Website</a>';
    html += '</p>';
    return html;
  }

  function renderList() {
    var bounds = map.getBounds();
    var ref = origin || map.getCenter();
    var visible = sites
      .filter(function (s) { return bounds.contains(s.latlng); })
      .map(function (s) { return { site: s, dist: miles(ref, s.latlng) }; })
      .sort(function (a, b) { return a.dist - b.dist; });

    countEl.textContent = visible.length ? '(' + visible.length + ' in view)' : '';
    list.innerHTML = '';

    if (!visible.length) {
      list.innerHTML = '<li class="empty">No locations in this area. Try zooming out.</li>';
      return;
    }

    visible.slice(0, MAX_RESULTS).forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'site';
      li.innerHTML = (origin ? '<span class="site-distance">' + r.dist.toFixed(1) + ' mi</span>' : '') + siteHtml(r.site, false);
      li.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        focusSite(r.site);
      });
      list.appendChild(li);
    });

    if (visible.length > MAX_RESULTS) {
      var more = document.createElement('li');
      more.className = 'empty';
      more.textContent = 'Zoom in to see ' + (visible.length - MAX_RESULTS) + ' more.';
      list.appendChild(more);
    }
  }

  function focusSite(s) {
    var zoom = Math.max(map.getZoom(), 15);
    // Open the popup once the map stops moving; opening it mid-animation cancels the
    // popup's auto-pan and leaves it cut off at the top of the map
    if (map.getZoom() === zoom && map.getCenter().distanceTo(s.latlng) < 1) {
      s.marker.openPopup();
    } else {
      map.once('moveend', function () { s.marker.openPopup(); });
      map.setView(s.latlng, zoom);
    }
    if (window.matchMedia('(max-width: 991px)').matches) {
      document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function setOrigin(latlng, label) {
    origin = L.latLng(latlng);
    if (originMarker) originMarker.remove();
    originMarker = L.circleMarker(origin, {
      radius: 9, color: '#fff', weight: 3, fillColor: '#345995', fillOpacity: 1
    }).addTo(map).bindTooltip(label || 'You searched here');

    // Zoom so the nearest few sites are in view
    var nearest = sites
      .map(function (s) { return { s: s, d: miles(origin, s.latlng) }; })
      .sort(function (a, b) { return a.d - b.d; })
      .slice(0, 5)
      .map(function (r) { return r.s.latlng; });
    map.fitBounds(L.latLngBounds(nearest.concat(origin)), { padding: [30, 30], maxZoom: 15 });
    renderList();
  }

  function simplify(str) {
    return str.toLowerCase().replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Neighborhood names look like "Bedford Park-Fordham North", so match against each part.
  // Prefer an exact part match, then a part starting with the query, then any substring.
  function findNeighborhood(text) {
    var q = simplify(text);
    q = NEIGHBORHOOD_ALIASES[q] || q;
    if (q.length < 3) return null;
    var names = Object.keys(neighborhoods);
    var tests = [
      function (part) { return part === q; },
      function (part) { return part.indexOf(q) === 0; },
      function (part) { return part.indexOf(q) !== -1; }
    ];
    for (var t = 0; t < tests.length; t++) {
      for (var i = 0; i < names.length; i++) {
        var parts = names[i].split('-').map(simplify).concat(simplify(names[i]));
        if (parts.some(tests[t])) return names[i];
      }
    }
    return null;
  }

  function search(text) {
    text = text.trim();
    if (!text) return;

    if (/^\d{5}$/.test(text)) {
      if (zipCentroids[text]) {
        statusEl.textContent = 'Showing locations nearest ' + text;
        setOrigin(zipCentroids[text], 'Zip code ' + text);
      } else {
        statusEl.textContent = text + ' doesn\'t look like an NYC zip code. Try a street address or neighborhood.';
      }
      return;
    }

    var hood = !/\d/.test(text) && findNeighborhood(text);
    if (hood) {
      statusEl.textContent = 'Showing locations nearest ' + hood;
      setOrigin(neighborhoods[hood], hood);
      return;
    }

    statusEl.textContent = 'Searching...';
    fetch(GEOSEARCH_URL + '?size=1&text=' + encodeURIComponent(text))
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(function (json) {
        var f = json.features && json.features[0];
        if (!f) {
          statusEl.textContent = 'We couldn\'t find "' + text + '" in NYC. Try a zip code or street address.';
          return;
        }
        var c = f.geometry.coordinates;
        statusEl.textContent = 'Showing locations nearest ' + f.properties.label.replace(/, USA$/, '');
        setOrigin([c[1], c[0]], f.properties.label);
      })
      .catch(function () {
        statusEl.textContent = 'Search is unavailable right now. You can still browse the map.';
      });
  }

  document.getElementById('search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    input.blur();
    history.replaceState(null, '', '?q=' + encodeURIComponent(input.value.trim()));
    search(input.value);
  });

  var locateBtn = document.getElementById('locate-btn');
  if (!('geolocation' in navigator)) locateBtn.hidden = true;
  locateBtn.addEventListener('click', function () {
    statusEl.textContent = 'Finding your location...';
    navigator.geolocation.getCurrentPosition(function (pos) {
      statusEl.textContent = 'Showing locations nearest you';
      setOrigin([pos.coords.latitude, pos.coords.longitude], 'You are here');
    }, function () {
      statusEl.textContent = 'We couldn\'t get your location. Try entering a zip code instead.';
    }, { enableHighAccuracy: true, timeout: 10000 });
  });

  function getJson(url) {
    return fetch(url).then(function (res) { return res.json(); });
  }

  Promise.all([getJson('data/sites.json'), getJson('data/zip-centroids.json'), getJson('data/neighborhoods.json')])
    .then(function (results) {
      sites = results[0];
      zipCentroids = results[1];
      neighborhoods = results[2];
      sites.forEach(function (s) {
        s.latlng = L.latLng(s.lat, s.lng);
        s.marker = L.circleMarker(s.latlng, {
          radius: 8, color: '#fff', weight: 2, fillColor: '#ff7961', fillOpacity: 0.95
        })
          .bindPopup('<div class="site-popup">' + siteHtml(s, true) + '</div>', { maxWidth: 280 })
          .addTo(map);
      });

      map.on('moveend', renderList);

      var q = new URLSearchParams(location.search).get('q');
      if (q) {
        input.value = q;
        search(q);
      } else {
        renderList();
      }
    })
    .catch(function () {
      list.innerHTML = '<li class="empty">Could not load testing locations.</li>';
    });
})();
