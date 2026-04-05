# CTFd Mario Kart Theme

A Mario Kart inspired theme for CTFd with custom layouts for the homepage, challenges, scoreboard, teams, users, notifications, and settings pages.

## Screenshots

![Challenges view](./screenshots/challenges1.png)

![Challenges modal](./screenshots/challenges2.png)

![Scoreboard](./screenshots/scoreboard.png)

## Install In CTFd

Copy the packaged `mariokart-theme/` directory into your CTFd `themes/` directory.

1. Copy `mariokart-theme/` into `CTFd/themes/`.
2. Alternatively, unzip `mariokart-theme.zip` and place the extracted `mariokart-theme/` directory into `CTFd/themes/`.
3. Restart CTFd so the new theme is detected.
4. Select the theme in your CTFd admin configuration if your deployment does not pick it up automatically.

After installation, the deployed theme directory should look like this inside CTFd:

```text
CTFd/
  themes/
    mariokart-theme/
      assets/
      static/
      templates/
      theme.json
```

## Development (optional)

## Prerequisites

- Node.js 18+ recommended
- npm
- A CTFd instance where you can install a custom theme

## Install Dependencies

```bash
npm install
```

Use watch mode while editing assets:

```bash
npm run dev
```

Theme source files live in:

- `assets/`
- `templates/`
- `theme.json`


## Build The Theme

Run this only if you want to rebuild the packaged theme from source.

```bash
npm run build
```

This command:

- builds the Vite assets into `static/`
- creates an installable `mariokart-theme/` directory
- generates `mariokart-theme.zip`


When you are ready to package a fresh installable build, run `npm run build` again.