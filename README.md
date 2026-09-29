# NYC Knows

"NYC Knows" is a website that allows the user to search nearby free, open, walk-in HIV/STI testing clinics in New York City. The website is supplemented with various HIV statistics specific to New York for educational purposes.

## Pages

- **index.html**: landing page
- **locationsearch.html**: search by zip code, neighborhood or address (or "Near me") to find the closest testing sites
- **data.html**: interactive charts and a neighborhood map of HIV/AIDS in NYC
- **grid.html**: community resources, archives and history

## Languages & Tools

- [Leaflet](https://leafletjs.com/) with [OpenStreetMap](https://www.openstreetmap.org/) tiles for both maps
- [NYC GeoSearch](https://geosearch.planninglabs.nyc/) for address search (free, no API key)
- [D3.js v7](https://d3js.org/) for the charts
- [Bootstrap 5](https://getbootstrap.com/) for the navigation, [Materialize](https://materializecss.com/) for the landing page parallax

It's a plain static site with no build step. Libraries load from the jsDelivr CDN.

## Styles

- `css/common.css`: nav, site-wide defaults and footer (every page)
- `css/home.css`, `css/data.css`, `css/grid.css`, `css/locationsearch.css`: one file per page
- `css/materialize-base.css`: the few Materialize rules the homepage still relies on (layout helpers, type scale, parallax containers), extracted from the full library. `js/parallax.js` replaces Materialize's parallax script.

## Running locally

The pages load data with `fetch`, so they need to be served over HTTP (opening the files directly won't work):

```sh
npm start
# or
python3 -m http.server
```

## Deployment

Any static host works. For GitHub Pages: repo **Settings → Pages → Deploy from a branch → `master` / root**.

## Data

| File | What it is | Source |
| --- | --- | --- |
| `data/citywide.csv` | HIV/AIDS diagnoses, deaths and viral suppression, 2011 onward | [NYC DOHMH HIV/AIDS Annual Report](https://data.cityofnewyork.us/d/fju2-rdad) |
| `data/borough.csv`, `data/gender.csv`, `data/race.csv` | Latest-year breakdowns | Same |
| `data/uhf.geojson` | Neighborhood boundaries with latest-year prevalence and diagnoses | Same, joined to the DOHMH UHF 42 boundaries |
| `data/history-1981-2015.csv` | AIDS diagnoses and deaths, 1981 - 2015 | NYC DOHMH surveillance data, compiled in 2017 |
| `data/living.csv` | People living with HIV/AIDS, 1981 - 2015 | Same |
| `data/sites.json` | Testing locations shown on the map | NYC Open Data HIV Testing Locations (2017 snapshot) |
| `data/zip-centroids.json` | Center point of each NYC zip code, used for zip search | Built from NYC Open Data [MODZCTA](https://data.cityofnewyork.us/d/pri4-ifjk) |
| `data/neighborhoods.json` | Center point of each neighborhood, used for neighborhood search | Built from `source-data/Neighborhood Tabulation Areas.geojson` |

### Updating the statistics

The city publishes a new year of data in the annual report dataset. To pull it in:

```sh
python3 scripts/update-data.py
```

This rewrites the files from the annual report and uses whatever the latest year is. The Highlights text in `data.html` is written by hand, so update those numbers too.

`source-data/` holds the original downloads (shapefiles, raw CSVs) that the files above were built from.

The testing site details date from 2017 and may be out of date. The live [NYC Open Data dataset](https://data.cityofnewyork.us/d/72ss-25qh) no longer publishes street addresses or coordinates, so the site keeps the older snapshot and points people to the city's [NYC Health Map](https://a816-health.nyc.gov/nychealthmap) for the latest list.
