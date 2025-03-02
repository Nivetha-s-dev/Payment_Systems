from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from typing import List, Optional
import polars as pl
from datetime import datetime, date
from bson import ObjectId
import gridfs
from .database import db, payments_collection
from .models import Payment, PaymentStatus
from .utils import calculate_total_due, update_payment_status

app = FastAPI()
fs = gridfs.GridFS(db)

@app.get("/payments/")
async def get_payments(
        page: int = Query(1, gt=0),
        limit: int = Query(10, gt=0),
        payment_status: Optional[PaymentStatus] = None,
        search: Optional[str] = None
):
    skip = (page - 1) * limit
    query = {}

    if payment_status:
        query["payee_payment_status"] = payment_status

    if search:
        query["$or"] = [
            {"payee_first_name": {"$regex": search, "$options": "i"}},
            {"payee_last_name": {"$regex": search, "$options": "i"}},
            {"payee_email": {"$regex": search, "$options": "i"}}
        ]

    cursor = payments_collection.find(query).skip(skip).limit(limit)
    payments = await cursor.to_list(length=limit)

    for payment in payments:
        payment["_id"] = str(payment["_id"])
        update_payment_status(payment)

    return payments

@app.post("/payments/create")
async def create_payment(payment: Payment):
    payment_dict = payment.dict()
    payment_dict["total_due"] = calculate_total_due(
        payment_dict["due_amount"],
        payment_dict.get("discount_percent"),
        payment_dict.get("tax_percent")
    )

    result = await payments_collection.insert_one(payment_dict)
    payment_dict["_id"] = str(result.inserted_id)
    return payment_dict

@app.put("/payments/{payment_id}")
async def update_payment(payment_id: str, payment_update: dict):
    try:
        result = await payments_collection.update_one(
            {"_id": ObjectId(payment_id)},
            {"$set": payment_update}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Payment not found")

        updated_payment = await payments_collection.find_one(
            {"_id": ObjectId(payment_id)}
        )
        updated_payment["_id"] = str(updated_payment["_id"])
        return updated_payment
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str):
    try:
        result = await payments_collection.delete_one(
            {"_id": ObjectId(payment_id)}
        )
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Payment not found")
        return {"message": "Payment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/payments/{payment_id}/evidence")
async def upload_evidence(payment_id: str, file: UploadFile = File(...)):
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")

    # Read file content
    contents = await file.read()

    # Store file in GridFS
    file_id = fs.put(
        contents,
        filename=file.filename,
        content_type=file.content_type,
        payment_id=payment_id
    )

    # Update payment status
    await payments_collection.update_one(
        {"_id": ObjectId(payment_id)},
        {
            "$set": {
                "payee_payment_status": PaymentStatus.COMPLETED,
                "evidence_file_id": str(file_id)
            }
        }
    )

    return {"message": "Evidence uploaded successfully"}

@app.get("/payments/{payment_id}/evidence")
async def download_evidence(payment_id: str):
    # Find payment
    payment = await payments_collection.find_one({"_id": ObjectId(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if "evidence_file_id" not in payment:
        raise HTTPException(status_code=404, detail="No evidence file found")

    # Get file from GridFS
    file_id = ObjectId(payment["evidence_file_id"])
    grid_out = fs.get(file_id)

    return FileResponse(
        grid_out,
        media_type=grid_out.content_type,
        filename=grid_out.filename
    )
