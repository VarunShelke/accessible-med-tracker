import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
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
            timeout: cdk.Duration.minutes(2),
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

        inventoryTable.grantReadWriteData(createInventoryFunction);
        inventoryTable.grantReadData(getInventoryFunction);
        inventoryTable.grantReadWriteData(deleteInventoryFunction);
        inventoryTable.grantReadWriteData(updateInventoryFunction);

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
