Services.msp.methods.serialize = function (method, args, buffer, offset) {
  try {
    let service = Services.utils.find(Services.msp.methods.map, 'method', method)
    service.validateArgs(args)
    return service.serialize(args, buffer, offset)
  }
  catch (error) {
    throw new Error(`Msp methods serialize throwed: ${error}`)
  }
}

Services.msp.methods.deserialize = function (id, packet) {
  try {
    let service = Services.utils.find(Services.msp.methods.map, 'id', id)

    if (typeof(service.deserialize) !== 'undefined') {
      return service.deserialize(packet)
    }
    return { }
  }
  catch (error) {
    throw new Error(`Msp methods deserialize throwed: ${error}`)
  }
}

function validateArray(args) {
  if (!args) throw `@${this.method} - args undefined`

  args.forEach((obj) => {
    if (this.validIds.indexOf(obj.id) == -1) {
      throw `@${this.method} - invalid id: ${obj.id}`
    }
  })
}

Services.msp.methods.map = [
  {
    id: 0x00,
    method: 'configureLocks',
    validateArgs: validateArray,
    validIds: [
      0, // SERVICE_LOCK_MOTORS
      1, // SERVICE_LOCK_VALVES
      2, // SERVICE_LOCK_HEATERS
      3  // SERVICE_LOCK_SENSOR_SELECT
    ],
    serialize(args, buffer, offset) {
      buffer.writeUInt8(this.id, offset)

      let i = 0;
      args.forEach(function (obj) {
        buffer.writeUInt8(obj.id, offset + 1 + 2*i)
        buffer.writeUInt8(obj.value, offset + 2 + 2*i)
        ++i;
      })

      return 1 + 2*i
    }
  },
  {
    id: 0x01,
    method: 'startSampling',
    validateArgs(args) {
      if (args.samplingTime < 0) {
        throw `@${this.method} - invalid sampling time: ${samplingTime}`
      }
    },
    serialize(args, buffer, offset) {
      buffer.writeUInt8(this.id, offset)
      buffer.writeUInt32BE(args.samplingTime, offset+1)
      return 5
    }
  },
  {
    id: 0x02,
    method: 'stopSampling',
    validateArgs() {
    },
    serialize(args, buffer, offset) {
      buffer.writeUInt8(this.id, offset)
      return 1
    }
  },
  {
    id: 0x03,
    method: 'selectSensor',
    validateArgs(args) {
      if (this.validIds.indexOf(args.id) == -1)
        throw `@${this.method} - invalid sensor id: ${args.id}`
    },
    validIds: [
      0, // SENSOR_PH
      1, // SENSOR_NA
      2, // SENSOR_CL
      3, // SENSOR_K
      4  // SENSOR_CONDUCTIVIT
    ],
    serialize(args, buffer, offset) {
      buffer.writeUInt8(this.id, offset)
      buffer.writeUInt8(args.id, offset + 1)
      return 2
    }
  },
  {
    id: 0x04,
    method: 'sampleOnce',
    validateArgs(args) {
    },
    serialize(args, buffer, offset) {
      buffer.writeUInt8(this.id, offset)
      return 1
    },
    deserialize(packet) {
      let result = {
        ph: {
          raw: packet.readUInt16BE(0),
          voltage: packet.readUInt16BE(0)*3.3/16384.0
        },
        na: {
          raw: packet.readUInt16BE(2),
          voltage: packet.readUInt16BE(2)*3.3/16384.0
        },
        cl: {
          raw: packet.readUInt16BE(4),
          voltage: packet.readUInt16BE(4)*3.3/16384.0
        },
        k: {
          raw: packet.readUInt16BE(6),
          voltage: packet.readUInt16BE(6)*3.3/16384.0
        },
        conductivity: {
          raw: packet.readUInt16BE(8),
          voltage: packet.readUInt16BE(8)*3.3/16384.0
        },
        preheater: {
          raw: packet.readUInt16BE(10),
          voltage: packet.readUInt16BE(10)*3.3/16384.0,
          temperature: 0.0037007729*packet.readUInt16BE(10) + 11.5201522894
        },
        heater: {
          raw: packet.readUInt16BE(12),
          voltage: packet.readUInt16BE(12)*3.3/16384.0,
          temperature: 0.0037007729*packet.readUInt16BE(12) + 10.2201522894
        },
        sd1: packet.readUInt16BE(14),
        sd2: packet.readUInt16BE(16),
        timestamp: packet.readUInt32BE(18),
        counter: packet.readUInt32BE(22)
      }
      return result
    }
  },
  {
    id: 0x05,
    method: 'resetCounter',
    validateArgs(args) {
    },
    serialize(args, buffer, offset) {
      buffer.writeUInt8(this.id, offset)
      return 1
    }
  },
  {
    id: 0x10,
    method: 'configureValves',
    validateArgs: validateArray,
    validIds: [
      0,  // VALVE_PROBE_LOWER
      1,  // VALVE_PROBE_UPPER
      2,  // VALVE_WASH
      3,  // VALVE_SLOPE_REAGENT
      4   // VALVE_CAL_REAGENT
    ],
    serialize(args, buffer, offset) {
      buffer.writeUInt8(this.id, offset)

      let i = 0;
      args.forEach(function (obj) {
        buffer.writeUInt8(obj.id, offset + 1 + 2*i)
        buffer.writeUInt8(obj.value, offset + 2 + 2*i)
        ++i;
      })

      return 1 + 2*i
    }
  },
  {
    id: 0x11,
    method: 'configurePumps',
    validateArgs: validateArray,
    validIds: [
      0, // PWM_REAGENT_PUMP
      1  // PWM_SAMPLE_WASTE_PUMP
    ],
    serialize(args, buffer, offset) {
      buffer.writeUInt8(this.id, offset)

      let i = 0;
      args.forEach(function (obj) {
        buffer.writeUInt8(obj.id, offset + 1 + 3*i)
        buffer.writeUInt16BE(obj.value, offset + 2 + 3*i)
        ++i;
      })

      return 1 + i*3
    }
  },
  {
    id: 0x12,
    method: 'configureHeaters',
    validateArgs: validateArray,
    validIds: [
      2, // PWM_PREHEATER
      3  // PWM_INTHEATER
    ],
    serialize(args, buffer, offset) {
      buffer.writeUInt8(this.id, offset)

      let i = 0;
      args.forEach(function (obj) {
        buffer.writeUInt8(obj.id, offset + 1 + 3*i)
        buffer.writeUInt16BE(obj.value, offset + 2 + 3*i)
        ++i;
      })

      return 1 + i*3
    }
  },
  {
    id: 0x13,
    method: 'configureSDLeds',
    validateArgs() {

    },
    serialize(args, buffer, offset) {
      buffer.writeUInt8(this.id)
      return 1
    }
  }
]
