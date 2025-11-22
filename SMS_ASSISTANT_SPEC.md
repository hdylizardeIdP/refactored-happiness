# Personal SMS Assistant - Project Specification

## Project Overview

A personal digital assistant that communicates with friends and family via SMS using natural language processing. The system allows users to share location/ETA information, manage shared documents (grocery lists, contacts), and respond to queries from trusted contacts.

## Technology Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **ORM**: Prisma (for type-safe database access)
- **API Client**: Axios for external API calls

### External Services
- **SMS Gateway**: Twilio
- **AI/NLP**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Maps/Location**: Google Maps API (Directions & Geocoding)
- **Hosting**: Railway or Render (initially)

### Development Tools
- **Package Manager**: npm or pnpm
- **Testing**: Jest + Supertest
- **Linting**: ESLint + Prettier
- **Environment**: dotenv for configuration

## Architecture Overview

```
┌─────────────────┐
│   SMS Gateway   │
│    (Twilio)     │
└────────┬────────┘
         │ Webhook
         ▼
┌─────────────────────────────────────────┐
│         Express API Server              │
│  ┌──────────────────────────────────┐  │
│  │   SMS Controller                 │  │
│  │   - Receive messages             │  │
│  │   - Parse & validate             │  │
│  └──────────┬───────────────────────┘  │
│             ▼                            │
│  ┌──────────────────────────────────┐  │
│  │   Intent Recognition Service     │  │
│  │   (Claude API Integration)       │  │
│  └──────────┬───────────────────────┘  │
│             ▼                            │
│  ┌──────────────────────────────────┐  │
│  │   Action Handlers                │  │
│  │   - Location/ETA                 │  │
│  │   - List Management              │  │
│  │   - Contact Lookup               │  │
│  │   - Document Sharing             │  │
│  └──────────┬───────────────────────┘  │
│             ▼                            │
│  ┌──────────────────────────────────┐  │
│  │   Response Generator             │  │
│  └──────────┬───────────────────────┘  │
└─────────────┼───────────────────────────┘
              ▼
┌──────────────────────────────────────┐
│         PostgreSQL Database          │
│  - Users & Contacts                  │
│  - Lists & Items                     │
│  - Locations & Check-ins             │
│  - Permissions & Settings            │
└──────────────────────────────────────┘
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  is_primary_user BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone_number);
```

### Contacts Table
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  relationship VARCHAR(50), -- 'family', 'friend', 'colleague', etc.
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_name ON contacts(owner_id, name);
```

### Permissions Table
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_type VARCHAR(50) NOT NULL, -- 'location', 'eta', 'contacts', 'lists'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE(user_id, granted_by_user_id, permission_type)
);

CREATE INDEX idx_permissions_user ON permissions(user_id);
CREATE INDEX idx_permissions_granted_by ON permissions(granted_by_user_id);
```

### Lists Table
```sql
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) DEFAULT 'general', -- 'grocery', 'todo', 'general'
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lists_owner ON lists(owner_id);
```

### List Items Table
```sql
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  quantity VARCHAR(50),
  added_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_list_items_list ON list_items(list_id);
```

### List Shares Table
```sql
CREATE TABLE list_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(list_id, shared_with_user_id)
);

CREATE INDEX idx_list_shares_list ON list_shares(list_id);
CREATE INDEX idx_list_shares_user ON list_shares(shared_with_user_id);
```

### Locations Table
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  label VARCHAR(100), -- 'home', 'work', 'gym', etc.
  is_current BOOLEAN DEFAULT true,
  accuracy_meters INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_user ON locations(user_id);
CREATE INDEX idx_locations_current ON locations(user_id, is_current);
CREATE INDEX idx_locations_created ON locations(created_at);
```

### Trips Table
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin_lat DECIMAL(10, 8),
  origin_lng DECIMAL(11, 8),
  origin_address TEXT,
  destination_lat DECIMAL(10, 8) NOT NULL,
  destination_lng DECIMAL(11, 8) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_label VARCHAR(100), -- 'home', 'work', etc.
  estimated_arrival TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(user_id, status);
```

### Message Log Table
```sql
CREATE TABLE message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_phone VARCHAR(20) NOT NULL,
  to_phone VARCHAR(20) NOT NULL,
  message_body TEXT NOT NULL,
  direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
  twilio_sid VARCHAR(100),
  status VARCHAR(50),
  intent VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_log_from ON message_log(from_phone, created_at);
CREATE INDEX idx_message_log_created ON message_log(created_at);
```

