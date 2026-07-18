'use strict';

// AWS Lambda handler for the Green Room serverless deployment.
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./server');

exports.handler = serverlessExpress({ app });
