# Tournament Service

A comprehensive tournament management system built with NestJS, Prisma ORM, and PostgreSQL. This service handles user management, tournament creation, match generation with random winners, and ranking systems.

## Features

- **User Management**: CRUD operations for users with rating system
- **Tournament System**: Create and manage tournaments with elimination brackets
- **Match System**: Automated match generation with random winner simulation
- **Ranking System**: ELO-based rating system and tournament rankings
- **Optimization**: Redis caching, database indexing, and performance optimizations
- **API Documentation**: Swagger/OpenAPI documentation

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nest-test
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Update the `.env` file with your database and Redis configuration. The `.env.example` file contains all the required environment variables with example values.
```env
DATABASE_URL="postgresql://username:password@localhost:5432/tournament_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
PORT=3000
NODE_ENV=development
```

4. Set up the database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

5. Start the application:
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:
- http://localhost:3000/api

## API Endpoints

### Users
- `POST /users` - Create a new user
- `GET /users` - Get all users (paginated)
- `GET /users/top` - Get top players by rating
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Tournaments
- `POST /tournaments` - Create a new tournament
- `GET /tournaments` - Get all tournaments (paginated)
- `GET /tournaments/:id` - Get tournament by ID
- `POST /tournaments/:id/join` - Join a tournament
- `POST /tournaments/:id/start` - Start a tournament
- `GET /tournaments/:id/rankings` - Get tournament rankings
- `GET /tournaments/:id/matches` - Get tournament matches

### Matches
- `POST /matches/play` - Play a match (simulate with random winner)
- `GET /matches/:id` - Get match by ID
- `GET /matches/tournament/:tournamentId` - Get all matches for a tournament
- `GET /matches/tournament/:tournamentId/next-round` - Get next round matches

### Authentication
- `POST /auth/login` - Login user

## Database Schema

The application uses the following main entities:

- **User**: Stores user information and ratings
- **Tournament**: Tournament details and status
- **TournamentParticipant**: Links users to tournaments
- **Match**: Individual matches within tournaments
- **MatchResult**: Results and points for each match

## Optimization Features

1. **Database Indexing**: Optimized indexes on frequently queried fields
2. **Redis Caching**: Caching for tournament rankings and top players
3. **Connection Pooling**: Prisma connection pooling for database efficiency
4. **Query Optimization**: Efficient queries with proper relations and pagination

## Tournament Flow

1. **Create Tournament**: Admin creates a tournament with max players
2. **Join Tournament**: Users join the tournament
3. **Start Tournament**: Admin starts the tournament (requires power of 2 players)
4. **Match Generation**: System automatically generates elimination bracket
5. **Play Matches**: Matches are played with random winner simulation
6. **Rating Updates**: ELO ratings are updated after each match
7. **Tournament Completion**: Final rankings are calculated

## Development

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Database Management
```bash
# Open Prisma Studio
npm run prisma:studio

# Reset database
npx prisma migrate reset

# Deploy migrations
npm run prisma:migrate
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.