---
title: Quests
layout: default
parent: Features
nav_order: 4
---

The Quests panel is the party's writ — the list of errands they have
pledged to see through. Each quest carries a title, optional notes, and an
active/completed state.

![The Quests panel with active and completed errands](../screenshots/quests.png)

## Adding and editing

Type a title into the **"Take up a new quest…"** field and press **Enter**
or **Pledge** to add it. Each entry can be expanded into an editor that lets
you rewrite the title and add longer **notes** — details, hooks, gossip — on
a second line. Empty titles are rejected; submitting an empty edit cancels.

## Graph view

The **List / Graph** toggle just under the input swaps the writ for a
left-to-right DAG of the quests, drawn from their **dependsOn** edges
that the list-view editor already exposes. Roots sit on the leftmost
column; each child quest moves one column past the deepest of its
prerequisites.

![A quest dependency graph: completed root, locked descendant, plus a focused-quest detail panel](../screenshots/quest-graph.png)

- **Green** node — completed quest. The edge from it to its child is
  also green, so an unblocked next step is obvious at a glance.
- **Dashed** node — locked: at least one prerequisite is still open.
- **Solid** node — active and ready to take up.
- Clicking a node opens a small detail panel below the canvas with the
  quest's title, status (Active / Locked / Completed) and notes.
- The view is **read-only**; editing still happens in the list view to
  keep the graph uncluttered.

The active view is remembered per device under `lod:pref:quests-view`.

## Filters

The three filter chips above the list scope what's shown:

- **All** — every quest, open or closed.
- **Active** — only outstanding pledges.
- **Completed** — only finished quests.

Each entry also has a per-row **checkbox** (mark done / undo) and a **trash**
button to remove it. The subtitle of the panel keeps a running count
(`<n> active · <m> completed`).

## Migration

Older saved data with bare quest strings is upgraded on read into the modern
`{ id, title, notes, isDone }` shape, so you never lose work from earlier
versions of the app.
