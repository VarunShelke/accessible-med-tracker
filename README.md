# Accessible Med Tracker

| Index                                             | Description                                                             |
|:--------------------------------------------------|:------------------------------------------------------------------------|
| [Overview](#overview)                             | See the motivation behind this project                                  |
| [Description](#description)                       | Learn more about the problem, and how we approached the solution        |
| [Deployment](#deployment)                         | How to install and deploy the solution                                  |
| [Usage](#usage)                                   | How to use Accessible Med Tracker                                       |
| [Troubleshooting](#troubleshooting)               | Common issues and solutions                                             |
| [Lessons Learned](#lessons-learned)               | Key takeaways and insights from the project, and next steps             |
| [Bill of Materials](#bill-of-materials)           | Cost of deployment and resources used                                   |
| [Credits](#credits)                               | Meet the team behind this project                                       |
| [License](#license)                               | See the project's license information                                   |

# Overview

Accessible Med Tracker is an **intelligent medication inventory management system** designed to help individuals and healthcare providers track medication supplies, monitor expiration dates, and maintain optimal stock levels through automated alerts and analytics. The solution leverages AWS cloud services and AI-powered analysis to provide comprehensive medication management capabilities.

This project addresses the critical need for accessible medication tracking, particularly for individuals with disabilities, elderly patients, or caregivers managing multiple medications. By providing automated monitoring, low-stock alerts, and usage analytics, the system helps prevent medication shortages and reduces the risk of using expired medications.

The platform delivers a comprehensive suite of features, including inventory management, automated low-stock monitoring, AI-powered usage analysis, expiration date tracking, and visual analytics through chart generation.

**_While designed for personal medication management, the solution is adaptable for small clinics, assisted living facilities, or any organization requiring systematic medication inventory tracking with automated monitoring capabilities._**

# Description

## Problem Statement
Managing medication inventory presents significant challenges for individuals with chronic conditions, elderly patients, and their caregivers. Traditional methods of tracking medications often rely on manual processes that are prone to errors, leading to missed doses, expired medications, or unexpected shortages. This is particularly challenging for individuals with disabilities who may have complex medication regimens or limited mobility to frequently check supplies. The lack of automated tracking and predictive analytics makes it difficult to maintain optimal medication levels and ensure medication safety.

## Our Approach

Accessible Med Tracker addresses these challenges through an intelligent, cloud-based medication management platform that combines automated monitoring with AI-powered analytics and accessible design principles.

**AI-Powered Analytics**: At the core of the system is an AI analysis engine powered by Amazon Bedrock's Claude Sonnet 4 model. The system analyzes medication usage patterns, inventory levels, and historical data to provide intelligent insights about medication consumption trends, optimal reorder points, and potential issues. The AI component helps users understand their medication usage patterns and provides recommendations for better inventory management.

**Serverless Event-Driven Architecture**: The platform leverages a fully serverless architecture built on AWS services including Lambda, DynamoDB, API Gateway, SNS, and EventBridge. Inventory operations are processed through dedicated Lambda functions that handle CRUD operations, while automated monitoring runs on a scheduled basis via EventBridge rules. This architecture provides automatic scaling, eliminates server management overhead, and ensures cost-efficient operation by charging only for actual usage.

**Automated Monitoring and Alerts**: The system includes intelligent monitoring capabilities that automatically check inventory levels every 15 minutes and sends notifications when medications fall below configurable thresholds. Email alerts are sent to designated recipients with detailed information about low-stock items, including supplier contact information and accessibility-friendly formatting.

**Comprehensive Audit Trail**: Every inventory change is automatically logged in an audit table, providing complete traceability of medication usage, additions, and modifications. This audit trail supports usage analytics and helps identify patterns in medication consumption.

## Architecture Diagram

*[Architecture diagram would be placed here showing the serverless AWS components and their interactions]*

## Tech Stack

| Category                      | Technology                                                              | Purpose                                                                                         |
|:------------------------------|:------------------------------------------------------------------------|:------------------------------------------------------------------------------------------------|
| **Amazon Web Services (AWS)** | [AWS CDK](https://docs.aws.amazon.com/cdk/)                             | Infrastructure as code for deployment and resource provisioning                                 |
|                               | [Amazon Bedrock](https://aws.amazon.com/bedrock/)                       | Provides access to Claude Sonnet 4 for AI-powered medication usage analysis                     |
|                               | [AWS Lambda](https://aws.amazon.com/lambda/)                            | Serverless compute for inventory operations, monitoring, and analytics processing               |
|                               | [Amazon DynamoDB](https://aws.amazon.com/dynamodb/)                     | NoSQL database for storing medication inventory and audit logs                                  |
|                               | [Amazon API Gateway](https://aws.amazon.com/api-gateway/)               | REST API endpoints for inventory management operations                                          |
|                               | [Amazon Simple Notification Service (SNS)](https://aws.amazon.com/sns/) | Email notifications for low-stock alerts                                                       |
|                               | [Amazon EventBridge](https://aws.amazon.com/eventbridge/)               | Scheduled monitoring events for automated inventory checks                                      |
|                               | [Amazon S3](https://aws.amazon.com/s3/)                                 | Storage for generated usage charts and analytics visualizations                                |
| **Backend**                   | [Pydantic](https://pydantic.dev/)                                       | Data validation and serialization for inventory items                                          |
|                               | [Python 3.12](https://www.python.org/)                                  | Primary runtime for Lambda functions and data processing                                       |
|                               | [Node.js 22](https://nodejs.org/)                                       | Runtime for chart generation and analytics visualization                                       |
| **Development**               | [TypeScript](https://www.typescriptlang.org/)                           | Type-safe infrastructure code and build processes                                              |
|                               | [Jest](https://jestjs.io/)                                               | Testing framework for unit and integration tests                                               |

# Deployment

## Prerequisites

Before deploying the Accessible Med Tracker solution, ensure you have the following prerequisites in place:
1. Sign up for an [AWS account](https://signin.aws.amazon.com/signup?request_type=register) if you haven't already
2. **Node.js** (v18 or later) - [Download here](https://nodejs.org/en/download) or use a node version manager like [nvm](https://github.com/nvm-sh/nvm)
3. **AWS CDK** (v2) - Install via `npm`:
   ```bash
   npm install -g aws-cdk
   ```
4. **AWS CLI** - [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
5. **Docker** - [Download here](https://www.docker.com/get-started/)
6. **Git** - [Download here](https://git-scm.com/)

## AWS Configuration

1. **Configure AWS CLI with your credentials**:
   ```bash
   aws configure
   ```
   Provide your AWS Access Key ID, Secret Access Key, AWS region (e.g., `us-east-1`) and `json` as the output format when prompted.

2. **Bootstrap your AWS environment for CDK (_required only once per AWS account/region_)**:
   ```bash
   cdk bootstrap aws://ACCOUNT_ID/REGION
   ```
   Replace `ACCOUNT_ID` and `REGION` with your AWS account ID and your region (e.g., `us-east-1`).

## Backend Deployment

1. **Clone the repository and navigate to the project directory**:
   ```bash
   git clone <repository-url>
   cd accessible-med-tracker
   ```

<details open>
  <summary><strong>Method 1: Use deployment script (recommended)</strong></summary>

  *If you're in a Windows environment, install [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) first to run the deployment script.*

  **Run the [`deploy_backend.sh`](./deploy_backend.sh) script from the root of the repository to deploy the backend**:
  ```bash
  # Set executable permissions and run the script
  chmod +x ./deploy_backend.sh
  sh ./deploy_backend.sh
  ```

  The deployment script will:
  - Check for all required prerequisites
  - Validate AWS configuration and permissions
  - Install backend dependencies
  - Bootstrap CDK if not already done
  - Deploy the backend CDK stack and provide stack outputs upon completion
</details>

<details>
  <summary><strong>Method 2: Manual steps</strong></summary>

  1. **Navigate to the backend directory**:
     ```bash
     cd backend
     ```
  2. **Install the dependencies**:
     ```bash
     npm install
     ```
  3. **Build the project**:
     ```bash
     npm run build
     ```
  4. **Deploy the backend using CDK**:
     ```bash
     npx cdk deploy
     ```
</details>

# Usage

## API Endpoints

Once deployed, the system provides the following REST API endpoints:

### Inventory Management
- **GET /inventory** - Retrieve all inventory items or filter by query parameters
  - Query parameters: `id`, `sku`, `category`
- **POST /inventory** - Create a new inventory item
- **PUT /inventory/{id}** - Update an existing inventory item
- **DELETE /inventory/{id}** - Delete an inventory item

### Monitoring and Analytics
- **GET /inventory/low-stock** - Get items below the configured threshold (default: 15)
- **POST /analytics** - Generate usage charts for specified date ranges
- **POST /analysis** - Get AI-powered analysis of medication usage patterns
- **POST /monitor** - Manually trigger inventory monitoring

## Creating Inventory Items

To add a new medication to your inventory, send a POST request to `/inventory` with the following structure:

```json
{
  "sku": "8901138509231",
  "item_name": "Tylenol",
  "quantity": 25,
  "expiration_date": "2025-10-17",
  "storage_location": "Bedroom",
  "category": "pain_relief",
  "supplier_name": "Local Pharmacy",
  "supplier_phone": "+1234567890"
}
```

## Automated Monitoring

The system automatically:
- Checks inventory levels every 15 minutes
- Sends email alerts when items fall below the threshold
- Logs all inventory changes for audit purposes
- Generates accessible HTML email notifications with supplier contact information

## Usage Analytics

Generate visual usage charts by sending a POST request to `/analytics`:

```json
{
  "startDate": "2025-10-01",
  "endDate": "2025-10-07"
}
```

The system returns a presigned S3 URL to access the generated SVG chart showing daily medication usage patterns.

## AI-Powered Analysis

Get intelligent insights about your medication usage by sending inventory data to the `/analysis` endpoint. The AI analyzes patterns and provides recommendations for:
- Optimal reorder points
- Usage trend analysis
- Potential medication management improvements
- Accessibility considerations

# Troubleshooting

1. **CDK Bootstrap Issues**:
   
   - If you encounter errors during the `cdk bootstrap` step, ensure that your AWS CLI is configured correctly with the necessary permissions.
   - You may need to run `aws configure` again to verify your credentials.
   - Explicitly set the AWS Account ID and Region in the bootstrap command:
     ```bash
     cdk bootstrap aws://ACCOUNT_ID/REGION
     ```

2. **Deployment Script Errors**:

   - If you get a "Permission denied" error when running the deployment script, ensure that you have set the executable permissions:
     ```bash
     chmod +x ./deploy_backend.sh
     ```
   - Make sure you are running the script in a compatible environment (e.g., WSL for Windows users).
   - Check that all [prerequisites](#prerequisites) are installed and properly configured.
   - Ensure your AWS CLI credentials have the necessary permissions to create and manage AWS resources.

3. **Lambda Function Timeouts**:

   - Lambda functions are configured with a 10-minute timeout for inventory operations.
   - If you experience timeouts with large datasets, consider implementing pagination or batch processing.
   - Check CloudWatch logs for specific error messages and performance metrics.

4. **Email Notifications Not Working**:

   - Verify that the email configuration in the inventory monitor function is correct.
   - Check that the Gmail credentials (if using Gmail SMTP) are properly configured.
   - Ensure that SNS topic permissions are correctly set up.
   - Review CloudWatch logs for the inventory monitor function to identify any SMTP errors.

5. **DynamoDB Access Issues**:

   - Ensure that Lambda functions have the necessary IAM permissions to read/write to DynamoDB tables.
   - Check that table names in environment variables match the actual deployed table names.
   - Verify that Global Secondary Indexes are properly configured for query operations.

# Lessons Learned

> To be updated based on implementation experience and user feedback

# Bill of Materials

> To be updated with actual AWS service costs and usage estimates

# Credits

**Accessible Med Tracker** is an open-source project developed to demonstrate serverless medication management capabilities using AWS services.

**Development Team:**

- [Varun Shelke](https://www.linkedin.com/in/vashelke/)

**Special Thanks:**

This project showcases the integration of various AWS services for healthcare-adjacent applications and demonstrates accessibility-first design principles in cloud-based solutions.

# License

This project is licensed under the [MIT License](./LICENSE).

```plaintext
MIT License

Copyright (c) 2025 Accessible Med Tracker Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

For questions, issues, or contributions, please visit the project repository or contact the development team.
