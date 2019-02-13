const LogTransformer = require('./log-transformer')
const LogWriter = require('./log-writer')
const pump = require('pump')

class LoggerWrapper {
  constructor (logger) {
    this._logger = logger
  }

  log (value, callback) {
    return this._logger.write(value, callback)
  }
}

module.exports = function (options) {
  options.maxStreams = options.maxStreams || process.env.DASHBOT_LOG_MAX_STREAMS || 10
  options.minStreams = options.minStreams || process.env.DASHBOT_LOG_MIN_STREAMS || 1

  var transform = new LogTransformer(options)
  var write = new LogWriter(options)

  pump(transform, write)

  return new LoggerWrapper(transform)
}