### User Settings Table
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, setting_key)
);

CREATE INDEX idx_user_settings_user ON user_settings(user_id);
```

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String    @id @default(uuid())
  phoneNumber     String    @unique @map("phone_number")
  name            String
  email           String?
  isPrimaryUser   Boolean   @default(false) @map("is_primary_user")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  contacts        Contact[]
  ownedLists      List[]
  sharedLists     ListShare[]
  locations       Location[]
  trips           Trip[]
  settings        UserSetting[]
  permissionsGranted Permission[] @relation("GrantedPermissions")
  permissionsReceived Permission[] @relation("ReceivedPermissions")
  listItemsAdded  ListItem[]

  @@map("users")
}

model Contact {
  id           String    @id @default(uuid())
  ownerId      String    @map("owner_id")
  name         String
  phoneNumber  String?   @map("phone_number")
  email        String?
  relationship String?
  notes        String?
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  
  owner        User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  @@index([ownerId])
  @@index([ownerId, name])
  @@map("contacts")
}

model Permission {
  id               String    @id @default(uuid())
  userId           String    @map("user_id")
  grantedByUserId  String    @map("granted_by_user_id")
  permissionType   String    @map("permission_type")
  isActive         Boolean   @default(true) @map("is_active")
  createdAt        DateTime  @default(now()) @map("created_at")
  expiresAt        DateTime? @map("expires_at")
  
  user             User      @relation("ReceivedPermissions", fields: [userId], references: [id], onDelete: Cascade)
  grantedBy        User      @relation("GrantedPermissions", fields: [grantedByUserId], references: [id], onDelete: Cascade)

  @@unique([userId, grantedByUserId, permissionType])
  @@index([userId])
  @@index([grantedByUserId])
  @@map("permissions")
}

model List {
  id        String    @id @default(uuid())
  ownerId   String    @map("owner_id")
  name      String
  type      String    @default("general")
  isShared  Boolean   @default(false) @map("is_shared")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  
  owner     User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  items     ListItem[]
  shares    ListShare[]

  @@index([ownerId])
  @@map("lists")
}

model ListItem {
  id            String    @id @default(uuid())
  listId        String    @map("list_id")
  content       String
  isCompleted   Boolean   @default(false) @map("is_completed")
  quantity      String?
  addedByUserId String?   @map("added_by_user_id")
  createdAt     DateTime  @default(now()) @map("created_at")
  completedAt   DateTime? @map("completed_at")
  
  list          List      @relation(fields: [listId], references: [id], onDelete: Cascade)
  addedBy       User?     @relation(fields: [addedByUserId], references: [id])

  @@index([listId])
  @@map("list_items")
}

model ListShare {
  id               String   @id @default(uuid())
  listId           String   @map("list_id")
  sharedWithUserId String   @map("shared_with_user_id")
  canEdit          Boolean  @default(true) @map("can_edit")
  createdAt        DateTime @default(now()) @map("created_at")
  
  list             List     @relation(fields: [listId], references: [id], onDelete: Cascade)
  sharedWith       User     @relation(fields: [sharedWithUserId], references: [id], onDelete: Cascade)

  @@unique([listId, sharedWithUserId])
  @@index([listId])
  @@index([sharedWithUserId])
  @@map("list_shares")
}

model Location {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  latitude       Decimal  @db.Decimal(10, 8)
  longitude      Decimal  @db.Decimal(11, 8)
  address        String?
  label          String?
  isCurrent      Boolean  @default(true) @map("is_current")
  accuracyMeters Int?     @map("accuracy_meters")
  createdAt      DateTime @default(now()) @map("created_at")
  
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, isCurrent])
  @@index([createdAt])
  @@map("locations")
}

model Trip {
  id                 String    @id @default(uuid())
  userId             String    @map("user_id")
  originLat          Decimal?  @map("origin_lat") @db.Decimal(10, 8)
  originLng          Decimal?  @map("origin_lng") @db.Decimal(11, 8)
  originAddress      String?   @map("origin_address")
  destinationLat     Decimal   @map("destination_lat") @db.Decimal(10, 8)
  destinationLng     Decimal   @map("destination_lng") @db.Decimal(11, 8)
  destinationAddress String    @map("destination_address")
  destinationLabel   String?   @map("destination_label")
  estimatedArrival   DateTime? @map("estimated_arrival")
  status             String    @default("active")
  createdAt          DateTime  @default(now()) @map("created_at")
  completedAt        DateTime? @map("completed_at")
  
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, status])
  @@map("trips")
}

model MessageLog {
  id          String   @id @default(uuid())
  fromPhone   String   @map("from_phone")
  toPhone     String   @map("to_phone")
  messageBody String   @map("message_body")
  direction   String
  twilioSid   String?  @map("twilio_sid")
  status      String?
  intent      String?
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([fromPhone, createdAt])
  @@index([createdAt])
  @@map("message_log")
}

model UserSetting {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  settingKey   String   @map("setting_key")
  settingValue String?  @map("setting_value")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, settingKey])
  @@index([userId])
  @@map("user_settings")
}
```

