# JARVIS Life Planner

A local-first intelligent planner for real-life tasks. It turns a messy backlog into a priority-ranked day plan, supports natural-language task capture, and includes a focus timer for execution.

## Features

- Smart task scoring based on urgency, impact, effort, and energy level
- Daily auto-planning with configurable start and end times
- Natural-language capture such as `Add study networks tomorrow 2h high impact`
- Voice capture through the browser Speech Recognition API when supported
- Study modes for deep work, exam sprinting, active recall, reading, and flashcards
- Focus timer with canvas progress visualization tied to the active study mode
- Dresden weather brief powered by Open-Meteo
- Practical grocery checklist with category grouping and weather-aware suggestions
- Dresden update cards from RSS sources where browser access is available
- Local browser storage, plus JSON import and export
- No backend and no account required

## Why this project matters

Most planners store tasks. This project starts acting on them. It is designed as a practical JARVIS-inspired assistant that can grow into a fuller personal operating system with calendar sync, reminders, OpenAI-powered reasoning, and GitHub/Notion integrations.

## Live data sources

- Weather: Open-Meteo forecast API for Dresden coordinates
- Dresden news: Dresdner Neueste Nachrichten RSS feed
- Student life and mensa updates: Studentenwerk Dresden RSS feeds

The app uses browser-friendly RSS bridges for static hosting and falls back to direct source cards if a feed is unavailable. Each card links back to the original provider.

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
