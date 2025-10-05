import json
import os
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import boto3

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')


def format_phone_number(phone):
    """Format E164 phone number for better readability"""
    if not phone:
        return phone
    
    # For US/Canada numbers (+1XXXXXXXXXX)
    if phone.startswith('+1') and len(phone) == 12:
        return f"+1 ({phone[2:5]}) {phone[5:8]}-{phone[8:]}"
    
    # For other countries, just add spaces every 3-4 digits
    clean_phone = phone[1:]  # Remove +
    if len(clean_phone) >= 10:
        return f"+{clean_phone[:2]} {clean_phone[2:5]} {clean_phone[5:8]} {clean_phone[8:]}"
    
    return phone  # Return original if can't format


def create_html_email(low_stock_items):
    """Create accessible HTML email template for low stock alerts"""
    html_body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Low Stock Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <header style="background-color: #d32f2f; color: white; padding: 20px; text-align: center; border-radius: 5px;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ Low Stock Alert</h1>
        </header>
        
        <main style="padding: 20px 0;">
            <p style="font-size: 16px; margin-bottom: 20px;">
                <strong>{len(low_stock_items)} items</strong> are currently low in stock and require immediate attention.
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;" role="table" aria-label="Low stock items">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Item Name</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Current Stock</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Supplier</th>
                    </tr>
                </thead>
                <tbody>
    """

    for item in low_stock_items:
        formatted_phone = format_phone_number(item.get('supplier_phone'))
        supplier_info = f"{item.get('supplier_name', '')}<br><a href=\"tel:{item.get('supplier_phone', '')}\" style=\"color: #1976d2; text-decoration: none;\">{formatted_phone}</a>" if item.get('supplier_phone') else item.get('supplier_name', '')
        
        html_body += f"""
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">{item['item_name']}</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #d32f2f; font-weight: bold;">{item['quantity']}</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">{supplier_info}</td>
                    </tr>
        """

    html_body += """
                </tbody>
            </table>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
                Please restock these items as soon as possible to avoid service disruption.
            </p>
        </main>
        
        <footer style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px; font-size: 12px; color: #666;">
            <p>This is an automated alert from your Medical Inventory Tracker system.</p>
        </footer>
    </body>
    </html>
    """
    return html_body


def send_email_notification(low_stock_items):
    """Send HTML email notification via Gmail SMTP"""
    gmail_user = os.environ['GMAIL_USER']
    gmail_password = os.environ['GMAIL_PASSWORD']
    recipient_emails = os.environ['RECIPIENT_EMAILS'].split(',')

    subject = f"🚨 Low Stock Alert - {len(low_stock_items)} Items Need Restocking"
    html_body = create_html_email(low_stock_items)

    # Create plain text version
    item_list = []
    for item in low_stock_items:
        supplier_text = ""
        if item.get('supplier_name') or item.get('supplier_phone'):
            supplier_parts = []
            if item.get('supplier_name'):
                supplier_parts.append(item['supplier_name'])
            if item.get('supplier_phone'):
                supplier_parts.append(format_phone_number(item['supplier_phone']))
            supplier_text = f" (Supplier: {' - '.join(supplier_parts)})"
        
        item_list.append(f"- {item['item_name']}: {item['quantity']} remaining{supplier_text}")
    
    text_body = f"""Low Stock Alert

{len(low_stock_items)} items are currently low in stock:

{chr(10).join(item_list)}

Please restock these items as soon as possible.

This is an automated alert from your Medical Inventory Tracker system."""

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = gmail_user
        msg['To'] = ', '.join(recipient_emails)

        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(gmail_user, gmail_password)
            server.send_message(msg)

        print(f"Email sent successfully to {len(recipient_emails)} recipients")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")


def handler(event, context):
    table_name = os.environ['TABLE_NAME']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']

    table = dynamodb.Table(table_name)

    try:
        # Scan table for low stock items
        response = table.scan(
            FilterExpression='quantity < :threshold',
            ExpressionAttributeValues={':threshold': 10}
        )

        low_stock_items = response['Items']

        if low_stock_items:
            # Create summary message for SNS
            item_names = [item['item_name'] for item in low_stock_items]
            sns_message = f"{len(low_stock_items)} items are low in stock: {', '.join(item_names)}"

            # Send SNS notification (push)
            sns.publish(
                TopicArn=sns_topic_arn,
                Message=sns_message,
                Subject="Low Stock Alert"
            )

            # Send email notification
            send_email_notification(low_stock_items)

            print(f"Sent notifications for {len(low_stock_items)} low stock items")
        else:
            print("No low stock items found")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Checked inventory. Found {len(low_stock_items)} low stock items.'
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
