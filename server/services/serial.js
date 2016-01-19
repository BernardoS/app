let serialport = Npm.require("serialport")
let SerialPort = serialport.SerialPort

let buffer = new Buffer(0)

Buffer.prototype.indexOf = function(value, offset) {
  if (typeof(offset) === 'undefined') offset = 0

  for (var i = offset; i < this.length; i++) {
    if (this[i] == value) return i
  }

  return -1
}

function parser(emitter, data) { 
  buffer = Buffer.concat([buffer, data])

  let startByte = buffer.indexOf(0x21)
  while (startByte != -1) {
    let payloadSize = buffer.readUInt8(startByte + 1) 
    let payloadStart = startByte + 2
    let payloadEnd = payloadStart + payloadSize

    /*
     *  If payloadEnd is greater then length then the 
     *  packet did not arrived yet, slice the buffer and return
     */
    if (payloadEnd > buffer.length) {
      buffer = buffer.slice(startByte)
      return
    }

    emitter.emit('data', buffer.slice(payloadStart, payloadEnd))  
    startByte = buffer.indexOf(0x21, payloadEnd)
  }

  /* 
   * If we leave the loop then we consumed the whole buffer
   */
  buffer = Buffer(0)
}

Serial = class Serial {
  
  constructor(onOpen) {
    this.onOpen = onOpen
    this.onDisconnect = null

    this.port = null
    this.baudrate = 115200
    this.serialHandle = null
    this.connect()  

    Meteor.setInterval(() => {
      if (!this.isConnected()) {
        if (this.serialHandle != null) {
          console.log(`>> Serial: MSP432 connection lost!`)
          
          if (this.onDisconnect != null) {
            this.onDisconnect()
          }

          this.serialHandle = null
        }
        
        this.connect()
      }
    }, 3000)
  }

  connect() {    
    this.port = null
    console.log(`>> Serial: Searching for MSP432...`)
    
    try {
      serialport.list((error, ports) => {
        //console.log(ports)

        if (typeof(ports) === 'undefined') {
          console.log('>> Serial: Unable to find MSP432!')    
        } 
        else {      
          ports = ports.filter((port) => { 
            return (port.manufacturer === 'Texas_Instruments')
          })

          if (ports.length === 0) {
            console.log(`>> Serial: Unable to find MSP432!`)
          }
          else { 
            this.port = ports[0].comName
            console.log(`>> Serial: MSP432 found at ${this.port}`)
            
            this.serialHandle = new SerialPort(this.port, {
              baudrate: this.baudrate,
              parser: parser
            }, false)

            this.open()
          }
        }
      })
    }
    catch (error) {
      console.log(error)
    }
  }

  open() {
    console.log(`>> Trying to open ${this.port}`)
    
    this.serialHandle.open(error => {
      if (!error) {
        console.log(`>> Serial: ${this.port} connection successful`)
        if (typeof(this.onOpen) !== 'undefined') {
          this.onOpen()
        }
      }
      else {
        console.log(`>> Failed to open ${this.port}`)
        this.serialHandle = null
      }
    })
  }

  on(type, callback) {
    if (type == 'disconnect') {
      this.onDisconnect = callback
    }
    else {
      this.serialHandle.on(type, callback)
    }
  }

  isConnected() {
    if ((this.serialHandle == null) || (!this.serialHandle.isOpen())) {
      return false
    }
    return true
  }

  write(data) {
    if (this.isConnected()) {
      this.serialHandle.write(data)
    }
    else {
      throw new Error(`Serial write error: MSP is not connected!`)
    }
  }
}
