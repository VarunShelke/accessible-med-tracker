import uuid
import re
from datetime import date, datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class InventoryItem(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    sku: str = Field(min_length=1)
    item_name: str = Field(min_length=1)
    quantity: int = Field(ge=0)
    expiration_date: date
    storage_location: str = Field(min_length=1)
    category: str = Field(min_length=1)
    supplier_name: Optional[str] = None
    supplier_phone: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator('item_name', 'storage_location', 'category', 'supplier_name')
    @classmethod
    def validate_strings(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Field cannot be empty or whitespace')
        return v.strip() if v else v

    @field_validator('supplier_phone')
    @classmethod
    def validate_phone(cls, v):
        if v is not None:
            if not re.match(r'^\+[1-9]\d{1,14}$', v):
                raise ValueError('Phone number must be in E164 format (e.g., +1234567890)')
        return v
