from pymongo import MongoClient
from datetime import datetime

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')

# Create database
db = client['payments_db']

# Create collection
payments = db['payments']

# Insert sample document
sample_payment = {
    "payee_first_name": "John",
    "payee_last_name": "Doe",
    "payee_payment_status": "pending",
    "payee_added_date_utc": datetime.utcnow(),
    "payee_due_date": "2024-02-01",
    "payee_address_line_1": "123 Main St",
    "payee_city": "New York",
    "payee_country": "US",
    "payee_postal_code": "10001",
    "payee_phone_number": "+12125551234",
    "payee_email": "john.doe@example.com",
    "currency": "USD",
    "due_amount": 1000.00,
    "total_due": 1000.00
}

# Insert the document
result = payments.insert_one(sample_payment)

print(f"Database created with sample document. Document ID: {result.inserted_id}")

# Verify database and collection
print("\nAvailable databases:")
print(client.list_database_names())

print("\nCollections in payments_db:")
print(db.list_collection_names())
