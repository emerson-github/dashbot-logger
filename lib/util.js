const uuid = require('uuid');
const _ = require('lodash');

module.exports.isLambda = () =>
  !!((process.env.LAMBDA_TASK_ROOT && process.env.AWS_EXECUTION_ENV) || false);

module.exports.getMissingFields = (obj, fields) =>
  _.filter(fields, (field) => !_.has(obj, field))

module.exports.getLogStreamName = (prefix) =>
  `${prefix}-${Date.now()}-${uuid.v4()}`