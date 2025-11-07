# Tialz Task Manager - Desktop

## Development

- Create a `.env` file in `desktop/` and set `APP_URL` to your hosted web app URL, e.g.:
  - `APP_URL=https://app.companyname.com`
  - For local dev: `APP_URL=http://localhost:5173`

```bash
cd desktop
npm install
npm run start
```

## Build (Windows Installer)

```bash
cd desktop
npm run build  # creates NSIS installer in desktop/dist
```

## Auto-updates (GitHub Releases)

- Set `build.publish` owner/repo in `desktop/package.json`.
- Configure a GitHub token in CI to run `npm run publish` on tag.

## Notes
- No secrets are bundled; the desktop app only loads the hosted UI which calls your server.
- Keep AI keys and database credentials on the server.


