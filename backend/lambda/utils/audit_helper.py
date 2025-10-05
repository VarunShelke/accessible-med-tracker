import os
from datetime import datetime, timezone
from typing import Optional

import boto3

from models.inventory_audit import InventoryAudit

dynamodb = boto3.resource('dynamodb')


def log_audit(
    action: str,
    inventory_item_id: str,
    sku: str,
    item_name: str,
    category: str,
    quantity_before: int,
    quantity_after: int,
    storage_location: str,
    expiration_date: Optional[str] = None
) -> None:
    """
    Log an audit entry for inventory operations.

    Args:
        action: One of CREATE, UPDATE, RESTOCK, DELETE
        inventory_item_id: UUID of the inventory item
        sku: Item SKU
        item_name: Item name
        category: Item category
        quantity_before: Quantity before the operation
        quantity_after: Quantity after the operation
        storage_location: Storage location
        expiration_date: Expiration date (ISO format string)
    """
    try:
        audit_table = dynamodb.Table(os.environ['AUDIT_TABLE_NAME'])

        now = datetime.now(timezone.utc)
        quantity_delta = quantity_after - quantity_before

        audit_entry = InventoryAudit(
            audit_date=now.strftime('%Y-%m-%d'),
            timestamp=now,
            inventory_item_id=inventory_item_id,
            action=action,
            sku=sku,
            item_name=item_name,
            category=category,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            quantity_delta=quantity_delta,
            storage_location=storage_location,
            expiration_date=expiration_date
        )

        # Convert to dict for DynamoDB
        audit_data = audit_entry.model_dump()
        audit_data['timestamp'] = now.isoformat()

        audit_table.put_item(Item=audit_data)

    except Exception as e:
        # Log error but don't fail the main operation
        print(f"Error logging audit: {str(e)}")
