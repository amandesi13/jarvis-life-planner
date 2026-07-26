# JARVIS Life Planner

A local-first intelligent planner for real-life tasks. It turns a messy backlog into a priority-ranked day plan, supports natural-language task capture, and includes a focus timer for execution.

## Features

- Smart task scoring based on urgency, impact, effort, and energy level
- Daily auto-planning with configurable start and end times
- Natural-language capture such as `Add study networks tomorrow 2h high impact`
- Voice capture through the browser Speech Recognition API when supported
- Three dedicated lanes: Plan Today, Study Studio, and Life Goals
- Study modes for deep work, exam sprinting, active recall, reading, and flashcards
- Personal study goal field for what needs to be mastered today
- Focus timer with canvas progress visualization tied to the active study mode
- Fire streak system: log 2 hours of dedicated work/study to earn a daily streak
- Focus calendar showing recent study intensity and best focused days
- Daily quote panel placed in the top-right focus area
- Job follow-up panel for Gmail-derived application to-dos via private local import
- Dresden weather brief powered by Open-Meteo
- Compact 6-slot grocery tab for manual shopping priorities
- Local browser storage, plus JSON import and export
- No backend and no account required

## Why this project matters

Most planners store tasks. This project starts acting on them. It is designed as a practical JARVIS-inspired assistant that can grow into a fuller personal operating system with calendar sync, reminders, OpenAI-powered reasoning, and GitHub/Notion integrations.

## Live data sources

- Weather: Open-Meteo forecast API for Dresden coordinates

## Privacy note

The public GitHub Pages app does not contain private email data. Gmail follow-ups can be imported from a local JSON file into browser storage, and private import files are ignored by Git.

## Run locally

Open `index.html` directly in a browser, or start any static file server from this folder:

```bash
python -m http.server 4173
```

Then visit:

```text
http://127.0.0.1:4173
```

## Roadmap

- Calendar import and conflict-aware scheduling
- OpenAI-powered task decomposition
- Reminder notifications
- Recurring habits and weekly review
- Mobile PWA install support
- Better local transport and event integrations for Dresden

## Tech stack

- HTML
- CSS
- JavaScript
- Browser `localStorage`
- Browser Speech Recognition API, when available

## License

MIT
