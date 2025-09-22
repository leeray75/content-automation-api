# Content Automation API

REST API for the Content Automation Platform, providing endpoints for managing articles, landing pages, and advertisements with built-in validation using shared schemas.

## Features

- **RESTful API** for content management
- **Type-safe validation** using Zod schemas from `content-automation-schemas`
- **Express.js** server with TypeScript
- **CORS and security** middleware
- **Comprehensive testing** with Vitest and Supertest
- **Development tools** with hot reload

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

### Installation

```bash
# Install dependencies
npm install

# Install peer dependency (schemas package)
cd ../content-automation-schemas && npm install
cd ../content-automation-api
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Docker Support

The API can be run in a Docker container for easy deployment and consistent environments.

### Building the Docker Image

```bash
# Build the Docker image
docker build -t content-automation-api .

# Build with a specific tag
docker build -t content-automation-api:latest .
```

### Running with Docker

```bash
# Run the container
docker run -p 3000:3000 content-automation-api

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  content-automation-api

# Run in detached mode
docker run -d -p 3000:3000 --name content-api content-automation-api
```

### Docker Environment Variables

When running in Docker, you can pass environment variables using the `-e` flag or by mounting an `.env` file:

```bash
# Using environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e CORS_ORIGIN=https://yourdomain.com \
  content-automation-api

# Using an env file
docker run -p 3000:3000 --env-file .env content-automation-api
```

### Docker Health Check

The Docker image includes a health check that monitors the `/health` endpoint. You can check the container health status:

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' <container_id>
```

### Docker Compose (Optional)

For easier management, you can create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

Then run with:
```bash
docker-compose up -d
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Endpoints

### Articles

- `GET /api/articles` - List all articles
- `GET /api/articles/:id` - Get article by ID
- `POST /api/articles` - Create new article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article

### Landing Pages

- `GET /api/landing-pages` - List all landing pages
- `GET /api/landing-pages/:id` - Get landing page by ID
- `POST /api/landing-pages` - Create new landing page
- `PUT /api/landing-pages/:id` - Update landing page
- `DELETE /api/landing-pages/:id` - Delete landing page

### Advertisements

- `GET /api/ads` - List all ads
- `GET /api/ads/:id` - Get ad by ID
- `POST /api/ads` - Create new ad
- `PUT /api/ads/:id` - Update ad
- `DELETE /api/ads/:id` - Delete ad

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

## Project Structure

```
src/
├── controllers/     # Request handlers
├── routes/         # API route definitions
├── middleware/     # Custom middleware
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

## Validation

All API endpoints use Zod schemas from the `content-automation-schemas` package for request validation. Invalid requests return detailed error messages with HTTP 400 status codes.

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request** - Invalid request data or validation errors
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server errors

## Development

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Adding New Endpoints

1. Define route in `src/routes/`
2. Implement controller in `src/controllers/`
3. Add validation using schemas from `content-automation-schemas`
4. Write tests in `test/`

## Contributing

1. Follow TypeScript best practices
2. Use Zod schemas for validation
3. Write comprehensive tests
4. Follow existing code style

## License

Private - Content Automation Platform
