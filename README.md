# D.S. Design Sense: Website Development final project

The course project folder for the D.S. Design Sense LLP website (due 08 Dec 2026).

| Folder / file | What it holds |
|---|---|
| `Website/` | The finished static site: serve this folder. See `Website/README.md`. |
| `src/pages/` | Page bodies the site is generated from |
| `build.py` | Wraps the bodies in the shared banner, menus and footer; holds the 36 client projects and nine sectors; checks links and banned text |
| `src/clients.json` | The client photo list used by the project galleries |

The assignment write-up and the raw source material are kept locally and are not part of this repository.

## Build and preview

```bash
python3 build.py
```

```bash
python3 -m http.server 5600 --directory Website
```

Then open <http://localhost:5600>.

## Content rules

- The 3D house is an original concept, not a client's property.
- The case study is called "Private Residence". Client names and plot addresses never appear on drawings or images.
- No personal mobile numbers or consultant lists are published. The office line, the email address and the studio address are public.
- Client project notes use the firm's own published wording, lightly edited.
