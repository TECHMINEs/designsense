#!/usr/bin/env python3
"""Build the D.S. Design Sense LLP website.

Page bodies live in src/pages/*.html (and src/pages/work/*.html). Each starts
with a small header comment:

    <!--
    title: About
    description: One sentence for search results.
    nav: about
    sheet: A-02
    -->

This script wraps every body in the shared chrome (banner, menus, footer and
scripts), expands the {{ ... }} blocks listed below, fixes relative paths for
pages inside work/, adds image sizes and srcsets, writes the result to
Website/, and then checks links, anchors and banned words.

    {{projects all}}         every client project, filterable by sector
    {{projects <slug>}}      the projects of one sector
    {{sectors}}              the nine sector cards
    {{clients}}              a marquee of client and project names

The nine sector pages (work/<slug>.html) are generated from SECTORS below.

Run:  python3 build.py
"""
from __future__ import annotations

import json
import re
import sys
from html import escape
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / 'src' / 'pages'
OUT = HERE / 'Website'

SITE = {
    'name': 'D.S. Design Sense LLP',
    'tagline': 'Architects | Interior Designers | Project Managers',
    'phone': '+91 129 419 9722',
    'phone_href': 'tel:+911294199722',
    'email': 'info@designsense.co.in',
    'address': ['D.S. Towers, 1st Floor', '11/7 Mile Stone, Delhi–Mathura Road', 'Faridabad 121003, Haryana, India'],
}

NAV = [
    ('index', 'Home', 'index.html'),
    ('about', 'About', 'about.html'),
    ('services', 'Services', 'services.html'),
    ('speciality', 'Speciality', 'speciality.html'),
    ('portfolio', 'Portfolio', 'portfolio.html'),
    ('explore', 'Explore 3D', 'explore.html'),
    ('contact', 'Contact', 'contact.html'),
]

# ---------------------------------------------------------------------------
# The nine sectors and every project the firm lists on its own website.
# Wording follows the firm's published project notes, lightly edited.
# ---------------------------------------------------------------------------
SECTORS = [
    dict(slug='residential-interiors', no='01', name='Residential interiors', short='Interiors',
         line='Rooms that carry a clear sense of purpose and belonging.',
         intro='Total interiors for family homes: drawing rooms, family lounges, kitchens, bedrooms and puja rooms, usually with several options for each room so a family can compare and choose.',
         consider=['Space planning around how the family lives', 'False ceilings, lighting and wall panelling', 'Furniture, upholstery and soft furnishings', 'Marble, wooden flooring and tiles'],
         images=[('drawing-room-jali.jpg', 'Drawing room with a teak-framed arch and herringbone panel, 3D concept'),
                 ('living-tufted-wide.jpg', 'Family lounge with tufted sofas under a timber-slat ceiling, 3D concept'),
                 ('dining-classic.jpg', 'Classic dining room with a crystal chandelier, 3D concept'),
                 ('bedroom-warm.jpg', 'Warm-toned bedroom with a cove-lit false ceiling, 3D concept')]),
    dict(slug='residential-architecture', no='02', name='Residential architecture', short='Architecture',
         line='Homes shaped by setting, light and everyday life.',
         intro='Independent homes and farmhouses designed from the plot up: site and Vaastu planning, floor plans for every level, elevations with every material called out, 3D views and working drawings.',
         consider=['Site, boundary and Vaastu-led planning', 'Floor plans with furniture laid out', 'Elevations with materials called out', '3D views from the front, side and corner'],
         images=[('residence-corner.jpg', 'Private Residence, corner view render'),
                 ('residence-front.jpg', 'Private Residence, front view render'),
                 ('villa-exterior-evening.jpg', 'A completed white residence in the late afternoon'),
                 ('villa-exterior-day.jpg', 'A completed white villa with black slatted gates')]),
    dict(slug='housing', no='03', name='Housing & residential', short='Housing',
         line='Considered planning for places shared by many households.',
         intro='Group housing and family residences across India and in the UK, from layouts and shared amenities to new elevations for existing sites.',
         consider=['Housing layouts and unit planning', 'Shared amenities and circulation', 'New elevations for existing buildings', 'Coordination with consultants on site'],
         images=[('residence-side.jpg', 'Side view render of a residence by the studio')]),
    dict(slug='retail-clinics', no='04', name='Showrooms & clinics', short='Showrooms',
         line='Clear, welcoming spaces for customers and visitors.',
         intro='Showrooms and clinics planned around the customer: how people arrive, browse and pause, with lighting that sells the product and finishes that last.',
         consider=['Customer journeys and display', 'Lighting focused on the product', 'Glass and mirror to open up the space', 'Durable, easy-care finishes'],
         images=[]),
    dict(slug='institutional', no='05', name='Institutional', short='Institutional',
         line='Durable, legible environments for learning and public use.',
         intro='Schools, colleges and technical institutes: buildings that are easy to find your way around, hard-wearing and pleasant to spend a working day in.',
         consider=['Campus and building planning', 'Wayfinding and circulation', 'Hard-wearing material strategy', 'Phased delivery on live sites'],
         images=[]),
    dict(slug='commercial', no='06', name='Commercial', short='Commercial',
         line='Workable buildings and interiors for changing businesses.',
         intro='Towers, business parks, a cineplex and restaurant interiors: commercial buildings that work for owners, tenants and visitors alike.',
         consider=['Commercial planning and frontage', 'Building design and elevations', 'Tenant and visitor circulation', 'Delivery coordination'],
         images=[]),
    dict(slug='hospitality', no='07', name='Hotels & resorts', short='Hotels',
         line='Memorable guest experiences grounded in practical operations.',
         intro='Hotels and resorts where every room can have its own character, without losing sight of how housekeeping, service and maintenance run day to day.',
         consider=['Guest experience and arrival', 'Room and suite planning', 'Interior identity for each room type', 'Joinery that hides the technology'],
         images=[]),
    dict(slug='workplaces', no='08', name='Offices & call centres', short='Offices',
         line='Focused, flexible settings for teams and organisations.',
         intro='Company offices and call centres planned around the work: clear zones, lighting where it is needed and modular systems that can change with the team.',
         consider=['Office planning and zoning', 'Selective, task-focused lighting', 'Modular workstations and storage', 'A colour accent to lift the mood'],
         images=[]),
    dict(slug='culture-expo', no='09', name='Religious, cultural & expo', short='Culture & expo',
         line='Spaces that give people a reason to gather and explore.',
         intro='Temples, a mandir and exhibition stands: places built for gatherings, ceremony and display, where proportion and craft matter.',
         consider=['Visitor flow and gathering spaces', 'Proportion and traditional detail', 'Exhibition stands built to travel', 'Craft and material expression'],
         images=[]),
]

