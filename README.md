# dashbot-logger

dashbot-logger allows you to log to a specific log-group apart from the default
log-group that Lambda functions setup. The logger works around the 5
putLogEvent/s limit by batching up log events in requests and using a pool of
log-streams to put log events to.

## Setup

```bash
npm install --save dashbot-logger
```

## Configuration Options
Available options:

  - ***debug*** - ```boolean``` logs helpful debugging information (default: ```false```) 
  - ***logGroupName*** - ```string``` user specified log group name (required) 
  - ***logStreamPrefix*** - ```string``` user specified log stream prefix (default: ```dashbot```) 
  - ***maxStreams*** - ```number``` max number of log streams to use concurrently (default: ```10```) 
  - ***minStreams*** - ```number``` min number of log streams to use concurrently (default: ```1```) 

## Example

```javascript
const configuration = {
  'logGroupName': 'test-group',
  'logStreamPrefix': 'test-stream',
  'maxStreams': 5,
  'minStreams': 2,
  'debug': true,
  'printErrors': true,
}

const Logger = require('dashbot-logger')
const logger = new Logger(configuration)

logger.log('test') // logs to log-group 'test-group' with string test
```