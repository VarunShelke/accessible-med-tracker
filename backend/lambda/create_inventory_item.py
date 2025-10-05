import json
import os
from datetime import datetime, timezone

import boto3

from models.inventory_item import InventoryItem
from utils.audit_helper import log_audit

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def handler(event, context):
    try:
        # Parse request body
        body = json.loads(event['body'])

        # Validate input using Pydantic model
        new_item = InventoryItem(**body)

        # Query existing item by SKU
        response = table.query(
            IndexName='sku-index',
            KeyConditionExpression='sku = :sku',
            ExpressionAttributeValues={':sku': new_item.sku}
        )

        if response['Items']:
            # Update existing item
            existing_item = response['Items'][0]
            now = datetime.now(timezone.utc).isoformat()

            # Add quantities
            new_quantity = existing_item['quantity'] + new_item.quantity

            # Update item
            update_expression = 'SET quantity = :quantity, updated_at = :updated_at'
            expression_values = {
                ':quantity': new_quantity,
                ':updated_at': now
            }

            # Only update if new values provided
            if body.get('storage_location'):
                update_expression += ', storage_location = :location'
                expression_values[':location'] = new_item.storage_location

            if body.get('expiration_date'):
                update_expression += ', expiration_date = :exp_date'
                expression_values[':exp_date'] = new_item.expiration_date.isoformat()

            if body.get('category'):
                update_expression += ', category = :category'
                expression_values[':category'] = new_item.category

            if body.get('supplier_name'):
                update_expression += ', supplier_name = :supplier_name'
                expression_values[':supplier_name'] = new_item.supplier_name

            if body.get('supplier_phone'):
                update_expression += ', supplier_phone = :supplier_phone'
                expression_values[':supplier_phone'] = new_item.supplier_phone

            table.update_item(
                Key={'id': existing_item['id']},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values
            )

            # Get updated item
            updated_item = table.get_item(Key={'id': existing_item['id']})['Item']

            # Log RESTOCK audit
            log_audit(
                action='RESTOCK',
                inventory_item_id=existing_item['id'],
                sku=updated_item['sku'],
                item_name=updated_item['item_name'],
                category=updated_item['category'],
                quantity_before=existing_item['quantity'],
                quantity_after=int(updated_item['quantity']),
                storage_location=updated_item['storage_location'],
                expiration_date=updated_item.get('expiration_date')
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Inventory item updated successfully',
                    'item': {
                        'id': updated_item['id'],
                        'sku': updated_item['sku'],
                        'item_name': updated_item['item_name'],
                        'quantity': int(updated_item['quantity']),
                        'expiration_date': updated_item['expiration_date'],
                        'storage_location': updated_item['storage_location'],
                        'category': updated_item['category'],
                        'created_at': updated_item['created_at'],
                        'updated_at': updated_item['updated_at']
                    }
                })
            }
        else:
            # Create new item
            now = datetime.now(timezone.utc).isoformat()
            item_data = {
                'id': new_item.id,
                'sku': new_item.sku,
                'item_name': new_item.item_name,
                'quantity': new_item.quantity,
                'expiration_date': new_item.expiration_date.isoformat(),
                'storage_location': new_item.storage_location,
                'category': new_item.category,
                'supplier_name': new_item.supplier_name,
                'supplier_phone': new_item.supplier_phone,
                'created_at': now,
                'updated_at': now
            }

            table.put_item(Item=item_data)

            # Log CREATE audit
            log_audit(
                action='CREATE',
                inventory_item_id=item_data['id'],
                sku=item_data['sku'],
                item_name=item_data['item_name'],
                category=item_data['category'],
                quantity_before=0,
                quantity_after=item_data['quantity'],
                storage_location=item_data['storage_location'],
                expiration_date=item_data['expiration_date']
            )

            return {
                'statusCode': 201,
                'body': json.dumps({
                    'message': 'Inventory item created successfully',
                    'item': {
                        'id': item_data['id'],
                        'sku': item_data['sku'],
                        'item_name': item_data['item_name'],
                        'quantity': item_data['quantity'],
                        'expiration_date': item_data['expiration_date'],
                        'storage_location': item_data['storage_location'],
                        'category': item_data['category'],
                        'supplier_name': item_data['supplier_name'],
                        'supplier_phone': item_data['supplier_phone'],
                        'created_at': item_data['created_at'],
                        'updated_at': item_data['updated_at']
                    }
                })
            }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    except Exception as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': str(e)})
        }