ON_REQUEST = 'Project notes are available on request.'

PROJECTS = [
    # Residential interiors
    dict(sector='residential-interiors', name='Kukreja Residence', client='Mr. M.K. Kukreja', place='Sector 19, Faridabad',
         brief='Uncluttered spaces, classical forms and warm colours: three bedrooms, a living-cum-dining area, a large drawing room, an entrance lobby and a kitchen.',
         concept='An impressive teak entrance door leads into a lobby with classical touches in its white-lit false ceiling. Classical forms and designer furniture make a sophisticated home.',
         usp=['Furniture with classical touches under an elliptical false ceiling with a central dome', 'Walls articulated with niches that hold glass paintings']),
    dict(sector='residential-interiors', name='Loyalka Residence', client='Mr. S.K. Loyalka', place='Rajpura Road, Delhi',
         brief='Two identical units on the ground and first floors. Each has a drawing room, a spacious family lounge, a big airy kitchen and three bedrooms with attached dress and toilet, plus a terrace swimming pool.',
         concept='A timeless yet contemporary home for the client and his young family. Uniformity and proportion run through every room, balanced with originality, function and aesthetics, in an eco-friendly environment.'),
    dict(sector='residential-interiors', name='Gupta Residence', client='Mr. Vinod Gupta', place='Charmwood Village, Eros Garden'),
    dict(sector='residential-interiors', name='Kishore Residence', client='Mr. Jagat Kishore', place='Varanasi'),
    dict(sector='residential-interiors', name='Jain Residence', client='Mr. Neeraj Jain', place=''),
    # Residential architecture
    dict(sector='residential-architecture', name='Private Residence', client='Private client', place='Faridabad, Haryana',
         brief='A family home on three levels with a lift, a double-height lobby, a home theatre, a jacuzzi bath, a puja room and gardens on two levels.',
         concept='White Statuario marble frames, Gold Teak HPL bands and full-height glass, drawn in full by the studio from the street elevation to the furniture in every room.',
         link=('work/private-residence.html', 'Read the case study')),
    dict(sector='residential-architecture', name='Pranav Farmhouse', client='', place='Gurgaon'),
    dict(sector='residential-architecture', name='Residential design', client='', place=''),
    # Housing & residential
    dict(sector='housing', name='Shristi Group Housing', client='', place='Jaipur'),
    dict(sector='housing', name='BG Housing', client='', place='Sohna, Gurgaon'),
    dict(sector='housing', name='Solanki Residence', client='Mr. Dhirender Solanki', place='Bulandshahr, Uttar Pradesh'),
    dict(sector='housing', name='Giri Residence', client='Mr. Mithlesh Giri', place='Sector 1, IMT Manesar, Gurgaon'),
    dict(sector='housing', name='Batra Residence', client='Mr. R.K. Batra', place='Sector 37, Faridabad'),
    dict(sector='housing', name='Residence in Coventry', client='Mr. Rakesh (Bobby)', place='Poppy Field Court, Coventry, UK'),
    dict(sector='housing', name='New elevation design', client='', place='Bhopal'),
    # Showrooms & clinics
    dict(sector='retail-clinics', name='G.P. Saree Showroom', client='', place='Chandni Chowk, Delhi',
         brief='A two-storey showroom of 3,000 sq ft on the ground and second floors.',
         concept='A showroom of pure lines, where lighting was everything: it had to show off the saree collection. Low-height furniture pairs form with superior finishes, tempting today and timeless tomorrow.',
         usp=['Unique, eye-catching colour schemes', 'A false ceiling that adds depth to the interior', 'Glass and mirror to make the space feel larger']),
    dict(sector='retail-clinics', name='Wood Packer Showroom', client='', place='Delhi',
         brief='A showroom for formal and casual garments, with simple, straight display racks in vibrant colours and lighting that highlights the collection.',
         concept='From the entrance, a glass door gives a view of the whole showroom, and the full height of the room is used for display.'),
    dict(sector='retail-clinics', name="Dr Gangwani's Clinic", client='', place='Paschim Vihar, Delhi'),
    dict(sector='retail-clinics', name='Liberty Shoe Showroom', client='', place='Agra'),
    # Institutional
    dict(sector='institutional', name='Greater Noida Public School', client='', place='Sector 37, Greater Noida'),
    dict(sector='institutional', name='Vivekananda College', client='', place='Sohna, Gurgaon'),
    dict(sector='institutional', name='Vishvkarma Technical & Management Institute', client='', place='Kot, Faridabad'),
    # Commercial
    dict(sector='commercial', name='Varun Towers', client='', place='NH-2, Delhi NCR'),
    dict(sector='commercial', name='Moon Cineplex', client='', place='Khurja, Uttar Pradesh'),
    dict(sector='commercial', name='Business Park', client='', place='NH-2, Faridabad'),
    dict(sector='commercial', name='Amazone Regalia', client='', place=''),
    dict(sector='commercial', name='Restaurant interior', client='', place=''),
    # Hotels & resorts
    dict(sector='hospitality', name='Meradan Grand', client='', place='Varanasi · 128 rooms',
         brief='A 128-room hotel of rooms and suites, with every luxurious bedroom designed in its own style and theme.',
         concept='Curved, sand-blasted tempered-glass doors separate the executive suites from reception. A Jacobean four-poster bed dressed in Egyptian linen sits beside cabinetry that hides the minibar, espresso machine, TV and hi-fi.'),
    dict(sector='hospitality', name='Four Season Hotel', client='', place='Faiz Road, Karol Bagh, Delhi'),
    dict(sector='hospitality', name='Lav Laxmi Resorts', client='', place='Haridwar · 2 acres, 28 rooms'),
    # Offices & call centres
    dict(sector='workplaces', name='Engineering company office', client='', place='Faridabad',
         brief='A two-storey office of 4,000 sq ft on the ground and first floors.',
         concept='Straight-line forms and wood tones, with a dash of turquoise to spread positivity. Lighting is focused on the work zones, and dramatically lit niches break up the plain walls.'),
    dict(sector='workplaces', name='WHAI EXIM Pvt Ltd', client='', place='Sector 5, IMT Manesar, Gurgaon'),
    dict(sector='workplaces', name='Delhi Call Centre', client='', place='Pusa Road, New Delhi'),
    # Religious, cultural & expo
    dict(sector='culture-expo', name='Shri Lal Bawa Ji Maharaj Temple', client='', place='Vrindavan'),
    dict(sector='culture-expo', name='Tilpat Sai Mandir', client='', place='Faridabad'),
    dict(sector='culture-expo', name='Ultimate mats exhibition stall', client='', place='Bangalore'),
]

