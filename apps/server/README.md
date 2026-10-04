# Fablesheet sync server

Optional REST server for syncing characters between devices. Work in progress — the desktop app works fully offline without it.

```bash
npm run server        # from the repository root
```

| Variable          | Default         | Description              |
| ----------------- | --------------- | ------------------------ |
| `FABLESHEET_DB`   | `characters.db` | Path to the SQLite file  |
| `FABLESHEET_ADDR` | `0.0.0.0:3001`  | Address and port to bind |

> ⚠️ There is no authentication yet. Do not expose the server to the internet.
