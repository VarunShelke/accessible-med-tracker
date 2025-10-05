import json
import os
from datetime import date, datetime
from decimal import Decimal

import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError


def handler(event, context):
    try:
        threshold = int(os.environ.get('LOW_INVENTORY_THRESHOLD', '15'))

        response = table.scan(
            FilterExpression='quantity < :threshold',
            ExpressionAttributeValues={':threshold': threshold}
        )

        items = response['Items']

        # Sort by quantity ascending
        items.sort(key=lambda x: x['quantity'])

        # Convert datetime objects to strings for JSON serialization
        for item in items:
            if 'created_at' in item and isinstance(item['created_at'], datetime):
                item['created_at'] = item['created_at'].isoformat()
            if 'updated_at' in item and isinstance(item['updated_at'], datetime):
                item['updated_at'] = item['updated_at'].isoformat()
            if 'expiration_date' in item and isinstance(item['expiration_date'], date):
                item['expiration_date'] = item['expiration_date'].isoformat()

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(items, default=decimal_default)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
