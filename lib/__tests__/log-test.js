var assert = require('assert')
var CloudWatchStreamLogger = require('../message-writer')

describe('Logs string correctly', function() {
  var cloudWatchStreamLogger = new CloudWatchStreamLogger({
    logGroupName: 'test',
    maxStreams: 10,
    debug: true,
    printErrors: true,
    region: 'us-east-1'
  })

  var i = 10
  var stream = false
  while (--i) {
    stream = cloudWatchStreamLogger.write("test")
  }

  assert(stream)
})