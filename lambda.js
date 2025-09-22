// AWS Lambda handler for Portfolio serverless deployment
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./server');

// Export the Lambda handler
exports.handler = serverlessExpress({ app });