import json
import os
from datetime import date

import boto3
from botocore.exceptions import ClientError

from models import inventory_item

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def handler(event, context):
    try:
        response = table.scan()
        items = response['Items']

        inventory_items = []
        for item in items:
            # Convert DynamoDB date string to date object
            if 'expiration_date' in item:
                item['expiration_date'] = date.fromisoformat(item['expiration_date'])

            item = inventory_item.InventoryItem(**item)
            inventory_items.append(item.model_dump(mode='json'))

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'inventory': inventory_items})
        }

    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'DynamoDB error: {str(e)}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Internal error: {str(e)}'})
        }