## Project Structure

```
sms-assistant/
├── src/
│   ├── config/
│   │   ├── database.ts          # Prisma client initialization
│   │   ├── twilio.ts             # Twilio client setup
│   │   ├── claude.ts             # Claude API client setup
│   │   └── google-maps.ts        # Google Maps API setup
│   ├── controllers/
│   │   ├── sms.controller.ts     # Main SMS webhook handler
│   │   └── health.controller.ts  # Health check endpoint
│   ├── services/
│   │   ├── intent.service.ts     # Claude API integration for intent recognition
│   │   ├── location.service.ts   # Location and ETA calculations
│   │   ├── list.service.ts       # List management operations
│   │   ├── contact.service.ts    # Contact lookup and management
│   │   ├── permission.service.ts # Permission checking and validation
│   │   └── sms.service.ts        # Twilio SMS sending
│   ├── handlers/
│   │   ├── location.handler.ts   # Handle location/ETA queries
│   │   ├── list.handler.ts       # Handle list operations
│   │   ├── contact.handler.ts    # Handle contact queries
│   │   └── help.handler.ts       # Handle help requests
│   ├── middleware/
│   │   ├── validation.middleware.ts  # Request validation
│   │   ├── error.middleware.ts       # Error handling
│   │   └── auth.middleware.ts        # Twilio signature validation
│   ├── types/
│   │   ├── intents.ts            # Intent type definitions
│   │   ├── sms.ts                # SMS-related types
│   │   └── index.ts              # Shared type exports
│   ├── utils/
│   │   ├── logger.ts             # Winston logger setup
│   │   ├── formatters.ts         # Message formatting utilities
│   │   └── validators.ts         # Input validation helpers
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Server entry point
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   └── seed.ts                   # Seed data for development
├── tests/
│   ├── integration/
│   │   └── sms.test.ts
│   └── unit/
│       ├── services/
│       └── handlers/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sms_assistant

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Anthropic Claude
ANTHROPIC_API_KEY=your_api_key

# Google Maps
GOOGLE_MAPS_API_KEY=your_maps_api_key

# Primary User (your phone number)
PRIMARY_USER_PHONE=+1234567890
PRIMARY_USER_NAME=David

# Security
WEBHOOK_SECRET=random_secret_for_webhook_validation
```

## MVP Features (Phase 1)

### 1. Basic SMS Communication
- Receive SMS messages via Twilio webhook
- Send SMS responses via Twilio API
- Log all messages to database
- Validate sender is in whitelist (users table)

### 2. Contact Lookup
**User Commands:**
- "What's [name]'s phone number?"
- "Get me [name]'s email"
- "Show me [name]'s contact info"

**Implementation:**
- Parse name from message using Claude API
- Search contacts table for matching name
- Return formatted contact information
- Handle cases where contact doesn't exist or multiple matches

### 3. Shared Grocery List
**User Commands:**
- "Add [item] to grocery list"
- "Show me the grocery list"
- "Remove [item] from grocery list"
- "Clear the grocery list"
- "Mark [item] as bought"

**Implementation:**
- Create default "Grocery List" for primary user
- Parse item names and quantities
- Add/remove/update items in list_items table
- Format list for SMS display (handle character limits)
- Track who added each item

### 4. Manual Location Sharing
**User Commands:**
- "I'm at [location]"
- "I'm heading home, ETA 20 minutes"
- "Set my location to [address]"

**Implementation:**
- Parse location/address from message
- Use Google Maps Geocoding API to get coordinates
- Store in locations table (mark as current)
- Allow manual ETA entry
- Respond with confirmation

