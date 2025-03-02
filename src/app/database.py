from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from .config import MONGODB_URL, DB_NAME, COLLECTION_NAME

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DB_NAME]
payments_collection = db[COLLECTION_NAME]

# Test connection
async def test_connection():
    try:
        await client.admin.command('ping')
        print("Successfully connected to MongoDB")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