PHOTO_SLUG = {
    'Kukreja Residence': 'kukreja', 'Loyalka Residence': 'loyalka', 'Gupta Residence': 'gupta', 'Kishore Residence': 'kishore',
    'Jain Residence': 'jain', 'Pranav Farmhouse': 'pranav-farmhouse', 'Residential design': 'residential-design',
    'Shristi Group Housing': 'shristi', 'BG Housing': 'bg-housing', 'Solanki Residence': 'solanki', 'Giri Residence': 'giri',
    'Batra Residence': 'batra', 'Residence in Coventry': 'coventry', 'New elevation design': 'bhopal',
    'G.P. Saree Showroom': 'gp-saree', 'Wood Packer Showroom': 'wood-packer', "Dr Gangwani's Clinic": 'gangwani',
    'Liberty Shoe Showroom': 'liberty', 'Greater Noida Public School': 'gnps', 'Vivekananda College': 'vivekananda',
    'Vishvkarma Technical & Management Institute': 'vishvkarma', 'Varun Towers': 'varun-towers', 'Moon Cineplex': 'moon-cineplex',
    'Business Park': 'business-park', 'Amazone Regalia': 'amazone-regalia', 'Restaurant interior': 'restaurant',
    'Meradan Grand': 'meradan', 'Four Season Hotel': 'four-season', 'Lav Laxmi Resorts': 'lav-laxmi',
    'Engineering company office': 'engineering-office', 'WHAI EXIM Pvt Ltd': 'whai-exim', 'Delhi Call Centre': 'delhi-call-centre',
    'Shri Lal Bawa Ji Maharaj Temple': 'lal-bawa-ji', 'Tilpat Sai Mandir': 'tilpat', 'Ultimate mats exhibition stall': 'ultimate-mats',
}
_CLIENT_PHOTOS = json.loads((HERE / 'src' / 'clients.json').read_text())
for _p in PROJECTS:
    _slug = PHOTO_SLUG.get(_p['name'])
    _p['photos'] = [f'clients/{n}.jpg' for n, _w, _h in _CLIENT_PHOTOS.get(_slug, [])] if _slug else []
    if _p['name'] == 'Private Residence':
        _p['photos'] = ['residence-corner.jpg', 'residence-front.jpg', 'residence-side.jpg', 'residence-elevation.jpg',
                        'drawing-room-jali.jpg', 'lobby-double-height.jpg', 'dining-classic.jpg', 'bedroom-warm.jpg']

SECTOR_BY_SLUG = {s['slug']: s for s in SECTORS}
for s in SECTORS:
    s['projects'] = [p for p in PROJECTS if p['sector'] == s['slug']]

# Words that must never appear on the site. The list lives in src/banned.txt,
# which is kept out of the repository; without it this check is skipped.
_BANNED_FILE = HERE / 'src' / 'banned.txt'
BANNED = [w.strip().lower() for w in _BANNED_FILE.read_text().splitlines() if w.strip()] if _BANNED_FILE.exists() else []

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
ARROW = '<svg class="arr" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 5h16M12 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>'


def e(text: str) -> str:
    return escape(text, quote=True)


def image_size(path: Path):
    try:
        from PIL import Image
        with Image.open(path) as im:
            return im.size
    except Exception:
        return None


