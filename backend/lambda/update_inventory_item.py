import json
import os
from datetime import date, datetime, timezone

import boto3

from utils.audit_helper import log_audit

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def handler(event, context):
    try:
        item_id = event['pathParameters']['id']
        body = json.loads(event['body'])

        # Build update expression
        update_expression = "SET updated_at = :updated_at"
        expression_values = {':updated_at': datetime.now(timezone.utc).isoformat()}
        expression_names = {}
        updates = []

        if 'quantity' in body:
            updates.append("#q = :quantity")
            expression_names['#q'] = 'quantity'
            expression_values[':quantity'] = int(body['quantity'])

        if 'item_name' in body:
            updates.append("item_name = :item_name")
            expression_values[':item_name'] = body['item_name'].strip()

        if 'storage_location' in body:
            updates.append("storage_location = :storage_location")
            expression_values[':storage_location'] = body['storage_location'].strip()

        if 'expiration_date' in body:
            exp_date = date.fromisoformat(body['expiration_date'])
            updates.append("expiration_date = :expiration_date")
            expression_values[':expiration_date'] = exp_date.isoformat()

        if 'category' in body:
            updates.append("category = :category")
            expression_values[':category'] = body['category'].strip()

        if updates:
            update_expression += ", " + ", ".join(updates)

        # Get item before update for audit logging
        get_response = table.get_item(Key={'id': item_id})
        if 'Item' not in get_response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Item not found'})
            }

        old_item = get_response['Item']

        # Update item
        response = table.update_item(
            Key={'id': item_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ExpressionAttributeNames=expression_names if expression_names else None,
            ConditionExpression='attribute_exists(id)',
            ReturnValues='ALL_NEW'
        )

        item = response['Attributes']

        # Log UPDATE audit
        log_audit(
            action='UPDATE',
            inventory_item_id=item_id,
            sku=item['sku'],
            item_name=item['item_name'],
            category=item.get('category', ''),
            quantity_before=int(old_item.get('quantity', 0)),
            quantity_after=int(item['quantity']),
            storage_location=item['storage_location'],
            expiration_date=item.get('expiration_date')
        )
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Item updated successfully',
                'item': {
                    'id': item['id'],
                    'sku': item['sku'],
                    'item_name': item['item_name'],
                    'quantity': int(item['quantity']),
                    'expiration_date': item['expiration_date'],
                    'storage_location': item['storage_location'],
                    'category': item.get('category'),
                    'created_at': item.get('created_at'),
                    'updated_at': item['updated_at']
                }
            })
        }

    except KeyError:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing item ID'})
        }
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON'})
        }
    except Exception as e:
        if 'ConditionalCheckFailedException' in str(e):
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Item not found'})
            }
        return {
            'statusCode': 400,
            'body': json.dumps({'error': str(e)})
        }
