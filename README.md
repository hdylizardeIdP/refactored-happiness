# SMS Assistant

A personal digital assistant that communicates via SMS using natural language processing. Built with Node.js, TypeScript, Express, Prisma, and integrates with Twilio (SMS), Anthropic Claude (AI), and Google Maps (location services).

## Features

### MVP (Phase 1)
- ✅ Basic SMS communication via Twilio
- ✅ Contact lookup and management
- ✅ Shared grocery list management
- ✅ Manual location sharing and updates
- ✅ Permission-based access control
- ✅ Natural language intent recognition with Claude AI

### Phase 2 (Coming Soon)
- Automatic ETA calculation with traffic
- Trip management and tracking
- Multiple shared lists
- Calendar integration
- Smart notifications

## Technology Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ with Prisma ORM
- **SMS Gateway**: Twilio
- **AI/NLP**: Anthropic Claude API
- **Maps/Location**: Google Maps API

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher
- Twilio account with phone number
- Anthropic API key
- Google Maps API key

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys and configuration:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://user:password@localhost:5432/sms_assistant

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

ANTHROPIC_API_KEY=your_anthropic_api_key

GOOGLE_MAPS_API_KEY=your_google_maps_api_key

PRIMARY_USER_PHONE=+1234567890
PRIMARY_USER_NAME=Your Name

WEBHOOK_SECRET=random_secret_string
ADMIN_API_KEY=your_secure_admin_api_key
LOG_LEVEL=info
```

### 3. Set Up Database

```bash
# Run Prisma migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed the database with sample data
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`.

### 5. Expose Local Server with ngrok

For Twilio to send webhooks to your local server:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and configure your Twilio phone number's webhook URL to:

```
https://abc123.ngrok.io/webhooks/sms/incoming
```

## Usage

Once set up, send SMS messages to your Twilio phone number:

### Contact Lookup
- "What's Mom's phone number?"
- "Get me John's email"
- "Show me Sarah's contact info"

### Grocery List
- "Add milk to grocery list"
- "Add 2 lbs of bananas"
- "Show me the grocery list"
- "Mark milk as bought"
- "Remove eggs"
- "Clear the grocery list"

### Location (Manual)
- "I'm at the store"
- "I'm at 123 Main St"
- "I'm heading home"

### Help
- "help" - See available commands
- "status" - Check system status (primary user only)

## Project Structure

```
sms-assistant/
├── src/
│   ├── config/         # Configuration (Twilio, Claude, Google Maps, DB)
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── handlers/       # Intent-specific handlers
│   ├── middleware/     # Express middleware
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── app.ts          # Express app setup
│   └── server.ts       # Server entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   ├── migrations/     # Database migrations
│   └── seed.ts         # Seed data
├── tests/              # Test files
└── package.json
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with sample data
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## API Endpoints

### Health & Status
- `GET /health` - Basic health check (no authentication required)
- `GET /status` - Detailed system status (requires admin API key)
  - **Authentication**: Requires `Authorization` header with admin API key
  - **Example**: `Authorization: Bearer your_admin_api_key`

### Twilio Webhooks
- `POST /webhooks/sms/incoming` - Incoming SMS webhook
- `POST /webhooks/sms/status` - SMS status callback

## Security

- Phone number whitelist (only authorized users can interact)
- Twilio webhook signature validation
- Admin API key authentication for system endpoints
- Permission-based access control
- Input sanitization and validation
- Environment variable protection

## Development

### Database Management

View and manage your database with Prisma Studio:

```bash
npm run prisma:studio
```

### Logging

Logs are written to:
- Console (development)
- `logs/error.log` (errors only)
- `logs/combined.log` (all logs)

Log level can be configured via `LOG_LEVEL` environment variable.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

### Railway / Render

1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables
4. Deploy

The service will automatically:
- Install dependencies
- Run database migrations
- Start the server

### Environment Variables (Production)

Ensure these are set in your production environment:
- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL connection string)
- All API keys and credentials

## Troubleshooting

### Database connection issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure database exists

### Twilio webhook not working
- Verify ngrok is running (development)
- Check Twilio webhook URL is correct
- Review Twilio logs in dashboard
- Verify signature validation

### Claude API errors
- Check API key is valid
- Verify account has credits
- Review rate limits

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT

## Author

Built with Claude Code