def project_card(p: dict, show_sector: bool) -> str:
    """A client feature: the firm's notes on one side, a photo gallery on the other."""
    s = SECTOR_BY_SLUG[p['sector']]
    has_notes = bool(p.get('brief') or p.get('concept'))
    meta = []
    if p.get('client'):
        meta.append(f'<span><b>Client</b>{e(p["client"])}</span>')
    if p.get('place'):
        meta.append(f'<span><b>Location</b>{e(p["place"])}</span>')
    if show_sector:
        meta.append(f'<span><b>Sector</b><a href="work/{s["slug"]}.html">{e(s["name"])}</a></span>')
    body = []
    if p.get('brief'):
        body.append(f'<div class="pn-block"><h4>Project brief</h4><p>{e(p["brief"])}</p></div>')
    if p.get('concept'):
        body.append(f'<div class="pn-block"><h4>Concept</h4><p>{e(p["concept"])}</p></div>')
    if p.get('usp'):
        items = ''.join(f'<li>{e(u)}</li>' for u in p['usp'])
        body.append(f'<div class="pn-block"><h4>Highlights</h4><ul class="ticks">{items}</ul></div>')
    if not has_notes:
        body.append(f'<p class="pn-req">{ON_REQUEST}</p>')
    if p.get('link'):
        href, label = p['link']
        body.append(f'<a class="link-line" href="{href}">{e(label)} {ARROW}</a>')
    photos = p.get('photos') or []
    gallery = ''
    if photos:
        alt = f'{p["name"]}, {s["name"].lower()} by D.S. Design Sense'
        thumbs = ''.join(
            f'<button type="button" class="pf-thumb{" on" if k == 0 else ""}" data-full="assets/{ph}" aria-label="Show photo {k + 1} of {len(photos)}">'
            f'<img src="assets/{ph}" alt=""></button>' for k, ph in enumerate(photos))
        gallery = (f'<div class="pf-gallery" data-cgal data-title="{e(p["name"])}">'
                   f'<button type="button" class="pf-main" aria-label="Enlarge photo of {e(p["name"])}" data-cursor="View">'
                   f'<img src="assets/{photos[0]}" alt="{e(alt)}"><span class="pf-count">01 / {len(photos):02d}</span></button>'
                   f'<div class="pf-thumbs">{thumbs}</div></div>')
    cls = 'pfeature' + ('' if photos else ' no-photos')
    return (f'<article class="{cls}" data-sector="{s["slug"]}">'
            f'<div class="pf-text"><header><span class="pn-no mono">{s["no"]} · {e(s["short"])}</span><h3>{e(p["name"])}</h3>'
            f'<div class="pn-meta">{"".join(meta)}</div></header>{"".join(body)}</div>{gallery}</article>')


def block_projects(arg: str) -> str:
    if arg == 'all':
        chips = ['<button class="chip" type="button" data-pfilter="all" aria-pressed="true">All<span class="count">%d</span></button>' % len(PROJECTS)]
        for s in SECTORS:
            chips.append(f'<button class="chip" type="button" data-pfilter="{s["slug"]}" aria-pressed="false">{e(s["short"])}<span class="count">{len(s["projects"])}</span></button>')
        cards = ''.join(project_card(p, True) for p in PROJECTS)
        return f'<div class="pfilters" role="group" aria-label="Filter projects by sector">{"".join(chips)}</div><div class="pfeatures" data-pnotes>{cards}</div>'
    s = SECTOR_BY_SLUG[arg]
    return f'<div class="pfeatures">{"".join(project_card(p, False) for p in s["projects"])}</div>'


def block_sectors(_arg: str) -> str:
    out = []
    for s in SECTORS:
        n = len(s['projects'])
        img = s['images'][0][0] if s['images'] else ''
        visual = f'<img src="assets/{img}" alt="">' if img else '<span class="sc-sketch" aria-hidden="true"></span>'
        names = ' · '.join(e(p['name']) for p in s['projects'][:3])
        out.append(f'<a class="sector-card" href="work/{s["slug"]}.html"><div class="sc-img">{visual}</div>'
                   f'<div class="sc-body"><span class="mono">{s["no"]} / {n} project{"s" if n != 1 else ""}</span>'
                   f'<h3>{e(s["name"])}</h3><p>{e(s["line"])}</p><small>{names}</small></div></a>')
    return f'<div class="sector-grid">{"".join(out)}</div>'


def block_clients(_arg: str) -> str:
    items = []
    for p in PROJECTS:
        label = p['name']
        items.append(f'<span>{e(label)}</span><i aria-hidden="true"></i>')
    return (f'<div class="marquee clients-marquee" aria-label="Some of the studio\'s clients and projects">'
            f'<div class="marquee-track"><div class="marquee-group">{"".join(items)}</div></div></div>')


BLOCKS = {'projects': block_projects, 'sectors': block_sectors, 'clients': block_clients, 'cta': lambda _a: CTA_DEFAULT}


def expand_blocks(html: str) -> str:
    def sub(m):
        name, _, arg = m.group(1).strip().partition(' ')
        return BLOCKS[name](arg.strip())
    return re.sub(r'\{\{\s*([a-z]+(?: [a-z0-9-]+)?)\s*\}\}', sub, html)


