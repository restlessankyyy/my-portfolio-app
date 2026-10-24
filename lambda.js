// AWS Lambda handler for Portfolio serverless deployment
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./server');

const expressHandler = serverlessExpress({
  app,
  binarySettings: {
    isBinary: ({ headers }) => true,
    contentTypes: ['application/pdf', 'image/*', 'font/*'],
  }
});

// Express sets the GET Content-Length on HEAD responses. API Gateway's front
// end rejects that header next to an empty body and returns 502, so drop it.
exports.handler = async (event, context) => {
  const response = await expressHandler(event, context);
  const method = event.requestContext?.http?.method || event.httpMethod;

  if (method === 'HEAD' && response && response.headers) {
    for (const key of Object.keys(response.headers)) {
      if (key.toLowerCase() === 'content-length') {
        delete response.headers[key];
      }
    }
  }

  return response;
};
