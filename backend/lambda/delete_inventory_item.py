import json
import os

import boto3

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

        # Delete the item
        table.delete_item(Key={'id': item_id})

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
