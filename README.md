# Discord Bot Starter

This is a starter project for a Discord bot built using TypeScript and the discord.js library. It provides a basic structure for creating a bot with command handling and event management.

## Features

- Command handling: Easily add new commands to the bot.
- Event management: Handle various Discord events such as messages and bot readiness.
- Logging utility: Simple logging mechanism for debugging and information.
- TypeScript support: Strong typing for better development experience.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/rafia9005/simplfy-discord-bot
   cd simplfy-discord-bot
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and add your Discord bot token:

   ```plaintext
   DISCORD_TOKEN=your-bot-token
   PREFIX=!
   ```

### Running the Bot

To start the bot, run the following command:

```bash
npm run start
```

### Adding Commands

To add a new command, create a new file in the `src/commands` directory and export an `execute` function. Make sure to register the command in the appropriate place in the code.

### Contributing

Feel free to submit issues or pull requests if you have suggestions or improvements!

### License

This project is licensed under the MIT License.