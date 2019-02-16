const { spawn } = require('child_process')
const { EventEmitter } = require('eventemitter3')
const dgram = require('dgram')

const telloEvents = require('./events')
const defaultConfig = require('./config')
const SDKDefaultCommands = require('./SDKCommands')

class TelloDrone extends EventEmitter {
	constructor(id, customConfig = {}, SDKCommands = SDKDefaultCommands ) {
    super(id)

    // CONFIG
    this.id = id
    this.events = telloEvents
    this.config = {
      ...defaultConfig,
      ...customConfig,
    }

    // STATE
    this.active = true
    this.isBusy = false
    this.commands = []
    this.currentCommand = {}
    this.isStreamOn = false
    this.streamOnTicker
    this.takingPicture = false
    this.ffmpeg

    // AIRCRAFT SOCKET
		this.aircraft = dgram.createSocket('udp4')
    this.aircraft.bind(this.config.AIRCRAFT_PORT)
    
		this.aircraft.on('message', message => {
      if (this.currentCommand.type === 'sdk') {
        message = message.toString()
        if (!message.includes('error')) {
          this.currentCommand.resolve({ response: message })
          if (this.currentCommand.command === 'streamon') {
            this.isStreamOn = true
          } else if (this.currentCommand.command === 'streamoff') {
            this.isStreamOn = false
          }
        } else {
          this.currentCommand.reject({ error: message })
        }
      }
      
      this.emit(telloEvents.MESSAGE, message)
      this.isBusy = false
		})

    // TELEMETRY SOCKET
		this.status = dgram.createSocket('udp4')
		this.status.bind(this.config.STATUS_PORT)
		this.status.on('message', state => {
      state = state
        .toString()
        .split(';')
        .reduce((acc, curr) => {
          const [key, value] = curr.split(':')
          if (value) {
            return {
              [key]: parseFloat(value),
              ...acc,
            }
          }
          return acc
        }, {})
			this.emit(telloEvents.STATE, JSON.stringify(state))
    })

    // VIDEO SOCKET
    this.videoSource = dgram.createSocket('udp4')
    this.videoSource.bind(this.config.VIDEO_PORT)
    this.videoSource.on('message', data => {
      this.emit(telloEvents.VIDEO, data)
      if (this.takingPicture) {
        try {
          this.ffmpeg.stdin.write(data)
        } catch (error) {
          this.currentCommand.reject({ error })
          this.takingPicture = false
          this.isBusy = false
        }
      }
    })

    // Create DRY-ly the majority of the PUBLIC METHODS
    SDKCommands
      .forEach(({ method, command, hasPriority }) => {
        this[method] = (...args) => new Promise((resolve, reject) => {
          args.unshift(command)
          this.commands[hasPriority ? 'unshift' : 'push']({
            command: args.join(' '),
            resolve,
            reject,
            type: 'sdk',
          })
        })
      })

    this._loop() // start looping through the commands array
  }
  
  emit (name, ...args) {
    if (this.active) {
      args.unshift(name)
      super.emit.apply(this, args)
    }
  }
  
  destroy () {
    this.emit('destroy')
    this.active = false
  }

  // PRIVATE METHODS
  _loop() {
    if (this.active && !this.isBusy && this.commands.length > 0) {
      this.currentCommand = this.commands.shift()
      this.isBusy = true
      
      if (this.currentCommand.type.includes('sdk')) {
        this._send(this.currentCommand.command)
      }
      
      if (this.currentCommand.type === 'internal') {
        const {
          command,
          args
        } = this.currentCommand
        this[command](...args)
      }
    }

    setTimeout(() => {
      this._loop()
    }, 0)
  }

	_send(command) {
		this.aircraft.send(command, 0, command.length, this.config.AIRCRAFT_PORT, this.config.HOST, this._handleError)
	}

	_handleError(error) {
		if (error) {
      if (this.currentCommand.reject) {
        this.currentCommand.reject({ error })
      } else {
        throw new Error(error)
      }
		}
  }

  _takePicture(path) {
    if (this.isStreamOn) {
      this.takingPicture = true
      try {
        let errorBuffer
        let imageBuffer
        this.ffmpeg = spawn('ffmpeg', ['-i', '-', '-ss', '00:00:01.000', '-vframes', '1', path])
        this.ffmpeg.stderr.on('data', data => {
          errorBuffer += data.toString()
        })
        if (path === '-') {
          this.ffmpeg.stdout.on('data', data => {
            imageBuffer += data
          })
        }
        this.ffmpeg.on('exit', () => {
          this.currentCommand.resolve({ response: 'ok', buffer: path === '-' ? imageBuffer : null, error: errorBuffer })
          this.isBusy = false
          this.takingPicture = false
        })
      } catch (error) {
        this.currentCommand.reject({ error })
        this.isBusy = false
        this.takingPicture = false
      }
    } else {
      this.currentCommand.resolve({ warning: 'streamOff' })
    }
  }

  // PUBLIC METHODS
  takePicture(path = '-') {
    return new Promise((resolve, reject) => {
      this.commands.push({ command: '_takePicture', args: [path], name: 'takePicure', type: 'internal', resolve, reject, })
    })
  }

  streamOn() {
    this.streamOnTicker = setInterval(() => {
      this.commands.unshift({ command: 'streamon', type: 'sdk-auto' })
    }, 2000)
    return new Promise((resolve, reject) => {
      this.commands.push({ command: 'streamon', resolve, reject, type: 'sdk' })
    })
  }

  streamOff() {
    clearInterval(this.streamOnTicker)
    return new Promise((resolve, reject) => {
      this.commands.push({ command: 'streamoff', resolve, reject, type: 'sdk' })
    })
  }
}

module.exports = TelloDrone