# ---------------------------------------------------------------------------
# Sector pages (generated)
# ---------------------------------------------------------------------------
def sector_page(i: int, s: dict) -> tuple[dict, str]:
    prev_s, next_s = SECTORS[i - 1], SECTORS[(i + 1) % len(SECTORS)]
    consider = ''.join(f'<li>{e(c)}</li>' for c in s['consider'])
    n = len(s['projects'])
    gallery = ''
    if s['images']:
        figs = ''.join(f'<figure class="sp-fig" data-reveal><div class="img-frame"><img src="assets/{img}" alt="{e(alt)}"></div><figcaption class="caption">{e(alt)}</figcaption></figure>' for img, alt in s['images'])
        gallery = f'<section class="section tight"><div class="wrap"><div class="sp-gallery n{len(s["images"])}">{figs}</div></div></section>'
    body = f'''
<section class="page-lead sector-lead">
  <div class="wrap">
    <p class="crumbs"><a href="index.html">Home</a> / <a href="portfolio.html#sectors">Portfolio</a> / Sector {s["no"]}</p>
    <div class="sl-grid">
      <div>
        <span class="label">Sector {s["no"]} · {n} project{"s" if n != 1 else ""}</span>
        <h1 class="display" data-split>{e(s["name"])}.</h1>
        <p class="lead">{e(s["line"])}</p>
      </div>
      <span class="sl-no" aria-hidden="true">{s["no"]}</span>
    </div>
  </div>
</section>
<section class="section sheet">
  <div class="wrap two-col align-start">
    <div>
      <span class="label">What we consider</span>
      <h2 class="h2" data-split>The brief shapes<br>the <em>response</em>.</h2>
    </div>
    <div>
      <p class="lead">{e(s["intro"])}</p>
      <ul class="ticks">{consider}</ul>
      <a class="btn" href="contact.html" data-magnetic>Ask about this sector {ARROW}</a>
    </div>
  </div>
</section>
{gallery}
<section class="section">
  <div class="wrap">
    <div class="sec-head">
      <div><span class="label">Project notes</span><h2 class="h2" data-split>Work in this <em>sector</em>.</h2></div>
      <div class="sheet-no">{n} project{"s" if n != 1 else ""}<br>From the studio's records</div>
    </div>
    {{{{projects {s["slug"]}}}}}
  </div>
</section>
<nav class="section tight sheet sector-nav" aria-label="Other sectors">
  <div class="wrap sn-grid">
    <a href="work/{prev_s["slug"]}.html"><span class="mono">← Sector {prev_s["no"]}</span><strong>{e(prev_s["name"])}</strong></a>
    <a href="portfolio.html#sectors" class="sn-all"><span class="mono">All nine</span><strong>Sectors</strong></a>
    <a href="work/{next_s["slug"]}.html"><span class="mono">Sector {next_s["no"]} →</span><strong>{e(next_s["name"])}</strong></a>
  </div>
</nav>
{CTA_DEFAULT}
'''
    meta = dict(title=s['name'], description=f'{s["name"]} by D.S. Design Sense LLP: {s["line"]}', nav='portfolio', sheet=f'B-{s["no"]}')
    return meta, body


CTA_DEFAULT = '''
<section class="cta-big">
  <div class="wrap">
    <div>
      <span class="label">Start something</span>
      <h2 data-split>Let's make space<br>for what <em>matters</em>.</h2>
      <p>Every project starts with a conversation about people, place and possibility.</p>
      <div class="contacts"><a href="tel:+911294199722">+91 129 419 9722</a><a href="mailto:info@designsense.co.in">info@designsense.co.in</a></div>
    </div>
    <a class="orb" href="contact.html" data-magnetic="0.25" aria-label="Start your project on the contact page">
      <svg class="ring-text" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="ringPath" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0"/></defs><text font-family="Oswald, sans-serif" font-size="13" letter-spacing="5" fill="currentColor"><textPath href="#ringPath">START YOUR PROJECT · START YOUR PROJECT · </textPath></text></svg>
      Start
    </a>
  </div>
</section>
'''


# ---------------------------------------------------------------------------
# The closing call to action: an isometric model of a small house on its plot.
# It tilts with the pointer; on hover the floors lift apart and the lines redraw.
# ---------------------------------------------------------------------------
def _iso(x, y, z, s=9.6, ox=98.0, oy=91.0):
    import math
    c, k = math.cos(math.radians(30)), math.sin(math.radians(30))
    return (ox + (x - z) * c * s, oy - y * s + (x + z) * k * s)


def _pts(points):
    return ' '.join(f'{px:.1f},{py:.1f}' for px, py in (_iso(*p) for p in points))


