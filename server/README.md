# SET Game Server

## Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```bash
GAME_PASSWORD=your_secure_password_here
PORT=3000
```

The `GAME_PASSWORD` is required for users to authenticate when joining the game. Make sure to set this to a secure password and share it with authorized players only.

## Setup

1. Copy `.env.example` to `.env`
2. Set your desired `GAME_PASSWORD` value
3. Install dependencies: `yarn install`
4. Run in development: `yarn dev`
5. Build for production: `yarn build`
6. Start production server: `yarn start`
