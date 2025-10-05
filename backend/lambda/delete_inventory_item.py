import json
import os

import boto3

from utils.audit_helper import log_audit

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def handler(event, context):
    try:
        # Get item ID from path parameters
        item_id = event['pathParameters']['id']

        # Check if item exists
        response = table.get_item(Key={'id': item_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Item not found'})
            }

        item = response['Item']

        # Delete the item
        table.delete_item(Key={'id': item_id})

        # Log DELETE audit
        log_audit(
            action='DELETE',
            inventory_item_id=item_id,
            sku=item['sku'],
            item_name=item['item_name'],
            category=item.get('category', ''),
            quantity_before=int(item.get('quantity', 0)),
            quantity_after=0,
            storage_location=item.get('storage_location', ''),
            expiration_date=item.get('expiration_date')
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Item deleted successfully'})
        }

    except KeyError:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing item ID in path'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