def _volume(x0, x1, y0, y1, z0, z1, cls=''):
    top = [(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)]
    front = [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    right = [(x1, y0, z0), (x1, y0, z1), (x1, y1, z1), (x1, y1, z0)]
    return ''.join(f'<polygon class="ao-{n} {cls}" pathLength="1" points="{_pts(f)}"/>' for n, f in (('r', right), ('f', front), ('t', top)))


def arch_orb(href: str, label: str, aria: str, extra: str = '') -> str:
    # plot outline and dimension line on the ground plane
    plot = _pts([(-1, 0, -1), (11, 0, -1), (11, 0, 8), (-1, 0, 8)])
    dim_a, dim_b = _iso(-1, 0, 9.4), _iso(11, 0, 9.4)
    base = _volume(0.5, 7.5, 0, 0.5, 0.5, 7, 'ao-plinth')
    l0 = _volume(1, 7, 0.5, 3.4, 1, 6.4)
    door = f'<polygon class="ao-door" points="{_pts([(4, .5, 6.4), (5.1, .5, 6.4), (5.1, 2.7, 6.4), (4, 2.7, 6.4)])}"/>'
    glaz0 = f'<polygon class="ao-glass" points="{_pts([(1.4, .9, 6.4), (3.6, .9, 6.4), (3.6, 3.0, 6.4), (1.4, 3.0, 6.4)])}"/>'
    l1 = _volume(2.6, 9.4, 3.4, 6.3, 0.4, 5.9)
    strip = f'<polygon class="ao-glass" points="{_pts([(3.2, 4.2, 5.9), (8.8, 4.2, 5.9), (8.8, 5.4, 5.9), (3.2, 5.4, 5.9)])}"/>'
    louv = ''.join(f'<line class="ao-line" x1="{_iso(9.4, 3.8, z)[0]:.1f}" y1="{_iso(9.4, 3.8, z)[1]:.1f}" x2="{_iso(9.4, 5.9, z)[0]:.1f}" y2="{_iso(9.4, 5.9, z)[1]:.1f}"/>' for z in (1.2, 2.0, 2.8, 3.6, 4.4, 5.2))
    roof = _volume(2.2, 9.8, 6.3, 6.75, 0, 6.3)
    perg = ''.join(f'<line class="ao-line" x1="{_iso(1, 3.9, z)[0]:.1f}" y1="{_iso(1, 3.9, z)[1]:.1f}" x2="{_iso(2.6, 3.9, z)[0]:.1f}" y2="{_iso(2.6, 3.9, z)[1]:.1f}"/>' for z in (1.4, 2.4, 3.4, 4.4, 5.4, 6.2))
    north = '<g class="ao-north" transform="translate(38 42)"><circle r="11"/><path d="M0 -8 L4 6 L0 3 L-4 6Z"/><text y="-14" text-anchor="middle">N</text></g>'
    svg = (f'<svg class="ao-svg" viewBox="0 0 220 220" aria-hidden="true">'
           f'<circle class="ao-site" cx="110" cy="110" r="104"/>'
           f'<g class="ao-model">'
           f'<polygon class="ao-plot" points="{plot}"/>'
           f'<line class="ao-dim" x1="{dim_a[0]:.1f}" y1="{dim_a[1]:.1f}" x2="{dim_b[0]:.1f}" y2="{dim_b[1]:.1f}"/>'
           f'<g class="ao-g ao-g0">{base}{l0}{glaz0}{door}{perg}</g>'
           f'<g class="ao-g ao-g1">{l1}{strip}{louv}</g>'
           f'<g class="ao-g ao-g2">{roof}</g></g>{north}</svg>')
    return (f'<a class="arch-orb{extra}" href="{href}" aria-label="{e(aria)}" data-cursor="Open">{svg}'
            f'<span class="ao-label"><b>{e(label)}</b><i>{"Plan it floor by floor" if label == "Brief" else "Start your project"} →</i></span></a>')


def replace_orbs(html: str) -> str:
    def sub(m):
        tag = m.group(0)
        href = re.search(r'href="([^"]+)"', tag).group(1)
        aria = re.search(r'aria-label="([^"]+)"', tag)
        label = 'Brief' if 'brief' in href.lower() else 'Start'
        extra = ' arch-orb-light' if 'orb-light' in tag else ''
        return arch_orb(href, label, aria.group(1) if aria else 'Start your project on the contact page', extra)
    return re.sub(r'<a class="orb[" ].*?</a>', sub, html, flags=re.S)


# ---------------------------------------------------------------------------
# Shared chrome
# ---------------------------------------------------------------------------
def mast_drawing() -> str:
    svg = (OUT / 'assets' / 'mast-drawing.svg').read_text()
    # give every stroke its own re-sketch delay, spread over the loop
    def add_delay(m):
        i = int(m.group(1))
        return f'--i:{i};--d:{2 + ((i * 37) % 170) / 10:.1f}s'
    return re.sub(r'--i:(\d+)', add_delay, svg).strip()


def nav_links(current: str, cls: str = '') -> str:
    out = []
    for key, label, href in NAV:
        cur = ' aria-current="page"' if key == current else ''
        out.append(f'<li><a href="{href}" data-nav="{key}"{cur}>{label}</a></li>')
    return ''.join(out)


def head(meta: dict, has_x3d: bool) -> str:
    title = meta['title']
    full_title = SITE['name'] if title == 'Home' else f'{title} | {SITE["name"]}'
    desc = meta.get('description', '')
    x3d_css = '\n<link rel="stylesheet" href="css/x3d.css">' if has_x3d else ''
    return f'''<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(full_title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#7a2e5c">
<meta property="og:title" content="{e(full_title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:image" content="assets/x3d-fallback.jpg">
<link rel="icon" href="assets/favicon.png" type="image/png">
<link rel="icon" href="assets/ds-logo.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400&family=Instrument+Serif:ital@0;1&family=Jost:wght@300;400;500;600&family=Oswald:wght@300;400;500&family=Open+Sans:wght@600;700&display=swap">
<link rel="stylesheet" href="css/site.css">{x3d_css}
</head>'''


def menu_items(current: str) -> str:
    out = []
    for i, (k, l, h) in enumerate(NAV):
        cur = ' aria-current="page"' if k == current else ''
        out.append(f'<li><a href="{h}"{cur}><span>0{i + 1}</span>{l}</a></li>')
    return ''.join(out)


def masthead(current: str) -> str:
    return f'''<header class="masthead">
  <div class="mast-top">
    {mast_drawing()}
    <a class="lockup" href="index.html" aria-label="{SITE["name"]}, home">
      <img class="lockup-logo" src="assets/ds-logo.svg" alt="" width="344" height="262" data-eager>
      <span class="lockup-text"><strong>{SITE["name"]}</strong><span class="tag">Architects <i>|</i> Interior Designers <i>|</i> Project Managers</span></span>
    </a>
    <button class="menu-btn" type="button" data-menu-open aria-expanded="false" aria-controls="menu">Menu <i aria-hidden="true"></i></button>
  </div>
  <div class="mast-rule" aria-hidden="true"></div>
  <nav class="mast-nav" aria-label="Main"><ul>{nav_links(current)}</ul></nav>
</header>
<div class="minibar" aria-hidden="true">
  <div class="wrap">
    <a class="mini-brand" href="index.html" tabindex="-1"><img src="assets/ds-logo.svg" alt="" width="344" height="262" data-eager><span><strong>{SITE["name"]}</strong><span>{SITE["tagline"]}</span></span></a>
    <ul class="mini-nav">{nav_links(current)}</ul>
    <button class="menu-btn mini-menu" type="button" data-menu-open tabindex="-1">Menu <i aria-hidden="true"></i></button>
  </div>
</div>
<div class="menu" id="menu" aria-hidden="true" role="dialog" aria-label="Site menu">
  <div class="menu-head"><img src="assets/ds-logo-light.svg" alt="" width="344" height="262"><button class="menu-close" type="button" aria-label="Close menu"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M1 1l16 16M17 1L1 17" stroke="currentColor" stroke-width="1.4"/></svg></button></div>
  <ol>{menu_items(current)}</ol>
  <div class="menu-foot"><a href="{SITE["phone_href"]}">{SITE["phone"]}</a><a href="mailto:{SITE["email"]}">{SITE["email"]}</a><span>{SITE["address"][0]}, Faridabad</span></div>
</div>'''


def footer(meta: dict) -> str:
    links = ''.join(f'<li><a href="{h}">{l}</a></li>' for k, l, h in NAV if k != 'index')
    svc = ''.join(f'<li><a href="services.html#{a}">{l}</a></li>' for a, l in [
        ('architecture', 'Architecture'), ('interiors', 'Interiors'), ('kitchens', 'Kitchens'),
        ('joinery', 'Wardrobes & offices'), ('renovation', 'Renovation'), ('management', 'Project management')])
    return f'''<footer class="titleblock">
  <div class="wrap">
    <div class="tb-grid">
      <div class="tb-cell tb-brand">
        <img class="tb-logo" src="assets/ds-logo.svg" alt="D.S. Design Sense" width="344" height="262">
        <p>Architecture, total interior design and project management since 2001. Part of D.S. Doors India Limited.</p>
      </div>
      <div class="tb-cell"><span class="tb-k">Studio</span><div class="tb-v">{"<br>".join(SITE["address"])}</div></div>
      <div class="tb-cell"><span class="tb-k">Contact</span><div class="tb-v"><a href="{SITE["phone_href"]}">{SITE["phone"]}</a><br><a href="mailto:{SITE["email"]}">{SITE["email"]}</a><br><span class="tb-small">Visits by appointment</span></div></div>
      <div class="tb-cell"><span class="tb-k">Navigate</span><ul class="tb-links">{links}</ul></div>
      <div class="tb-cell tb-wide"><span class="tb-k">Services</span><ul class="tb-links">{svc}</ul></div>
      <div class="tb-cell tb-sheet"><div><span class="tb-k">Sheet</span><strong>{e(meta.get("sheet", "A-00"))}</strong></div>
        <svg class="north" viewBox="0 0 46 46" aria-label="North arrow"><circle cx="23" cy="23" r="21" fill="none" stroke="currentColor"/><path d="M23 6l7 26-7-5-7 5z" fill="currentColor"/><text x="23" y="44" font-size="7" text-anchor="middle" font-family="DM Mono, monospace" fill="currentColor">N</text></svg>
      </div>
    </div>
    <div class="tb-foot"><span>© <span data-year>2026</span> {SITE["name"]}</span><span>The 3D house on this site is an original concept, not a client property</span><span>Faridabad · Delhi NCR</span></div>
  </div>
</footer>'''


LOADER = '''<div class="loader" aria-hidden="true">
  <div class="loader-inner">
    <div class="loader-logo"><img src="assets/ds-logo.svg" alt="" width="344" height="262" data-eager></div>
    <div class="loader-bar"><i></i></div>
    <div class="loader-count">Drawing <b>000</b></div>
  </div>
</div>'''

CHROME_TOP = '''<a class="skip-link" href="#main">Skip to content</a>
<div class="wipe" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
<div class="cursor" aria-hidden="true"><div class="cursor-ring"><i></i><i></i><i></i><i></i></div><div class="cursor-label"></div><div class="cursor-dot"></div><div class="cursor-coords"></div></div>'''


def scripts(has_x3d: bool) -> str:
    out = ['<script src="vendor/gsap.min.js" defer></script>',
           '<script src="vendor/ScrollTrigger.min.js" defer></script>',
           '<script src="vendor/lenis.min.js" defer></script>',
           '<script src="js/site.js" defer></script>']
    if has_x3d:
        out.append('<script type="importmap">{"imports":{"three":"./vendor/three.module.js","three/addons/":"./vendor/addons/"}}</script>')
        out.append('<script type="module" src="js/3d/app.js"></script>')
    return '\n'.join(out)


# ---------------------------------------------------------------------------
# Post-processing
# ---------------------------------------------------------------------------
URL_ATTRS = ('href', 'src', 'srcset', 'data-fallback', 'data-img', 'data-render', 'data-sketch', 'poster', 'action')


def add_image_attrs(html: str) -> str:
    def fix(m):
        tag = m.group(0)
        src_m = re.search(r'\ssrc="([^"]+)"', tag)
        if not src_m or src_m.group(1).startswith(('http', 'data:')):
            return tag
        src = src_m.group(1)
        path = OUT / src
        if 'width=' not in tag:
            size = image_size(path)
            if size:
                tag = tag.replace(' src=', f' width="{size[0]}" height="{size[1]}" src=', 1)
        if 'srcset=' not in tag and src.endswith('.jpg'):
            md = path.with_name(path.stem + '-md.jpg')
            size = image_size(path)
            if md.exists() and size:
                mdw = (image_size(md) or (900, 0))[0]
                mdsrc = src.rsplit('/', 1)[0] + '/' + md.name
                sizes = '120px' if 'pf-thumb' in m.string[max(0, m.start() - 160):m.start()] else '(max-width: 767px) 100vw, 50vw'
                tag = tag.replace(' src=', f' srcset="{mdsrc} {mdw}w, {src} {size[0]}w" sizes="{sizes}" src=', 1)
        if 'data-eager' in tag:
            tag = tag.replace(' data-eager', '')
            if 'decoding=' not in tag:
                tag = tag.replace('<img', '<img decoding="async"', 1)
        elif 'loading=' not in tag:
            tag = tag.replace('<img', '<img loading="lazy" decoding="async"', 1)
        return tag
    return re.sub(r'<img\b[^>]*>', fix, html)


def rewrite_paths(html: str, depth: int) -> str:
    if depth == 0:
        return html
    prefix = '../' * depth

    def local(u: str) -> bool:
        return not re.match(r'^(?:[a-z]+:|#|/|\.\./|\{)', u)

    def fix_attr(m):
        attr, val = m.group(1), m.group(2)
        if attr == 'srcset':
            parts = []
            for item in val.split(','):
                item = item.strip()
                url, _, rest = item.partition(' ')
                parts.append((prefix + url if local(url) else url) + (' ' + rest if rest else ''))
            return f'{attr}="{", ".join(parts)}"'
        return f'{attr}="{prefix + val if local(val) else val}"'
    pattern = r'\b(' + '|'.join(re.escape(a) for a in URL_ATTRS) + r')="([^"]*)"'
    html = re.sub(pattern, fix_attr, html)
    # the import map points into vendor/
    html = html.replace('"./vendor/', f'"{prefix}vendor/')
    return html


def parse_page(text: str) -> tuple[dict, str]:
    m = re.match(r'\s*<!--(.*?)-->', text, re.S)
    meta = {}
    if m:
        for line in m.group(1).strip().splitlines():
            k, _, v = line.partition(':')
            if k.strip():
                meta[k.strip()] = v.strip()
        text = text[m.end():]
    return meta, text


def render(meta: dict, body: str, rel: str) -> str:
    depth = rel.count('/')
    body = expand_blocks(body)
    body = replace_orbs(body)
    has_x3d = 'data-x3d=' in body
    loader = LOADER if meta.get('loader') == 'yes' else ''
    page = f'''{head(meta, has_x3d)}
<body data-page="{meta.get("nav", "")}" class="page-{meta.get("nav", "")}">
{CHROME_TOP}
{loader}
{masthead(meta.get("nav", ""))}
<main id="main">
{body.strip()}
</main>
{footer(meta)}
{scripts(has_x3d)}
</body>
</html>
'''
    page = add_image_attrs(page)
    page = rewrite_paths(page, depth)
    return page


# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------
def check(pages: dict[str, str]) -> list[str]:
    problems = []
    ids = {rel: set(re.findall(r'\bid="([^"]+)"', html)) for rel, html in pages.items()}
    for rel, html in pages.items():
        base = (OUT / rel).parent
        low = re.sub(r'<svg class="mast-drawing".*?</svg>', '', html, flags=re.S).lower()
        for word in BANNED:
            if re.search(r'(?<![a-z])' + re.escape(word) + r'(?![a-z])', low):
                problems.append(f'{rel}: contains banned text "{word}"')
        for attr, url in re.findall(r'\b(href|src)="([^"]+)"', html):
            if re.match(r'^(?:[a-z]+:|//)', url):
                continue
            path, _, frag = url.partition('#')
            path = path.partition('?')[0]
            if path:
                target = (base / path).resolve()
                if not target.exists():
                    problems.append(f'{rel}: missing {attr} target {url}')
                    continue
                if frag and target.suffix == '.html':
                    trel = str(target.relative_to(OUT))
                    if trel in ids and frag not in ids[trel]:
                        problems.append(f'{rel}: missing anchor {url}')
            elif frag and frag not in ids[rel]:
                problems.append(f'{rel}: missing in-page anchor #{frag}')
    return problems


def main() -> int:
    pages: dict[str, str] = {}
    for src in sorted(SRC.rglob('*.html')):
        rel = str(src.relative_to(SRC))
        meta, body = parse_page(src.read_text())
        pages[rel] = render(meta, body, rel)
    for i, s in enumerate(SECTORS):
        meta, body = sector_page(i, s)
        rel = f'work/{s["slug"]}.html'
        pages[rel] = render(meta, body, rel)
    for rel, html in pages.items():
        dest = OUT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(html)
    problems = check(pages)
    print(f'Built {len(pages)} pages into {OUT.relative_to(HERE)}/')
    for p in problems:
        print('  !', p)
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
