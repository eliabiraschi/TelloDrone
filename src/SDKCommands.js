module.exports = [
  {
    method: 'start',
    command: 'command'
  },
  {
    method: 'panic',
    command: 'emergency',
    hasPriority: true,
  },
  {
    method: 'getHeight',
    command: 'height?'
  },
  {
    method: 'getBattery',
    command: 'battery?'
  },
  {
    method: 'getTime',
    command: 'time?'
  },
  {
    method: 'getSpeed',
    command: 'speed?'
  },
  {
    method: 'getWiFi',
    command: 'wifi?'
  },
  {
    method: 'getTemp',
    command: 'temp?'
  },
  {
    method: 'getAttitude',
    command: 'attitude?'
  },
  {
    method: 'getBaro',
    command: 'baro?'
  },
  {
    method: 'getAcceleration',
    command: 'acceleration?'
  },
  {
    method: 'getTOF',
    command: 'tof?'
  },
  {
    method: 'setSpeed',
    command: 'speed'
  },
  {
    method: 'takeOff',
    command: 'takeoff'
  },
  {
    method: 'land',
    command: 'land'
  },
  {
    method: 'emergencyLand',
    command: 'land',
    hasPriority: true,
  },
  {
    method: 'up',
    command: 'up'
  },
  {
    method: 'down',
    command: 'down'
  },
  {
    method: 'left',
    command: 'left'
  },
  {
    method: 'right',
    command: 'right'
  },
  {
    method: 'forward',
    command: 'forward'
  },
  {
    method: 'back',
    command: 'back'
  },
  {
    method: 'yawCW',
    command: 'cw'
  },
  {
    method: 'yawCCW',
    command: 'ccw'
  },
  {
    method: 'flip',
    command: 'flip'
  },
  {
    method: 'flyTo',
    command: 'go'
  },
  {
    method: 'curve',
    command: 'curve'
  },
  {
    method: 'fourChannel',
    command: 'rc'
  },
]
