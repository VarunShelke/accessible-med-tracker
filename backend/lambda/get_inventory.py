import json
import os
from datetime import date, datetime

import boto3
from botocore.exceptions import ClientError

from models import inventory_item

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def get_by_id(item_id):
    response = table.get_item(Key={'id': item_id})
    return [response['Item']] if 'Item' in response else []


def get_by_sku(sku):
    response = table.query(
        IndexName='sku-index',
        KeyConditionExpression='sku = :sku',
        ExpressionAttributeValues={':sku': sku}
    )
    return response['Items']


def get_by_category(category):
    response = table.query(
        IndexName='category-index',
        KeyConditionExpression='category = :category',
        ExpressionAttributeValues={':category': category}
    )
    return response['Items']


def get_all():
    response = table.scan()
    return response['Items']


def handler(event, context):
    try:
        params = event.get('queryStringParameters') or {}

        if params.get('id'):
            items = get_by_id(params['id'])
        elif params.get('sku'):
            items = get_by_sku(params['sku'])
        elif params.get('category'):
            items = get_by_category(params['category'])
        else:
            items = get_all()

        inventory_items = []
        for item in items:
            if 'expiration_date' in item:
                item['expiration_date'] = date.fromisoformat(item['expiration_date'])
            if 'created_at' in item:
                item['created_at'] = datetime.fromisoformat(item['created_at'])
            if 'updated_at' in item:
                item['updated_at'] = datetime.fromisoformat(item['updated_at'])

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
