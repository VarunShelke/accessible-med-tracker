import json
import random
import re
import time
import logging
import os

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

bedrock_client = boto3.client(service_name="bedrock-runtime")
dynamodb = boto3.resource('dynamodb')


def get_operation_prompt(transcribed_text):
    prompt = f"""
You are an expert AI assistant that analyzes transcribed text to determine database operations and extract product information.
The transcribed text is enclosed in `<text>`. Your task is to return a JSON response with a single field "items" containing an array of objects.

<text>
{transcribed_text}
</text>

Analyze the text and identify ALL medications or products mentioned. For each product found, determine:

1. "operation": Which operation the user wants to perform (USE, ADD)
   - ADD: Adding new items, creating records, inserting data  
   - USE: Updating usage of existing items, updating records, updating data

2. "possible_product_name": Extract the medication or product name

3. "quantity": Extract any quantity, amount, or number mentioned. Always use numeric values (convert words like "one", "two" to "1", "2", etc.)

4. "notes": Provide user-friendly error message when any field is UNSURE, otherwise empty string

If you are unsure about any field, return "UNSURE" as the value and explain the issue in "notes".

Expected JSON structure:
{{
    "items": [
        {{
            "operation": "USE|ADD|UNSURE",
            "possible_product_name": "product_name_or_UNSURE",
            "quantity": "quantity_or_UNSURE",
            "notes": "error_message_or_empty_string"
        }}
    ]
}}

CRITICAL RULES:
- Return ONLY valid JSON, no other text or explanations
- Always wrap results in an "items" array, even for a single product
- Create separate objects for each distinct product mentioned
- If multiple products share the same quantity (e.g., "I used one Tylenol and Advil"), apply that quantity to each product
- Convert word numbers to digits (one→1, two→2, etc.)

Example:
Input: "I used one Tylenol and Advil"
Output: 
{{
    "items": [
        {{
            "operation": "USE",
            "possible_product_name": "Tylenol",
            "quantity": "1",
            "notes": ""
        }},
        {{
            "operation": "USE",
            "possible_product_name": "Advil",
            "quantity": "1",
            "notes": ""
        }}
    ]
}}
"""
    return prompt


def extract_json_from_response(response_text):
    # Pattern to match JSON objects (handles nested structures)
    json_pattern = r'\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}'

    # Find all potential JSON matches
    matches = re.findall(json_pattern, response_text, re.DOTALL)

    # Try to parse each match as JSON
    for match in matches:
        try:
            parsed_json = json.loads(match)
            return parsed_json
        except json.JSONDecodeError:
            continue

    return None


def get_operation_from_bedrock(transcribed_text):
    logger.info("Analyzing transcribed text for operation classification")
    prompt = get_operation_prompt(transcribed_text)
    request = build_bedrock_payload(prompt)
    bedrock_model = os.environ.get('BEDROCK_MODEL', 'us.anthropic.claude-sonnet-4-20250514-v1:0')
    max_retries = 3
    retry_count = 0

    while retry_count < max_retries:
        try:
            logger.info(f"Invoking Bedrock model: {bedrock_model}, attempt {retry_count + 1}")
            response = bedrock_client.invoke_model(modelId=bedrock_model, body=request)
            model_response = json.loads(response["body"].read())
            response_text = model_response["content"][0]["text"].strip()

            logger.info(f"Bedrock response: {response_text}")

            # Extract JSON from response
            result = extract_json_from_response(response_text)

            # Validate items array structure
            if "items" in result and isinstance(result["items"], list) and len(result["items"]) > 0:
                # Validate each item has required fields
                for item in result["items"]:
                    if not all(field in item for field in ["operation", "possible_product_name", "quantity", "notes"]):
                        raise ValueError(f"Missing required fields in item: {item}")
                logger.info(f"Successfully parsed response: {result}")
                return result
            else:
                raise ValueError(f"Missing or invalid items array in response: {result}")

        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON response: {e}")
            retry_count += 1
        except Exception as e:
            retry_count += 1
            logger.warning(f"Attempt {retry_count} failed: {e}")

        if retry_count >= max_retries:
            logger.error(f"Failed to get valid response after {max_retries} attempts")
            raise Exception(f"Failed to get valid response after {max_retries} attempts")
        else:
            delay = min(2 ** retry_count + random.uniform(0, 1), 10)
            logger.info(f"Retrying in {delay:.2f} seconds...")
            time.sleep(delay)
    return None


def build_bedrock_payload(bedrock_prompt: str) -> str:
    native_request = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2500,
        "temperature": 0.1,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": bedrock_prompt}],
            }
        ],
    }
    return json.dumps(native_request)


def search_inventory(product_name):
    """Search inventory using case-insensitive contains on item_name"""
    try:
        table_name = os.environ.get('TABLE_NAME')
        if not table_name:
            logger.error("TABLE_NAME environment variable not set")
            return None

        table = dynamodb.Table(table_name)
        response = table.scan()

        search_name = product_name.lower()

        for item in response['Items']:
            item_name = item.get('item_name', '').lower()

            if search_name in item_name:
                return item.get('id')

        return None

    except Exception as e:
        logger.error(f"Error searching inventory: {str(e)}")
        return None


def handler(event, context):
    try:
        logger.info("Starting bedrock analysis lambda execution")
        body = json.loads(event['body'])
        transcribed_text = body.get('text')

        if not transcribed_text:
            logger.error("Missing text attribute in request body")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing text attribute in request body'})
            }

        logger.info(f"Processing transcribed text: {transcribed_text[:100]}...")
        result = get_operation_from_bedrock(transcribed_text)

        # Process each item in the response
        for item in result.get('items', []):
            # Search for product in inventory if product name is identified
            possible_product_id = "NOT_FOUND"
            if item.get('possible_product_name') and item['possible_product_name'] != "UNSURE":
                found_id = search_inventory(item['possible_product_name'])
                if found_id:
                    possible_product_id = found_id

            item['possible_product_id'] = possible_product_id

        logger.info(f"Successfully analyzed text: {result}")
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }

    except Exception as e:
        logger.error(f"Error in bedrock analysis: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
