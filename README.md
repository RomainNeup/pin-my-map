# Pin My Map

Pin My Map is the easiest way to create your own personal map, filled with your favorite places in every city around the world.

- 🎯 Save addresses you love.
- 🗂️ Organise them by categories.
- ✅ Track places you've already visited.
- ✨ Plan the spots you want to check out next.

Accessible anywhere. Ultra-fast. 100% Open Source.

## Project Architecture

### Technology Stack

#### Frontend
- **Framework**: SvelteKit
- **Styling**: Tailwind CSS
- **Map Integration**: Mapbox
- **State Management**: Svelte stores

#### Backend
- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based authentication
- **API Documentation**: Swagger

### Project Structure

```
pin-my-map/
├── front/                  # Frontend SvelteKit application
│   ├── src/
│   │   ├── lib/            # Reusable components and utilities
│   │   │   ├── api/        # API client functions
│   │   │   ├── components/ # UI components
│   │   │   └── store/      # Svelte stores for state management
│   │   ├── routes/         # Application routes
│   │   └── app.html        # Main HTML template
│   ├── static/             # Static assets
│   └── ...
└── back/                   # Backend NestJS application
    ├── src/
    │   ├── auth/           # Authentication module
    │   ├── place/          # Place module for location data
    │   ├── saved/          # Saved places module
    │   ├── tag/            # Tags module
    │   ├── user/           # User module
    │   └── ...
    └── ...
```

## Features

- **Place Saving**: Save your favorite places with location data, descriptions, and addresses
- **Tagging System**: Organize saved places with custom tags
- **Rating & Comments**: Add personal ratings and comments to saved places
- **Done Marker**: Mark places as visited/done
- **Map Visualization**: View saved places on an interactive map
- **Authentication**: Secure user accounts with authentication

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- Yarn package manager
- MongoDB instance
- Mapbox account for API access token

### Environment Variables

#### Frontend (front/.env)
```
PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
PUBLIC_API_BASE_URL=http://localhost:3000
```

#### Backend (back/.env)
```
MONGODB_URI=mongodb://localhost:27017/pin-my-map
JWT_SECRET=your_jwt_secret
PORT=3000
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
NODE_ENV=development
```

### Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pin-my-map.git
   cd pin-my-map
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   # Install frontend dependencies
   cd front
   yarn install

   # Install backend dependencies
   cd ../back
   yarn install
   ```

3. Start the development servers:
   ```bash
   # Start the backend server
   cd back
   yarn start:dev

   # In a separate terminal, start the frontend server
   cd front
   yarn dev
   ```

4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api

## Docker Setup

The project includes Docker configuration for easy deployment.

### Docker Compose Setup

1. Create a `docker-compose.yml` file in the project root:
   ```yaml
   version: '3'
   services:
     mongodb:
       image: mongo:latest
       ports:
         - "27017:27017"
       volumes:
         - mongo_data:/data/db
       environment:
         - MONGO_INITDB_DATABASE=pin-my-map
       networks:
         - pin-my-map-network

     backend:
       build:
         context: ./back
         dockerfile: Dockerfile
       ports:
         - "3000:3000"
       depends_on:
         - mongodb
       environment:
         - MONGODB_URI=mongodb://mongodb:27017/pin-my-map
         - JWT_SECRET=your_secure_jwt_secret
       networks:
         - pin-my-map-network

     frontend:
       build:
         context: ./front
         dockerfile: Dockerfile
       ports:
         - "80:80"
       depends_on:
         - backend
       environment:
         - PUBLIC_API_BASE_URL=http://localhost:3000
         - PUBLIC_MAPBOX_ACCESS_TOKEN=${MAPBOX_TOKEN}
       networks:
         - pin-my-map-network

   networks:
     pin-my-map-network:
       driver: bridge

   volumes:
     mongo_data:
   ```

2. Create a `Dockerfile` in the `back/` directory:
   ```dockerfile
   FROM node:16-alpine

   WORKDIR /app

   COPY package.json yarn.lock ./
   RUN yarn install --frozen-lockfile

   COPY . .
   RUN yarn build

   EXPOSE 3000

   CMD ["node", "dist/main"]
   ```

3. Create a `Dockerfile` in the `front/` directory:
   ```dockerfile
   FROM node:16-alpine as build

   WORKDIR /app

   COPY package.json yarn.lock ./
   RUN yarn install --frozen-lockfile

   COPY . .
   RUN yarn build

   FROM nginx:alpine

   COPY --from=build /app/build /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf

   EXPOSE 80

   CMD ["nginx", "-g", "daemon off;"]
   ```

4. Create an nginx configuration file (`front/nginx.conf`):
   ```
   server {
       listen 80;
       root /usr/share/nginx/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://backend:3000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

5. Run with Docker Compose:
   ```bash
   export MAPBOX_TOKEN=your_mapbox_token
   docker-compose up -d
   ```

### Running with Docker

After setting up Docker Compose, you can:

- Start all services: `docker-compose up -d`
- View logs: `docker-compose logs -f`
- Stop all services: `docker-compose down`
- Rebuild and start: `docker-compose up -d --build`

## Development Guidelines

### Code Style

- Frontend: Follow ESLint configuration in `front/eslint.config.js`
- Backend: Follow ESLint configuration in `back/.eslintrc.js`

### Git Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and commit with descriptive messages
3. Push your branch and create a pull request
4. Request code review
5. After approval, merge to main branch

### Testing

#### Backend
```bash
cd back
# Run unit tests
yarn test
# Run e2e tests
yarn test:e2e
# Check test coverage
yarn test:cov
```

#### Frontend
```bash
cd front
# Run tests
yarn test
```

## API Documentation

The API documentation is available at `http://localhost:3000/api` when the backend server is running. It's generated using Swagger and provides interactive documentation for all available endpoints.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or feedback, please open an issue on the project's GitHub repository.