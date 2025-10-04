#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {AccessibleMedTrackerStack} from '../lib/accessible-med-tracker-stack';

const app = new cdk.App();
new AccessibleMedTrackerStack(app, 'AccessibleMedTrackerStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    },
    description: 'Accessible Med Tracker Backend Infrastructure',
});