### 5. Basic Permission/Whitelist System
**Features:**
- Only respond to phone numbers in users table
- Polite rejection for unknown numbers
- Basic permission check before sharing data
- Primary user can query system status

**Implementation:**
- Check sender phone number against users table
- Return early if unauthorized
- Log unauthorized attempts
- Allow primary user to see recent activity

## Advanced Features (Phase 2+)

### 6. Automatic ETA Calculation
**User Commands:**
- "Where is David?"
- "When will you arrive?"
- "How far away are you?"

**Implementation:**
- Check if user has an active trip
- Get current location (most recent in locations table)
- Use Google Maps Directions API to calculate route
- Parse traffic conditions for accurate ETA
- Return formatted response with ETA and distance
- Requires: background location updates or integration with location-sharing app

### 7. Trip Management
**User Commands:**
- "I'm heading to [destination]"
- "Start trip home"
- "Cancel my trip"
- "Update my destination to [location]"

**Implementation:**
- Create trip record with origin and destination
- Calculate initial ETA
- Mark trip as active
- Allow trip updates and cancellations
- Auto-complete trips when user arrives
- Store common destinations (home, work) in user settings

### 8. Multiple Shared Lists
**User Commands:**
- "Create a list called [name]"
- "Add [item] to [list name]"
- "Show me all my lists"
- "Share [list name] with [contact]"
- "Delete [list name]"

**Implementation:**
- Support multiple list types (grocery, todo, packing, etc.)
- List sharing with specific users
- Edit permissions per shared user
- Notifications when shared list is updated
- List templates for common use cases

### 9. Calendar Integration
**User Commands:**
- "Where is my next meeting?"
- "When do I need to leave for [event]?"
- "What's on my calendar today?"

**Implementation:**
- Integrate with Google Calendar API
- Calculate departure times based on meeting location
- Send proactive reminders
- Factor in traffic for departure time
- Link trips to calendar events

### 10. Smart Notifications
**Features:**
- Proactive ETA updates when delayed
- Notify shared list members of changes
- Arrival notifications
- Traffic alerts for upcoming trips

**Implementation:**
- Background job to check active trips
- Compare estimated vs actual progress
- Send automatic updates when significant changes
- Configurable notification preferences per user

### 11. Natural Language Understanding Improvements
**Features:**
- Context awareness (remember previous messages)
- Handle ambiguous requests with clarifying questions
- Support for follow-up questions
- Nickname and relationship understanding

**Implementation:**
- Store conversation context in database
- Use Claude API with conversation history
- Fuzzy matching for names and locations
- Learn user preferences over time

### 12. Location History & Analytics
**User Commands:**
- "Where was I last Tuesday?"
- "How much time do I spend at [location]?"
- "What's my usual commute time?"

**Implementation:**
- Store detailed location history
- Aggregate and analyze patterns
- Generate reports on request
- Privacy controls for history retention

### 13. Group Features
**User Commands:**
- "Send 'running late' to the family group"
- "Where is everyone?"
- "Share the party planning list with [group]"

**Implementation:**
- Create user groups (family, friends, work)
- Broadcast messages to groups
- Group permissions for location sharing
- Shared group lists

### 14. Voice Messages & Media
**Features:**
- Send voice notes as text transcriptions
- Share images of receipts, documents
- OCR for extracting text from images

**Implementation:**
- Integrate Twilio voice transcription
- Use image recognition API for OCR
- Store media references in database
- Extract relevant data from images

## API Endpoints

### Webhooks
```
POST /webhooks/sms/incoming    # Twilio SMS webhook
POST /webhooks/sms/status      # Twilio status callback
```

### Health & Status
```
GET  /health                   # Basic health check
GET  /status                   # Detailed system status (auth required)
```

### Admin (Future)
```
POST /admin/users              # Add new user to whitelist
GET  /admin/users              # List all users
PUT  /admin/permissions        # Update user permissions
GET  /admin/messages           # View message log
```

## Intent Types & Classification

The Claude API will classify incoming messages into these intent categories:

