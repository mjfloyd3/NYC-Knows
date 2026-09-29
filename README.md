# NYC Knows

**Live site: https://mjfloyd3.github.io/NYC-Knows/**

NYC Knows helps New Yorkers find free, walk-in HIV testing near them, and puts the city's HIV data in context with interactive charts and maps.

## What it does

- **Find a testing site.** Search by zip code, neighborhood or address, or use your current location. The map and list show the nearest clinics with distance, today's hours, tap-to-call phone numbers and directions.
- **Explore the data.** Interactive D3 charts cover 40 years of HIV/AIDS in New York City: a neighborhood prevalence map, trends from 1981 to 2022, and a comparison of each racial/ethnic group's share of the population against its share of new diagnoses.
- **Learn more.** A curated grid of community resources, archives and history.

The site works on phones and desktops, supports touch as well as mouse interactions on the charts, and includes data tables and text alternatives for screen readers.

## How it's built

| Area | Tools |
| --- | --- |
| Front end | HTML, CSS, JavaScript (no build step), Bootstrap 5 |
| Maps | Leaflet with OpenStreetMap tiles |
| Charts | D3.js v7 |
| Search | NYC Planning's GeoSearch API, plus bundled zip code and neighborhood lookups |
| Data pipeline | Python script that pulls the latest figures from NYC Open Data |
| Hosting | GitHub Pages |

## Data sources

- **Statistics:** [NYC Department of Health HIV/AIDS Annual Report](https://data.cityofnewyork.us/d/fju2-rdad) on NYC Open Data (2011–2022), with historical 1981–2015 figures from earlier Health Department surveillance data.
- **Testing locations:** NYC Open Data, 2017 snapshot. The site asks visitors to call ahead and links to the city's [NYC Health Map](https://a816-health.nyc.gov/nychealthmap) for the current list.
- **Boundaries:** NYC Health Department UHF neighborhoods and NYC Open Data zip code areas.

NYC Knows is for general information, not medical advice.
