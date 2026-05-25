---
title: LoD — Campaign Companion
layout: default
nav_order: 1
description: A real-time companion app for the storytelling board game Legacy of Dragonholt.
---

# LoD — Campaign Companion

A real-time companion app for the storytelling board game **Legacy of
Dragonholt**. It keeps the shared state of a campaign in sync across every
player's screen — the party, the purse, the renown, and the tale itself.

![The LoD Campaign Companion — full app overview](screenshots/overview.png)

## What it tracks

| Panel | What lives there |
| --- | --- |
| [**The Party**](features/party.md) | Character cards with species, background, stamina, skills, traits, conditions, inventory and notes. |
| [**Gold**](features/treasury.md) | The party's coin. |
| [**Fame**](features/treasury.md) | The party's renown. |
| [**The Calendar**](features/calendar.md) | The day, the time of day, and the current adventure. |
| [**Quests**](features/quests.md) | Pledged errands with notes and active/completed filtering. |
| [**People**](features/people.md) | The cast met along the way, tagged ally / foe / neutral / unknown. |
| [**Keywords**](features/keywords.md) | The log of story keywords recorded along the way. |
| [**The Chronicle**](features/chronicle.md) | An A1–Z8 grid of story entries with progress, chapter navigation and filtering. |
| [**Campaign menu**](features/campaign-menu.md) | One-click backup and restore of the whole campaign. |

## How it works

Every panel is wired to a shared Socket.IO channel. When one player edits a
hero, marks a quest done, or advances the calendar, the change is broadcast
to every other browser already on the same campaign — no refresh required.

If the realtime link drops, edits are still made locally and a toast announces
the loss. When the link returns, normal sync resumes.

The backend can persist to MongoDB, but it falls back to an in-memory store
automatically if no database is configured — convenient for a one-shot evening
around the table.

## Read on

- [Getting started](getting-started.md) — running the app locally.
- [Features](features/) — one page per panel, with screenshots.
- [Project on GitHub](https://github.com/it-rec/lod-gui)

---

_Track the party, the purse, and the tale — your tabletop campaign companion._
