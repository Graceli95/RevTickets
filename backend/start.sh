#!/bin/bash

echo "Starting TicketSystem Backend..."

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
while ! nc -z mongo 27017; do
    sleep 1
done
echo "MongoDB is ready!"

# Run seed data (only if not already populated)
echo "Checking for existing data..."
python -c "
import asyncio
from src.models.user import User
from src.db.init_db import init_db

async def check_data():
    await init_db()
    users = await User.find_all().to_list()
    if len(users) == 0:
        print('No users found, running seed data...')
        exit(1)
    else:
        print(f'Found {len(users)} users, skipping seed data')
        exit(0)

asyncio.run(check_data())
"

if [ $? -eq 1 ]; then
    echo "Running seed data script..."
    python -m src.seed_data
else
    echo "Database already populated, skipping seed data"
fi

# Start the FastAPI server
echo "Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port 8000