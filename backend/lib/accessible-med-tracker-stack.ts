import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import {Construct} from 'constructs';

export class AccessibleMedTrackerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const inventoryTable = new dynamodb.Table(this, 'med-tracker-inventory', {
            partitionKey: {name: 'id', type: dynamodb.AttributeType.STRING},
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        inventoryTable.addGlobalSecondaryIndex({
            indexName: 'sku-index',
            partitionKey: {name: 'sku', type: dynamodb.AttributeType.STRING}
        });

        inventoryTable.addGlobalSecondaryIndex({
            indexName: 'category-index',
            partitionKey: {name: 'category', type: dynamodb.AttributeType.STRING}
        });

        // SNS Topic for mobile notifications
        const notificationTopic = new sns.Topic(this, 'InventoryNotificationTopic', {
            topicName: 'inventory-low-stock-alerts'
        });

        // Lambda function configuration
        const lambdaConfig = {
            runtime: lambda.Runtime.PYTHON_3_12,
            architecture: lambda.Architecture.ARM_64,
            code: lambda.Code.fromAsset('lambda', {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_12.bundlingImage,
                    platform: 'linux/arm64',
                    command: [
                        'bash', '-c',
                        'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
                    ]
                }
            }),
            timeout: cdk.Duration.minutes(10),
            environment: {
                TABLE_NAME: inventoryTable.tableName
            }
        };

        // Create inventory Lambda function
        const createInventoryFunction = new lambda.Function(this, 'CreateInventoryFunction', {
            functionName: 'create-inventory-item',
            handler: 'create_inventory_item.handler',
            ...lambdaConfig
        });

        // Get inventory Lambda function
        const getInventoryFunction = new lambda.Function(this, 'GetInventoryFunction', {
            functionName: 'get-inventory',
            handler: 'get_inventory.handler',
            ...lambdaConfig
        });

        // Delete inventory Lambda function
        const deleteInventoryFunction = new lambda.Function(this, 'DeleteInventoryFunction', {
            functionName: 'delete-inventory-item',
            handler: 'delete_inventory_item.handler',
            ...lambdaConfig
        });

        // Update inventory Lambda function
        const updateInventoryFunction = new lambda.Function(this, 'UpdateInventoryFunction', {
            functionName: 'update-inventory-item',
            handler: 'update_inventory_item.handler',
            ...lambdaConfig
        });

        // Bedrock analysis Lambda function
        const bedrockAnalysisFunction = new lambda.Function(this, 'BedrockAnalysisFunction', {
            functionName: 'bedrock-analysis',
            handler: 'bedrock_analysis.handler',
            ...lambdaConfig,
            environment: {
                ...lambdaConfig.environment,
                BEDROCK_MODEL: 'us.anthropic.claude-sonnet-4-20250514-v1:0'
            }
        });

        // Inventory monitor Lambda function
        const inventoryMonitorFunction = new lambda.Function(this, 'InventoryMonitorFunction', {
            functionName: 'inventory-monitor',
            handler: 'inventory_monitor.handler',
            ...lambdaConfig,
            environment: {
                ...lambdaConfig.environment,
                SNS_TOPIC_ARN: notificationTopic.topicArn,
                GMAIL_USER: 'shelkevarun@gmail.com', // Replace with your Gmail
                GMAIL_PASSWORD: 'etxbonkbfahclbpb', // Replace with Gmail App Password
                RECIPIENT_EMAILS: 'vps27@pitt.edu,Varun.Shelke@hotmail.com' // Replace with actual emails
            }
        });

        // EventBridge rule for 15-minute schedule
        const inventoryCheckRule = new events.Rule(this, 'InventoryCheckRule', {
            schedule: events.Schedule.rate(cdk.Duration.minutes(15))
        });
        inventoryCheckRule.addTarget(new targets.LambdaFunction(inventoryMonitorFunction));

        // Bedrock IAM permissions
        bedrockAnalysisFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream'
            ],
            resources: [
                'arn:aws:bedrock:us-*::foundation-model/*',
                `arn:aws:bedrock:us-*:${this.account}:inference-profile/*`
            ]
        }));

        inventoryTable.grantReadData(bedrockAnalysisFunction);
        inventoryTable.grantReadWriteData(createInventoryFunction);
        inventoryTable.grantReadData(getInventoryFunction);
        inventoryTable.grantReadWriteData(deleteInventoryFunction);
        inventoryTable.grantReadWriteData(updateInventoryFunction);
        inventoryTable.grantReadData(inventoryMonitorFunction);

        // Grant SNS publish permissions to inventory monitor
        notificationTopic.grantPublish(inventoryMonitorFunction);

        // API Gateway
        const api = new apigateway.RestApi(this, 'MedTrackerApi', {
            restApiName: 'Med Tracker API',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS
            }
        });

        const inventory = api.root.addResource('inventory');
        inventory.addMethod('GET', new apigateway.LambdaIntegration(getInventoryFunction));
        inventory.addMethod('POST', new apigateway.LambdaIntegration(createInventoryFunction));

        const inventoryItem = inventory.addResource('{id}');
        inventoryItem.addMethod('DELETE', new apigateway.LambdaIntegration(deleteInventoryFunction));
        inventoryItem.addMethod('PUT', new apigateway.LambdaIntegration(updateInventoryFunction));

        const analysis = api.root.addResource('analysis');
        analysis.addMethod('POST', new apigateway.LambdaIntegration(bedrockAnalysisFunction));
    }
}