```typescript
enum IntentType {
  // Location & Travel
  LOCATION_QUERY = 'location_query',           // "Where is David?"
  ETA_QUERY = 'eta_query',                     // "When will you arrive?"
  LOCATION_UPDATE = 'location_update',         // "I'm at the store"
  TRIP_START = 'trip_start',                   // "Heading home"
  TRIP_CANCEL = 'trip_cancel',                 // "Cancel my trip"
  
  // Contacts
  CONTACT_LOOKUP = 'contact_lookup',           // "What's Mom's number?"
  CONTACT_SHARE = 'contact_share',             // "Send John Sarah's number"
  
  // Lists
  LIST_ADD_ITEM = 'list_add_item',            // "Add milk to grocery list"
  LIST_REMOVE_ITEM = 'list_remove_item',      // "Remove eggs"
  LIST_VIEW = 'list_view',                    // "Show me the grocery list"
  LIST_CLEAR = 'list_clear',                  // "Clear the list"
  LIST_MARK_COMPLETE = 'list_mark_complete',  // "Mark milk as bought"
  LIST_CREATE = 'list_create',                // "Create a packing list"
  LIST_SHARE = 'list_share',                  // "Share list with Natalie"
  
  // System
  HELP = 'help',                              // "What can you do?"
  STATUS = 'status',                          // "System status"
  UNKNOWN = 'unknown',                        // Unrecognized intent
}

interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: {
    contactName?: string;
    listName?: string;
    listItem?: string;
    quantity?: string;
    location?: string;
    destination?: string;
    duration?: string;
  };
  rawMessage: string;
}
```

## Security & Privacy Considerations

### Authentication & Authorization
1. **Phone Number Whitelist**: Only respond to known users in database
2. **Permission System**: Granular control over who can access what data
3. **Webhook Validation**: Verify Twilio signature on all incoming webhooks
4. **Rate Limiting**: Prevent abuse with rate limits per phone number
5. **Secure Credentials**: All API keys in environment variables, never committed

### Data Privacy
1. **Location Data**: 
   - Store only when explicitly shared or during active trips
   - Configurable retention period
   - Option to delete history
2. **Message Logging**: 
   - Log for debugging and audit
   - Configurable retention
   - Exclude sensitive content from logs
3. **Shared Data**: 
   - Clear permission model
   - Users can revoke access anytime
   - Audit log for data access

### PII Handling
1. **Contact Information**: Encrypted at rest
2. **Phone Numbers**: Normalized and validated
3. **Addresses**: Store only when necessary
4. **GDPR Compliance**: Data export and deletion capabilities

## Error Handling

### Error Categories
1. **Twilio Errors**: Failed to send SMS, invalid phone number
2. **API Errors**: Claude API rate limit, Google Maps API failure
3. **Database Errors**: Connection failure, constraint violations
4. **Permission Errors**: Unauthorized access attempts
5. **Validation Errors**: Malformed input, missing required data

### Error Responses
- User-friendly error messages via SMS
- Detailed logs for debugging
- Graceful degradation when services unavailable
- Retry logic for transient failures

### Example Error Messages:
- "Sorry, I couldn't find that contact. Can you spell their name differently?"
- "I'm having trouble connecting right now. Please try again in a moment."
- "You don't have permission to access that information."
- "I didn't understand that. Text 'help' to see what I can do."

## Testing Strategy

### Unit Tests
- Service layer functions
- Intent parsing logic
- Formatting utilities
- Permission checking

### Integration Tests
- SMS webhook handling end-to-end
- Database operations
- External API integrations (mocked)
- Permission flows

### Test Data
- Seed database with test users, contacts, lists
- Mock Twilio webhooks
- Mock Claude API responses
- Mock Google Maps API responses

## Development Workflow

### Initial Setup
```bash
# 1. Clone repository and install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Set up database
docker compose up -d postgres  # If using Docker
npx prisma migrate dev
npx prisma generate
npx prisma db seed

# 4. Start development server
npm run dev

# 5. Expose local server for Twilio webhook
ngrok http 3000
# Update Twilio webhook URL to ngrok URL
```

### Git Workflow
- Main branch protected
- Feature branches for new features
- Pull requests for code review
- Automated tests on PR

### Deployment
1. **Initial**: Deploy to Railway/Render
2. **CI/CD**: GitHub Actions for automated deployment
3. **Environment**: Separate staging and production
4. **Database**: Automated migrations on deploy
5. **Monitoring**: Error tracking with Sentry

## Monitoring & Observability

### Logging
- Structured JSON logs
- Winston logger with multiple transports
- Log levels: error, warn, info, debug
- Separate log files for different categories

### Metrics
- Message volume per day
- Response time per intent type
- Error rates by category
- API usage costs (Twilio, Claude, Google)

### Alerts
- High error rates
- API quota warnings
- Database connection issues
- Unusual message patterns (potential abuse)

