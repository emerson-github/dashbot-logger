const { isLambda } = require('./util');

function CloudWatchLogger(options) {
  if (!isLambda) {
    throw new Error('Log option only supports AWS Lambda functions.')
  }

  this._loggerStream = new CloudWatchStreamLogger(options)

  this.log = function (value) {
    var that = this;

    if (_.isObject(value)) {
      value = JSON.stringify(value)
    } else {
      value = value.toString()
    }

    return that._loggerStream.write({
      timestamp: new Date().getTime(),
      message: value
    })
  }
}

module.exports = CloudWatchLogger