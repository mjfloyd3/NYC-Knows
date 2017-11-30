(function() { document.addEventListener("DOMContentLoaded", function() {
var hoodsLayer;

  function highlightFeature(e){
    var layer = e.target;
    layer.setStyle(
      {
      opacity: 1,
      weight: 4,
      color: 'slategrey',
    }
    )
    mapInfo.update(layer.feature.properties);
  };
  function resetHighlight(e){
    hoodsLayer.resetStyle(e.target);
    mapInfo.update();
  }

  function zoomToFeature(e){
    intMap.fitBounds(e.target.getBounds());
  }

  function hoodsOnEachFeature(feature, layer){
    layer.on(
      {
        mouseover : highlightFeature,
        mouseout : resetHighlight,
        click : zoomToFeature
      }
    );
  }


  function getHoodColor(PLWHA_UHF_PLWHA){
    if(PLWHA_UHF_PLWHA > 5500){
      return '#581845';
    }else if(PLWHA_UHF_PLWHA < 5499 && PLWHA_UHF_PLWHA > 3000){
      return '#900c3f';
    }else if (PLWHA_UHF_PLWHA < 3999 && PLWHA_UHF_PLWHA > 2200){
      return '#c70039';
    }else if (PLWHA_UHF_PLWHA < 2199 && PLWHA_UHF_PLWHA > 800){
      return '#ff5733';
    }else if (PLWHA_UHF_PLWHA < 800 && PLWHA_UHF_PLWHA > 1){
      return '#ffc30f'
    }else {
      return 'darkgrey';
    }
  }


function hoodsStyle(feature){
  return {
    fillColor: getHoodColor(feature.properties.PLWHA_UHF_PLWHA),
    weight: .7,
    opacity: 1,
    color: 'white',
    fillOpacity: 0.7
  }
}


var intMap=L.map('intMap').setView([40.730610, -73.935242], 8);
var hoodsLayer = L.geoJSON(
  hoods,
  {
    style : hoodsStyle,
    onEachFeature : hoodsOnEachFeature
  }
).addTo(intMap);
intMap.fitBounds(hoodsLayer.getBounds());



var mapInfo = L.control();
mapInfo.onAdd = function (intMap) {
  this._div = L.DomUtil.create('div', 'mapInfo');
  this.update();
  return this._div;
};

// Edit info box text and variables (such as props.density2010) to match those in your GeoJSON data
mapInfo.update = function (props) {
  this._div.innerHTML = '<b>People living with HIV/AIDS <br />by UHF Boundaries</b><br />' +  (props ?
    '<b>' + props.UHF_NEIGH + ' '+'</b>' + '(' + props.BOROUGH + ')' + '<br />' + props.PLWHA_UHF_PLWHA + ' (' + props.PLWHA_UHF_Percent + '% of population)'
    : 'Hover over a Neighborhood');
};
mapInfo.addTo(intMap);
})
})();
