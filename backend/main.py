from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import csv
import os
from typing import Optional
from datetime import datetime

app = FastAPI()

# Allow CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expense model
class Expense(BaseModel):
    date: str
    category: str
    subcategory: str
    description: str
    amount: float

# CSV file configuration
FILE_PATH = "expenses.csv"
FIELDNAMES = ["Date", "Category", "Subcategory", "Description", "Amount"]

# Create CSV file if it doesn't exist
if not os.path.exists(FILE_PATH):
    with open(FILE_PATH, mode='w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()

# Endpoint to add expense
@app.post("/add-expense/")
async def add_expense(expense: Expense):
    with open(FILE_PATH, mode='a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writerow({
            "Date": expense.date,
            "Category": expense.category,
            "Subcategory": expense.subcategory,
            "Description": expense.description,
            "Amount": expense.amount
        })
    return {"message": "Expense recorded"}

# Endpoint to delete expense by matching all fields
@app.post("/delete-expense/")
async def delete_expense(expense: Expense):
    updated_rows = []
    deleted = False

    with open(FILE_PATH, mode='r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if (row["Date"] == expense.date and
                row["Category"] == expense.category and
                row["Subcategory"] == expense.subcategory and
                row["Description"] == expense.description and
                float(row["Amount"]) == expense.amount and not deleted):
                deleted = True  # Delete only the first matching entry
                continue
            updated_rows.append(row)

    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")

    with open(FILE_PATH, mode='w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(updated_rows)

    return {"message": "Expense deleted successfully"}

# Endpoint to get expenses with filtering options
@app.get("/expenses/")
def get_expenses(
    date: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    month: Optional[str] = Query(None),
    from_month: Optional[str] = Query(None),
    to_month: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    from_year: Optional[int] = Query(None),
    to_year: Optional[int] = Query(None),
    search: Optional[str] = Query(None)
):
    with open(FILE_PATH, mode='r') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    # Apply time-based filters first
    if date:
        data = [row for row in data if row["Date"] == date]

    if from_date and to_date:
        try:
            from_dt = datetime.strptime(from_date, "%Y-%m-%d")
            to_dt = datetime.strptime(to_date, "%Y-%m-%d")
            data = [
                row for row in data
                if from_dt <= datetime.strptime(row["Date"], "%Y-%m-%d") <= to_dt
            ]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from/to date format")

    if month:
        data = [row for row in data if row["Date"].startswith(month)]

    if from_month and to_month:
        try:
            from_m = datetime.strptime(from_month, "%Y-%m")
            to_m = datetime.strptime(to_month, "%Y-%m")
            data = [
                row for row in data
                if from_m <= datetime.strptime(row["Date"][:7], "%Y-%m") <= to_m
            ]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from/to month format")

    if year:
        data = [row for row in data if row["Date"].startswith(str(year))]

    if from_year and to_year:
        try:
            data = [
                row for row in data
                if from_year <= int(row["Date"][:4]) <= to_year
            ]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from/to year format")

    # Finally apply search filter
    if search:
        term = search.lower()
        data = [
            row for row in data
            if term in row["Date"].lower()
            or term in row["Category"].lower()
            or term in row["Subcategory"].lower()
            or term in row["Description"].lower()
        ]

    return data
