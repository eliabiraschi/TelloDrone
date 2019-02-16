# TelloDrone
A NodeJS wrapper for the Ryze Tello SDK 1.3.

## Motivation
I did not find a library I liked so I made mine.

## Features
* Easy set up and minimal boilerplate
* All the SDK commands are available and return a promise
* Telemetry is broadcasted as a stringified object
* Video buffer is broadcasted too and ready for use
* Built in method for taking pictures (experimental)

## Installation and basic use
Install with `npm`:
```bash
npm install --save yatsw
```
The library exports a single class:
```javascript
const { TelloDrone } = require('yatsw')
```
Create a new instance:
```javascript
const Tello = new TelloDrone()
```
Fly:

```javascript
Tello.start()
Tello.takeoff()
Tello.forward(100)
Tello.yawCW(360)
Tello.land()
```
Fly better:
```javascript
async function roll() {
  Tello.start()
  Tello.takeoff()
  Tello.forward(100)
  const height = await Tello.getHeight()
  console.log(height)
  Tello.yawCW(360)
  Tello.up(150)
  const r = await Tello.takePicture('./img.jpg')
  console.log(r)
  Tello.land()
}
roll()
```

## Events
You can listen to the messages from the aircraft throught the `MESSAGE` event:
```javascript
Tello.on(Tello.events.MESSAGE, data => {
	console.log(data)
})
```
These would be the same results you would get when the single promises of the command methods resolve.

Telemetry data can be reached in the same fashion:
```javascript
Tello.on(Tello.events.STATE, data => {
	console.log(JSON.parse(data))
})
```

In the same way you can consume the video stream (the below example is for Linux)
```javascript
const { spawn } = require('child_process')
const { TelloDrone } = require('./src/TelloDrone')
const videoPlayer = spawn('mplayer', ['-fps', '35', '-'])
const Tello = new TelloDrone('myTello')
Tello.on(Tello.events.VIDEO, data => videoPlayer.stdin.write(data))
Tello.start()
Tello.streamOn()
```

### NOTE
Don't forget to connect to the Tello WiFi before running any related script.

## The TelloDrone class
The TelloDrone class constructor accepts 3 arguments, all of them are optionals.
1. A string used as id to idetify the class itself;
2. An object fir specifing non default values to connect to the aircraft. A partial object is ok too and the missing values will be filled by the defaults.
```javascript
{
  AIRCRAFT_PORT: 8889,
  STATUS_PORT: 8890,
  VIDEO_PORT: 11111,
  HOST: '192.168.10.1',
}
```
3. An array of objects describing the methods names and the commands to send to the aircraft. Please check the source code if you're interested in working with this.

## List of the public methods
The public methods reflect the commands you can send to the aircraft. I've only changed a couple of them for clarity. The returned values and/or arguments are those described in the official SDK documentation. Each one of them returns a promise.
The promises both resolve and reject with an object: `resolve({ message })` or `reject({ error: message || error })`.

* `start()` puts the aircraft in SDK mode, it has to be called prior to any other command
* `panic()` stops all the rotors
* `getHeight()`
* `getBattery()`
* `getTime()`
* `getSpeed()`
* `getWiFi()`
* `getTemp()`
* `getAttitude()`
* `getBaro()`
* `getAcceleration()`
* `getTOF()`
* `setSpeed(value)`
* `takeOff()`
* `land()`
* `emergencyLand()` it will send the `land` command with higher priority and skip all those commands queued
* `up(value)`
* `down(value)`
* `left(value)`
* `right(value)`
* `forward(value)`
* `back(value)`
* `yawCW(value)` the actual command sent is `cw value`
* `yawCCW(value)` the actual command sent is `ccw value`
* `flip(value)`
* `flyTo(valueX, valueY, valueZ, speed)` the actual command sent is `go valueX valueY valueZ speed`
* `curve(valueX, valueY, valueZ, valueX2, valueY2, valueZ2, speed)`
* `fourChannel(chA, chB, chC, chD)` the actual command sent is `rc chA chB chC chD`

In addition there are 3 more commands that are different for some reasons:
* `streamOn()` it starts the stream video and set up a ticker to keep the video alive
* `streamOff()` stops the video and kill the ticker
* `takePicture(path = '-')` it takes a picture using ffmpeg. If a path is provided the image is saved there otherwise the returned promise will resolve an object that will have a `buffer` field for the image data. In case you trigger the picture without starting the video stream first, the promise will still resolve, but it will return a warning. *NOTE*: Windows is not supported yet, but OSX might just work if you have ffmpeg installed.

## Known issues
* Taking a picture without for getting the buffer is still buggy and might not work at all.