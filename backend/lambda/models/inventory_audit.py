import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class InventoryAudit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    audit_date: str  # YYYY-MM-DD format for partition key
    timestamp: datetime
    inventory_item_id: str
    action: str  # CREATE, UPDATE, RESTOCK, DELETE
    sku: str
    item_name: str
    category: str
    quantity_before: int = Field(ge=0)
    quantity_after: int = Field(ge=0)
    quantity_delta: int
    storage_location: str
    expiration_date: Optional[str] = None  # ISO format date string

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
