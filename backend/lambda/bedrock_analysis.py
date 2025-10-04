import json
import random
import time
import logging
import os

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

bedrock_client = boto3.client(service_name="bedrock-runtime")


def get_operation_prompt(transcribed_text):
    prompt = f"""
You are an expert AI assistant that analyzes transcribed text to determine database operations and extract product information.
The transcribed text is enclosed in `<text>`. Your task is to return a JSON response with exactly these three fields:

<text>
{transcribed_text}
</text>

Analyze the text and determine:
1. "operation": Which operation the user wants to perform (CREATE, READ, UPDATE, DELETE)
   - CREATE: Adding new items, creating records, inserting data
   - READ: Getting information, searching, viewing, listing items  
   - UPDATE: Modifying existing items, changing data, editing records
   - DELETE: Removing items, deleting records, clearing data

2. "possible_product_name": Extract any medication or product name mentioned

3. "quantity": Extract any quantity, amount, or number mentioned

If you are unsure about any field, return "UNSURE" as the value.

Expected JSON structure:
{{
    "operation": "CREATE|READ|UPDATE|DELETE|UNSURE",
    "possible_product_name": "product_name_or_UNSURE", 
    "quantity": "quantity_or_UNSURE"
}}

Return ONLY a valid JSON object matching this exact structure. Do not include any other text or explanations outside of the JSON.
"""
    return prompt


def get_operation_from_bedrock(transcribed_text):
    logger.info(f"Analyzing transcribed text for operation classification")
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

            # Parse JSON response
            result = json.loads(response_text)

            # Validate required fields exist
            if "operation" in result and "possible_product_name" in result and "quantity" in result:
                logger.info(f"Successfully parsed response: {result}")
                return result
            else:
                raise ValueError(f"Missing required fields in response: {result}")

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


def build_bedrock_payload(bedrock_prompt: str) -> str:
    native_request = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 200,
        "temperature": 0.1,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": bedrock_prompt}],
            }
        ],
    }
    return json.dumps(native_request)


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
