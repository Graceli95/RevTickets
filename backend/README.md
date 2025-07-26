# Backend Setup and Seed Data

## Running the Seed Data Script

To populate the database with demo data for development and demos:

```bash
# From the backend directory
cd backend
python src/seed_data.py
```

This will create:
- 6 demo users (3 regular users, 3 agents)
- Categories and subcategories
- Sample tickets
- Tags for organization

## Demo Login Credentials

### Regular Users:
- `john.doe@company.com` / `password123`
- `jane.smith@company.com` / `password123`
- `mike.johnson@company.com` / `password123`

### Agents:
- `sarah.wilson@company.com` / `password123`
- `david.brown@company.com` / `password123`
- `lisa.davis@company.com` / `password123`

## Running with Docker

```bash
# From project root
docker-compose up --build
```

This will start:
- MongoDB on port 27017
- Backend API on port 8000
- Frontend on port 3000

## API Documentation

Once running, visit:
- API docs: http://localhost:8000/docs
- Frontend: http://localhost:3000