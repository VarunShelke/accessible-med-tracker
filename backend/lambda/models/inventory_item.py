import uuid
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class InventoryItem(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    sku: str = Field(min_length=1)
    item_name: str = Field(min_length=1)
    quantity: int = Field(ge=0)
    expiration_date: date
    storage_location: str = Field(min_length=1)

    @field_validator('item_name', 'storage_location')
    @classmethod
    def validate_strings(cls, v):
        if not v.strip():
            raise ValueError('Field cannot be empty or whitespace')
        return v.strip()
