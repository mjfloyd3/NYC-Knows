#!/usr/bin/env python3
"""Refresh the data page's chart files from NYC Open Data.

Source: DOHMH HIV/AIDS Annual Report, https://data.cityofnewyork.us/d/fju2-rdad

Run from the repo root:  python3 scripts/update-data.py
It uses the latest year in the dataset, so rerun it when the city publishes a new year.
"""
import csv
import json
import re
import urllib.parse
import urllib.request

DATASET = 'https://data.cityofnewyork.us/resource/fju2-rdad.json'
DIMENSIONS = ['borough', 'uhf', 'gender', 'age', 'race']


def fetch(where):
    query = urllib.parse.urlencode({'$where': where, '$limit': 50000})
    with urllib.request.urlopen(DATASET + '?' + query, timeout=60) as res:
        return json.load(res)


def totals(rows, **filters):
    """Rows where every dimension is 'All' except the ones given."""
    return [r for r in rows if all(r.get(d) == filters.get(d, 'All') for d in DIMENSIONS)]


def num(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def percent(value):
    """Viral suppression is stored as 71 in older years and 0.84 in newer ones."""
    v = num(value)
    if v is None:
        return None
    return round(v * 100 if v <= 1 else v)


# Map file name -> dataset name, where they differ beyond spacing
UHF_ALIASES = {'Downtown - Heights - Slope': 'Downtown - Heights - Park Slope'}


def squash(name):
    name = re.sub(r'\s+', ' ', name or '').strip()
    return UHF_ALIASES.get(name, name)


def main():
    citywide = totals(fetch("borough='All' AND uhf='All' AND gender='All' AND age='All' AND race='All'"))
    citywide.sort(key=lambda r: int(r['year']))
    latest = citywide[-1]['year']
    print('Latest year in dataset:', latest)

    with open('data/citywide.csv', 'w', newline='') as f:
        w = csv.writer(f, lineterminator='\n')
        w.writerow(['year', 'hiv_diagnoses', 'aids_diagnoses', 'deaths', 'viral_suppression'])
        for r in citywide:
            w.writerow([r['year'], r['hiv_diagnoses'], r['aids_diagnoses'], r['deaths'], percent(r['viral_suppression'])])

    rows = fetch("year='%s'" % latest)

    # Boroughs
    boroughs = [r for r in rows if r['borough'] != 'All' and r['uhf'] == 'All'
                and r['gender'] == 'All' and r['age'] == 'All' and r['race'] == 'All']
    with open('data/borough.csv', 'w', newline='') as f:
        w = csv.writer(f, lineterminator='\n')
        w.writerow(['borough', 'prevalence', 'hiv_diagnoses'])
        for r in sorted(boroughs, key=lambda r: r['borough']):
            w.writerow([r['borough'], r['plwdhi_prevalence'], r['hiv_diagnoses']])

    # Gender
    with open('data/gender.csv', 'w', newline='') as f:
        w = csv.writer(f, lineterminator='\n')
        w.writerow(['gender', 'hiv_diagnoses', 'hiv_diagnosis_rate'])
        for r in totals(rows, gender='Men') + totals(rows, gender='Women'):
            w.writerow([r['gender'], r['hiv_diagnoses'], r['hiv_diagnosis_rate']])

    # Race: share of new diagnoses vs share of the population. The dataset has no population
    # column, but diagnoses / rate per 100k gives the population the city used (ages 13+).
    races = [r for r in rows if r['race'] != 'All' and r['borough'] == 'All' and r['uhf'] == 'All'
             and r['gender'] == 'All' and r['age'] == 'All']
    dx_total = sum(num(r['hiv_diagnoses']) for r in races)
    pops = {r['race']: num(r['hiv_diagnoses']) / num(r['hiv_diagnosis_rate']) * 1e5 for r in races}
    pop_total = sum(pops.values())
    city = totals(rows)[0]
    with open('data/race.csv', 'w', newline='') as f:
        w = csv.writer(f, lineterminator='\n')
        w.writerow(['race', 'hiv_diagnoses', 'diagnosis_share', 'population', 'population_share', 'diagnosis_rate'])
        for r in sorted(races, key=lambda r: -num(r['hiv_diagnoses'])):
            w.writerow([r['race'], r['hiv_diagnoses'],
                        round(100 * num(r['hiv_diagnoses']) / dx_total, 1),
                        int(round(pops[r['race']], -3)),
                        round(100 * pops[r['race']] / pop_total, 1),
                        r['hiv_diagnosis_rate']])
        # Citywide row, used for the average line in the rate view
        w.writerow(['All', city['hiv_diagnoses'], 100, int(round(pop_total, -3)), 100, city['hiv_diagnosis_rate']])

    # Neighborhoods: write the latest numbers into the map's GeoJSON
    uhf = {squash(r['uhf']): r for r in rows if r['uhf'] != 'All' and r['gender'] == 'All'
           and r['age'] == 'All' and r['race'] == 'All'}
    geo = json.load(open('data/uhf.geojson'))
    matched = 0
    for feature in geo['features']:
        p = feature['properties']
        r = uhf.get(squash(p.get('UHF_NEIGH')))
        p['year'] = latest
        p['prevalence'] = num(r['plwdhi_prevalence']) if r else None
        p['hiv_diagnoses'] = int(num(r['hiv_diagnoses'])) if r and r['hiv_diagnoses'] else None
        for old in ('PLWHA_UHF_PLWHA', 'PLWHA_UHF_Percent'):
            p.pop(old, None)
        matched += bool(r)
    json.dump(geo, open('data/uhf.geojson', 'w'), separators=(',', ':'))
    print('Matched %d of %d neighborhoods' % (matched, len(uhf)))



if __name__ == '__main__':
    main()
