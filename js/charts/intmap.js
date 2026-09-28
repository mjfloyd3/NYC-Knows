(function () {
  'use strict';

  var isTouch = window.matchMedia('(hover: none)').matches;

  // Buckets of HIV prevalence (% of residents living with diagnosed HIV), darkest first
  var BUCKETS = [
    { min: 2.5, color: '#581845', label: '2.5% +' },
    { min: 1.5, color: '#900c3f', label: '1.5 - 2.4%' },
    { min: 1.0, color: '#c70039', label: '1.0 - 1.4%' },
    { min: 0.5, color: '#ff5733', label: '0.5 - 0.9%' },
    { min: 0, color: '#ffc30f', label: 'under 0.5%' }
  ];

  function getHoodColor(prevalence) {
    if (prevalence == null) return 'darkgrey';
    for (var i = 0; i < BUCKETS.length; i++) {
      if (prevalence >= BUCKETS[i].min) return BUCKETS[i].color;
    }
    return 'darkgrey';
  }

  function hoodsStyle(feature) {
    return {
      fillColor: getHoodColor(feature.properties.prevalence),
      weight: 0.7,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  }

  var intMap = L.map('intMap', {
    // On phones, one finger scrolls the page rather than dragging the map
    dragging: !isTouch,
    scrollWheelZoom: false,
    zoomSnap: 0.25
  });

  var selected = null;

  function highlight(layer) {
    if (selected && selected !== layer) hoodsLayer.resetStyle(selected);
    selected = layer;
    layer.setStyle({ opacity: 1, weight: 4, color: 'slategrey' });
    layer.bringToFront();
    mapInfo.update(layer.feature.properties);
  }

  function reset(layer) {
    hoodsLayer.resetStyle(layer);
    if (selected === layer) selected = null;
    mapInfo.update();
  }

  var hoodsLayer = L.geoJSON(null, {
    style: hoodsStyle,
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseover: function (e) { if (!isTouch) highlight(e.target); },
        mouseout: function (e) { if (!isTouch) reset(e.target); },
        click: function (e) {
          highlight(e.target);
          if (!isTouch) intMap.fitBounds(e.target.getBounds());
        }
      });
    }
  }).addTo(intMap);

  function fitCity() {
    intMap.fitBounds(hoodsLayer.getBounds(), { padding: [10, 10], animate: false });
  }
  intMap.setView([40.7, -73.94], 10);

  fetch('data/uhf.geojson')
    .then(function (res) { return res.json(); })
    .then(function (hoods) {
      hoodsLayer.addData(hoods);
      fitCity();
      new ResizeObserver(function () { intMap.invalidateSize(); fitCity(); })
        .observe(document.getElementById('intMap'));
    });

  var mapInfo = L.control();
  mapInfo.onAdd = function () {
    this._div = L.DomUtil.create('div', 'mapInfo');
    this.update();
    return this._div;
  };
  mapInfo.update = function (props) {
    if (props && !props.UHF_NEIGH) props = { UHF_NEIGH: 'No data', BOROUGH: 'parks & airports', prevalence: null };
    this._div.innerHTML = '<b>HIV prevalence, 2022</b><br>' + (props ?
      '<b>' + props.UHF_NEIGH.replace(/\s+/g, ' ') + ' </b>(' + props.BOROUGH + ')<br>' +
        (props.prevalence == null ? '' :
          props.prevalence + '% of residents living with HIV<br>' +
          NYCCharts.format(props.hiv_diagnoses) + ' new diagnoses') :
      (isTouch ? 'Tap a neighborhood' : 'Hover over a neighborhood'));
  };
  mapInfo.addTo(intMap);

  var legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function () {
    var div = L.DomUtil.create('div', 'mapInfo mapLegend');
    div.innerHTML = BUCKETS.map(function (b) {
      return '<span><i style="background:' + b.color + '"></i>' + b.label + '</span>';
    }).join('');
    return div;
  };
  legend.addTo(intMap);
})();
