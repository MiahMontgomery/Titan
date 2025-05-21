# Titan Project

An autonomous AI agent that can build and manage projects independently.

## Features

- Project isolation and management
- Secure secrets management
- Browser automation for autonomous tasks
- Context-aware AI responses
- Persistent data storage
- Real-time project updates

## Prerequisites

- Node.js v18 or higher
- PostgreSQL database
- OpenRouter API key
- ElevenLabs API key (optional, for voice features)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/titan.git
cd titan
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/titan
OPENROUTER_API_KEY=your_openrouter_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ENCRYPTION_KEY=your_encryption_key
PORT=5050
```

4. Initialize the database:
```bash
npm run db:generate  # Generate migration files
npm run db:push     # Push schema to database
npm run db:init     # Initialize database
```

5. Start the development server:
```bash
npm run dev
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:studio` - Open Drizzle Studio for database management

## Project Structure

```
titan/
├── client/           # Frontend application
├── server/           # Backend server
├── services/         # Core services
│   ├── openrouter.ts # AI integration
│   └── browser.ts    # Browser automation
├── shared/           # Shared types and utilities
└── scripts/          # Utility scripts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 