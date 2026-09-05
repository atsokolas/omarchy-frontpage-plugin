# The Front Page

The day on one page, delivered at the first unlock each morning.

An Omarchy overlay that reads the other daily widgets — Elevation's building,
Easel's painting, Munger's quote, Kickoff's fixtures — and sets them on one page
under a masthead and an edition number. Read it once, put it down.

## How it works

Nothing is fetched here. Every section is a live view of the plugin's own
service, read in-process through the shell, so the page shows whatever the bar
is showing and updates as pictures land. A section whose plugin is not installed
takes no room: a two-widget bar gets a two-column page.

A small service delivers the page once a day — at the first unlock, or at login
when there was no lock to come back from — and remembers the date in
`~/.local/state/omarchy/frontpage/delivered`, so a shell restart later in the
day does not deliver it twice.

The edition number is the civil day number, the same one the other widgets
count their decks by.

## Install

```bash
omarchy plugin add https://github.com/atsokolas/omarchy-frontpage-plugin.git --enable
```

The Front Page is an overlay, not a bar widget, so it lives in the top-level
`plugins` list of `~/.config/omarchy/shell.json` rather than in a bar section.
`--enable` puts it there; without it, `omarchy plugin enable atsokolas.frontpage`.

It is best read alongside the plugins it reads:

```bash
omarchy plugin add https://github.com/atsokolas/omarchy-elevation-plugin.git --enable
omarchy plugin add https://github.com/atsokolas/omarchy-easel-plugin.git --enable
omarchy plugin add https://github.com/atsokolas/omarchy-munger-plugin.git --enable
omarchy plugin add https://github.com/atsokolas/omarchy-kickoff-plugin.git --enable
```

Any subset works.

## Keys

| Key | Action |
| --- | --- |
| `e` | Open Elevation |
| `a` | Open Easel |
| `m` | Open Munger |
| `k` | Open Kickoff |
| Esc, Return, Space | Put it down |

Clicking a section opens that widget; clicking outside the page puts it down.

## IPC

```bash
omarchy-shell atsokolas.frontpage open        # bring it back any time
omarchy-shell atsokolas.frontpage redeliver   # forget today's delivery and deliver again
omarchy-shell atsokolas.frontpage status      # JSON: delivered date, today, lock state
omarchy-shell shell hide atsokolas.frontpage  # put it down from a script
```

To bind it to a key, add to `~/.config/hypr/bindings.conf`:

```
bindd = SUPER SHIFT, F, The Front Page, exec, omarchy-shell atsokolas.frontpage open
```

## Requirements

- Omarchy Quattro (Quickshell plugin support)
- Any of `atsokolas.elevation`, `atsokolas.easel`, `atsokolas.munger`,
  `atsokolas.kickoff` — the page is empty without them

No network of its own. The only file it writes is its own state file.

## Tests

```bash
./tests/run
```

## Remove

```bash
omarchy plugin disable atsokolas.frontpage
omarchy plugin remove atsokolas.frontpage --yes
rm -rf ~/.local/state/omarchy/frontpage
```

## License

MIT
