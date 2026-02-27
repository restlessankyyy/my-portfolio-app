// AWS Lambda handler for Portfolio serverless deployment
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./server');

exports.handler = serverlessExpress({ 
  app,
  binarySettings: {
    isBinary: ({ headers }) => true,
    contentTypes: ['application/pdf', 'image/*', 'font/*'],
  }
});