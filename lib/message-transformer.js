const { Transformer } = require('stream')
const _ = require('lodash')
const { isLogMessage } = require('./util')

class MessageTransformer extends Transformer {
  constructor (options) {
    options.objectMode = true
    options.writeableObjectMode = true
    options.readableObjectMode = true

    super(options)
  }

  toCloudWatchLog (chunk) {
    if (_.isObject(chunk)) {
      if (!isLogMessage(chunk)) {
        return {
          timestamp: new Date().getTime(),
          message: JSON.stringify(chunk)
        }
      } else {
        return new Error(`Value should not contain log fields`)
      }
    } else {
      return {
        timestamp: new Date().getTime(),
        message: chunk
      }
    }
  }

  _transform (chunk, encoding, callback) {
    var newValue = this.toCloudWatchLog(chunk)

    if (newValue instanceof Error) {
      callback(err);
      return
    }

    callback(null, chunk)
  }
}