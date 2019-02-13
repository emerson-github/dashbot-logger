'use strict'

const Aws = require('aws-sdk')
const { Writable } = require('stream')
const genericPool = require('generic-pool')
const { getMissingFields, getLogStreamName } = require('./util')

class MessageWriter extends Writable {
  constructor (options) {
    super({ objectMode: true })
    const missing = getMissingFields(options, ['logGroupName'])
    if (missing.length) {
      throw new Error(`${missing} required.`)
    }

    this.logGroupName = options.logGroupName || process.env.DASHBOT_LOG_GROUP_NAME
    this.logStreamPrefix = options.logStreamPrefix || process.env.DASBOT_LOG_STREAM_PREFIX
    this.debug = options.debug || false
    this.printErrors = options.printErrors || false

    this.cloudWatchLogs = new Aws.CloudWatchLogs({
      region: options.region,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey
    })

    this.poolOptions = {
      max: options.maxStreams || process.env.DASHBOT_LOG_MAX_STREAMS,
      min: options.minStreams || process.env.DASHBOT_LOG_MIN_STREAMS
    }

    this.streamPoolPromise = this.createStreamPool(this.poolOptions)
  }

  createStreamPool (opts) {
    var that = this

    return this.createLogGroup(this.logGroupName)
      .then((_) => {
        const poolFactory = {
          create: () => that.createLogStream(getLogStreamName(that.logStreamPrefix || 'dashbot')),
          destroy: () => {}
        }
        that.logStreamsPool = genericPool.createPool(poolFactory, opts || that.poolOptions)
      })
  }

  createLogStream (logStreamName) {
    var that = this

    return this.cloudWatchLogs.createLogStream({
      logGroupName: this.logGroupName,
      logStreamName
    })
      .promise()
      .then((_) => {
        return that.createStreamResource(
          logStreamName,
          null
        )
      }, (err) => {
        if (that.printErrors || that.debug) {
          console.log(`Error creating stream: ${err}`)
        }
        throw new Error(err)
      })
  }

  createLogGroup (logGroupName) {
    var that = this

    return this.cloudWatchLogs.createLogGroup({
      logGroupName: logGroupName
    })
      .promise()
      .then((data) => {
        if (that.debug) {
          console.log(`Log group created: ${JSON.stringify(data)}`)
        }
        return data
      }, (err) => {
        if (err && err.code === 'ResourceAlreadyExistsException') {
          if (that.debug) {
            console.log(`Log group already exists: ${err}`)
          }
          err = null
        } else if (err) {
          if (that.printErrors || that.debug) {
            console.log(`Error creating group ${err}`)
          }
        }
      })
  }

  putLogEvents (stream, logs) {
    var that = this

    return this.cloudWatchLogs.putLogEvents({
      logEvents: logs,
      logGroupName: this.logGroupName,
      logStreamName: stream.streamName,
      sequenceToken: stream.sequenceToken
    })
      .promise()
      .then((data) => {
        if (that.debug) {
          console.log(`Successfully wrote to stream ${stream.streamName}`)
        }
        stream.sequenceToken = data.nextSequenceToken
        return stream
      }, (err) => {
        if (that.printErrors || that.debug) {
          console.log(`Error putting log event: ${err}`)
        }
      })
  }

  createStreamResource (streamName, sequenceToken) {
    return {
      streamName: streamName,
      sequenceToken: sequenceToken
    }
  }

  _write (chunks, encoding, callback) {
    var that = this

    if (!Array.isArray(chunks)) {
      chunks = [chunks]
    }

    this.streamPoolPromise
      .then((_) =>
        that.logStreamsPool.acquire()
      )
      .then((stream) => {
        if (that.debug) {
          console.log(`Log to write ${chunks}`)
        }

        that.putLogEvents(stream, chunks)
      })
      .then((stream) => {
        that.logStreamsPool.release(stream)
        callback()
      })
      .catch((err) => {
        if (that.printErrors || that.debug) {
          console.log(`Error ${err}`)
        }
        callback(err)
      })
  }
}

module.exports = MessageWriter