## Cost Estimates

### MVP (Low Volume: ~500 messages/month)
- Twilio: $1/month (number) + $4 (messages) = $5/month
- Claude API: ~$1/month (very low usage)
- Google Maps: Free tier
- Hosting: Free tier (Railway/Render)
- **Total: ~$6/month**

### Production (Medium Volume: ~2000 messages/month)
- Twilio: $1/month + $16 (messages) = $17/month
- Claude API: ~$3-5/month
- Google Maps: Free tier (40k requests)
- Hosting: ~$5/month
- **Total: ~$25-27/month**

## Success Metrics

### MVP Success Criteria
1. Successfully receive and respond to SMS messages
2. Contact lookup working with >90% accuracy
3. Grocery list operations functional
4. Zero unauthorized access incidents
5. <5 second response time average

### User Experience Goals
1. Natural conversation flow
2. >95% intent recognition accuracy
3. Minimal user frustration (tracked via "help" requests)
4. Positive feedback from family users

## Future Enhancements

### Phase 3+
1. **Multi-language support**: Spanish, etc.
2. **Voice calling integration**: Answer calls with automated responses
3. **Email integration**: Extend to email for longer content
4. **Mobile app**: Companion app for easier location sharing
5. **AI Memory**: Remember preferences and common requests
6. **Automation rules**: "Always notify Natalie when I leave work"
7. **External integrations**: Uber API, food delivery, smart home
8. **Receipt scanning**: Extract grocery items from photos
9. **Shopping suggestions**: "You usually need milk by now"
10. **Family coordination**: Automated ride scheduling, meal planning

## Development Phases

### Phase 1: MVP (Weeks 1-3)
- Basic infrastructure setup
- Database and API configuration
- SMS receive/send functionality
- Contact lookup
- Simple grocery list
- Permission system

### Phase 2: Core Features (Weeks 4-6)
- Automatic ETA calculation
- Trip management
- Multiple list support
- Enhanced intent recognition
- Improved error handling

### Phase 3: Advanced Features (Weeks 7-10)
- Calendar integration
- Smart notifications
- Group features
- Location history
- Analytics dashboard

### Phase 4: Polish & Scale (Weeks 11-12)
- Performance optimization
- Comprehensive testing
- Documentation
- User onboarding
- Production deployment

## Getting Started

To begin development:

1. **Review this specification thoroughly**
2. **Set up development environment** (Node.js, PostgreSQL, API keys)
3. **Create GitHub repository** with initial structure
4. **Implement basic Express server** with health check
5. **Set up Prisma** and run initial migration
6. **Configure Twilio webhook** with ngrok for local testing
7. **Implement first handler**: Contact lookup (simplest feature)
8. **Test end-to-end**: Send SMS → Get response
9. **Iterate** through remaining MVP features

## Key Technical Decisions

### Why Prisma?
- Type-safe database queries
- Excellent TypeScript integration
- Built-in migration system
- Good performance with PostgreSQL

### Why Claude API over OpenAI?
- Better at instruction following
- Longer context window
- More accurate intent classification
- Cost-effective for this use case

### Why PostgreSQL over MongoDB?
- Structured data with clear relationships
- ACID compliance important for permissions
- Better for queries across multiple tables
- Geographic data types for locations

### Why Express over Fastify/NestJS?
- Simpler for MVP
- Mature ecosystem
- Easy to understand and maintain
- Can migrate later if needed

## Documentation Requirements

### Code Documentation
- JSDoc comments for all public functions
- README with setup instructions
- API endpoint documentation
- Architecture decision records (ADRs)

### User Documentation
- SMS command reference
- Setup guide for new users
- Privacy policy
- FAQ

---

## Notes for Claude Code

When implementing this project:

1. **Start with infrastructure**: Database, Express app, basic webhooks before feature logic
2. **Test incrementally**: Each feature should be testable independently
3. **Handle errors gracefully**: Users should never see stack traces via SMS
4. **Keep responses concise**: SMS has character limits, format accordingly
5. **Log everything**: Debugging SMS flows is hard without good logs
6. **Think about costs**: Each SMS and API call costs money
7. **Security first**: Validate all inputs, check permissions before any data access
8. **User experience**: Response time matters - optimize for speed
9. **Privacy conscious**: Be thoughtful about what data is stored and who can access it

This is a real-world application that will handle personal data. Write production-quality code with proper error handling, logging, and security from the start.
