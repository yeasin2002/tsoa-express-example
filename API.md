# Todo API Documentation

A full-featured Todo application API built with Bun, SQLite, and tsoa.

## Features

- User management (CRUD operations)
- Todo management (CRUD operations)
- Proper error handling with typed responses
- OpenAPI/Swagger documentation
- SQLite database with WAL mode for performance
- Query parameters for filtering and pagination

## Getting Started

### Install dependencies

```bash
bun install
```

### Start the server

```bash
bun run dev
```

The server will run at `http://localhost:9000`

### View API Documentation

Open `http://localhost:9000/docs` in your browser to see the interactive Swagger UI.

## API Endpoints

### Users

#### GET /users

Get all users with pagination

- Query params: `limit` (default: 100), `offset` (default: 0)
- Response: `200` - Array of users

#### GET /users/{id}

Get a specific user by ID

- Path param: `id` (number)
- Response: `200` - User object
- Response: `404` - User not found

#### POST /users

Create a new user

- Body: `{ name: string, email: string }`
- Response: `201` - Created user
- Response: `400` - Invalid request (e.g., email already exists)

#### PUT /users/{id}

Update an existing user

- Path param: `id` (number)
- Body: `{ name?: string, email?: string }`
- Response: `200` - Updated user
- Response: `404` - User not found
- Response: `400` - Invalid request

#### DELETE /users/{id}

Delete a user

- Path param: `id` (number)
- Response: `204` - User deleted
- Response: `404` - User not found

### Todos

#### GET /todos

Get all todos with filtering

- Query params:
  - `user_id` (number, optional) - Filter by user
  - `completed` (boolean, optional) - Filter by completion status
  - `limit` (number, default: 100) - Max results
  - `offset` (number, default: 0) - Skip results
- Response: `200` - Array of todos

#### GET /todos/{id}

Get a specific todo by ID

- Path param: `id` (number)
- Response: `200` - Todo object
- Response: `404` - Todo not found

#### GET /todos/user/{userId}

Get all todos for a specific user

- Path param: `userId` (number)
- Query param: `completed` (boolean, optional)
- Response: `200` - Array of todos

#### POST /todos

Create a new todo

- Body: `{ user_id: number, title: string, description?: string }`
- Response: `201` - Created todo
- Response: `400` - Invalid request (e.g., user not found)

#### PUT /todos/{id}

Update an existing todo

- Path param: `id` (number)
- Body: `{ title?: string, description?: string, completed?: boolean }`
- Response: `200` - Updated todo
- Response: `404` - Todo not found

#### DELETE /todos/{id}

Delete a todo

- Path param: `id` (number)
- Response: `204` - Todo deleted
- Response: `404` - Todo not found

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Todos Table

```sql
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

## Example Usage

### Create a user

```bash
curl -X POST http://localhost:9000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### Create a todo

```bash
curl -X POST http://localhost:9000/todos \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "title": "Learn Bun", "description": "Study Bun documentation"}'
```

### Get user's todos

```bash
curl http://localhost:9000/todos/user/1
```

### Update todo

```bash
curl -X PUT http://localhost:9000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

## Windows Users

If using PowerShell, use `Invoke-RestMethod` instead of `curl`:

```powershell
# Create user
Invoke-RestMethod -Uri http://localhost:9000/users -Method POST `
  -Body (@{name="John Doe";email="john@example.com"} | ConvertTo-Json) `
  -ContentType "application/json"

# Create todo
Invoke-RestMethod -Uri http://localhost:9000/todos -Method POST `
  -Body (@{user_id=1;title="Learn Bun"} | ConvertTo-Json) `
  -ContentType "application/json"

# Get todos
Invoke-RestMethod -Uri http://localhost:9000/todos -Method GET

# Update todo
Invoke-RestMethod -Uri http://localhost:9000/todos/1 -Method PUT `
  -Body (@{completed=$true} | ConvertTo-Json) `
  -ContentType "application/json"
```
