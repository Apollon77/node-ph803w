# Gizwits GAgent WLAN Protocol

The following information was reverse engineered (https://forum.iobroker.net/topic/42553/ph-messung/) via Wireshark and also by consulting code from:
- https://docs.gizwits.com/en-us/DeviceDev/GAgent.html
- https://docs.gizwits.com/en-us/DeviceDev/GoKit/GokitSoCProgram.html
- https://github.com/gizwits/Gizwits-GAgent/blob/master/gagent/lan/inc/lan.h
- https://github.com/gizwits/Gizwits-GAgent/blob/master/gagent/lan/src/lanudp.c
- https://github.com/gizwits/Gizwits-GAgent/blob/master/gagent/lan/src/lantcp.c
- https://github.com/xuhongv/StudyInEsp8266/blob/master/Gizkit_soc_pet/app/Gizwits/gizwits_protocol.h
- https://github.com/xuhongv/XHOpenGizwitsAndorid/blob/master/app/src/main/java/com/xuhoys/xuhong_gizwits_andorid/MainActivity.java
- https://www.npmjs.com/package/node-red-contrib-gizwits-device

## Communication details

The following ports in the local network are used:
* UDP broadcasts from App into network to port 12414
* UDP broadcasts from Device into network from 2415
* TCP server on device is listening on port 12416

## Protocol details

All details shown below are hex values, so `08` actually means 0x08.

### Basic protocol structure

All messages start with the prefix

```
00 00 00 03 LL..LL 00 CC CC
```
* The first 4 bytes are static `00 00 00 03` (`GAGENT_PROTOCOL_VERSION`) and needs to be that way, else the device ignores the data package at all
* The next 1 to 4 bytes (LL..LL) are a variable-length quantity encoded number of message bytes after the length (the last byte of length will have an unset most significant bit)
* Byte #6 is a flag, it always seems to be 00
* Bytes #7 and #8 (CC) are the message command. Please see the table below for the message commands and overview.

| Command | Carrier |   Direction    | Information                                       |
| ------- | :-----: | :------------: | ------------------------------------------------- |
| 00 01   |   UDP   | App --> Device | onBoarding request: App sends Wifi data to device |
| 00 02   |   UDP   | Device --> App | onBoarding response: Just as OK message           |
| 00 03   |   UDP   | App --> Device | Discovery request                                 |
| 00 04   |   UDP   | Device --> App | Discovery response                                |
| 00 05   |   UDP   | Device --> App | Startup Broadcast                                 |
| 00 06   |   TCP   | App --> Device | Device passcode request                           |
| 00 07   |   TCP   | Device --> App | Device passcode response                          |
| 00 08   |   TCP   | App --> Device | User login request                                |
| 00 09   |   TCP   | Device --> App | User login response                               |
| 00 0a   |   TCP   | App --> Device | Wifi version request (unused)                     |
| 00 0b   |   TCP   | Device --> App | Wifi version response (unused)                    |
| 00 0c   |   TCP   | App --> Device | Wifi hotspots request                             |
| 00 0d   |   TCP   | Device --> App | Wifi hotspots response                            |
| 00 13   |   TCP   | App --> Device | Wifi module information request                   |
| 00 14   |   TCP   | Device --> App | Wifi module information response                  |
| 00 15   |   TCP   | App --> Device | Ping-Pong request                                 |
| 00 16   |   TCP   | Device --> App | Ping-Pong response                                |
| 00 19   |   UDP   | App --> Device | Air Broadcast                                     |
| 00 1b   |   UDP   | App --> Device | ??                                                |
| 00 90   | TCP/UDP | App --> Device | Device serial data transmit request               |
| 00 91   | TCP/UDP | Device --> App | Device serial data transmit response              |
| 00 93   | TCP/UDP | App --> Device | Device serial data control request                |
| 00 94   | TCP/UDP | Device --> App | Device serial data control response               |

The message commands are used in this order by the Android app
* When App starts a discovery broadcast (03) is sent and answered by device (04)
* App then connects to TCP 12416
* Device passcode 06/07
* User login 08/09
* serial data transmit 90 with read status (02) as data
* app then receives data package with 91 and after this when values have changed
* serial data control 93/94
* then ping-pong every 4s 15/16

### 01/02 onBoarding (UDP)

**Request**
`00 XX <XX bytes ssid> 00 YY <YY bytes ssidpwd>` (unsure with 00 xx/yy or if only xx/yy?)

**Response**
`00 00 00 03 03 00 00 02`

### 03/04 Discovery (UDP)

**Request**
Static message `00 00 00 03 03 00 00 03` is sent via UDP broadcast to UDP 12141

* `00 00 00 03`: `GAGENT_PROTOCOL_VERSION`
* `03`: data length = 3
* `00`: flag (always zero?)
* `00 03`: cmd (4 = `GAGENT_LAN_CMD_ONDISCOVER`)

**Response**
The device answers with a data package which was kind of static on different timepoints for the same device
`00 00 00 03 68 00 00 04 00 16 XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX 00 06 48 3f da XX XX XX 00 00 00 20 32 64 33 64 39 35 34 64 39 62 62 37 34 31 62 34 61 31 39 62 61 31 31 35 33 31 30 34 39 33 32 62 00 00 00 00 00 00 00 02 61 70 69 2e 67 69 7a 77 69 74 73 2e 63 6f 6d 3a 38 30 00 34 2e 30 2e 38 00`

* `00 00 00 03 68`: version and length header
* `00`: flag (always zero?)
* `00 04`: cmd (4 = `GAGENT_LAN_CMD_REPLY_BROADCAST` -- should probably be named `GAGENT_LAN_CMD_REPLY_ONDISCOVER`)
* `00 16 XX XX XX XX XX .. XX XX`: Unique Device Identifier with length as the first two bytes, the same content is used for the cloud MQTT messages
* `00 06 48 3f da XX XX XX`: wifi mac address, with length as the first two bytes
* `00 00`: wifi firmware version, with length as the first two bytes
* `00 20 32 64 33 64 39 .. 32 62`: 32 bytes Product Key: `2d3d954d9bb741b4a19ba1153104932b`
* `00 00 00 00 00 00 00 02`: 8 bytes: MCU attributes
* `61 70 69 2e 67 69 7a 77 69 74 73 2e 63 6f 6d 3a 38 30 00`: API server, NULL terminated string?: `api.gizwits.com:80` (can also be `usapi.gizwits.com:80`)
* `34 2e 30 2e 38 00`: version, NULL terminated string?: `4.0.8` (can also be `4.1.2`)

The firmware version reported here is the version returned from the cloud the last time the device checked for software updates.

Device specific additional data can follow (PH-803W has none, but Clearlight Sauna has 8 bytes: probably mcu version)

The datapoint format can be retrieve from the API server, eg:
- https://github.com/xuhongv/ demo apps:
  - App-Id: `1cc897ccdeb248a79a5bed9d1230c0eb`
  - http://api.gizwits.com/app/datapoint?product_key=de9e8d18d9394cce9081b25a531e552b
- PH-803W (https://www.aliexpress.us/item/3256801158523618.html):
  - App-Id: `68bb8ff791a2487ba9d015e11fe72d7b`
  - http://api.gizwits.com/app/datapoint?product_key=2d3d954d9bb741b4a19ba1153104932b
- Clearlight Sauna:
  - App-Id: `5c42414e51aa49cdbbe5466c27e33e40`
  - http://usapi.gizwits.com/app/datapoint?product_key=4bde5ccdff4a48c0840e055204a71e1f

### 05 Broadcast (UDP)

Only saw in code (same as 04), not yet in the wild (maybe sent when device is first powered up?), so unknown

### 06/07 Device passcode (TCP)

**Request**
`00 00 00 03 03 00 00 06`
Static message is sent

**Response**

`00 00 00 03 0f 00 00 07 00 0a X1 X2 X3 X4 X5 X6 X7 X8 X9 X0`

The response contains the usual prefix and after that
* two byte length indicator, always 10 aka `00 0a`
* 10 byte with characters from the device passcode (generated randomly when the device is provisioned)

This call will return an empty result if the device is not in binding mode (normally activated with a physical button, or by restarting the device). Some devices do not have a timeout for binding mode.

### 08/09 User login (TCP)
This command is required to register the connection in the device!

**Request**
`00 00 00 03 0f 00 00 08 00 0a X1 X2 X3 X4 X5 X6 X7 X8 X9 X0`

The request contains the usual prefix and after that
* two byte length indicator, always 10 aka `00 0a`
* 10 byte with characters from the device passcode (in fact the string returned in command 07)

**Response**
`00 00 00 03 04 00 00 09 0X`

The response contains the usual prefix and the last byte indicated whether the login action was successful (00) or fail (01).

### 1b ?? (UDP)

**Request**
Static message `00 00 00 03 03 00 00 1b` is sent via UDP broadcast to UDP 12141

**Response**
We did not saw a response... so unknown

### 13/14 Wifi module information (TCP)

**Request**
`00 00 00 03 03 00 00 13`

**Response**
`00 00 00 03 57 00 00 14 ...`

* `30 30 45 53 50 38 32 36`: 8 bytes: Wifi hardware version `00ESP826`
* `30 34 30 32 30 30 33 41`: 8 bytes: Wifi software version `0402003A`
* `30 30 30 30 30 30 30 31`: 8 bytes: MCU hardware version `00000001`
* `30 30 30 30 30 30 30 31`: 8 bytes: MCU software version `00000001`
* `30 30 30 30 30 30 30 34`: 8 bytes: p0 protocol payload version `00000004`
* `00 00 00 00 00 00 00 00`: 8 bytes: Wifi firmware id
* `00 00`: two byte length indicator, Wifi firmware version (always empty)
* `00 20 34 62 64 65 35 .. 31 66`: two byte length indicator, Product Key

Note that the firmware version returned here is limited to the length (of the firmware version) as stored in the device config (which always seems to be zero).

### 15/16 Heartbeat (TCP)

The Heartbeat (ping/pong, tick/tock) is executed every 4s.

**Request**
`00 00 00 03 03 00 00 15`

**Response**
`00 00 00 03 03 00 00 16`

### 90/91 Device serial data transmit (TCP)

**Request**
`00 00 00 03 04 00 00 90 XX ...`

This command writes some data to the serial device. No additional length indicator exists.

It the android app transmits `02` (read status) as bytes, then the request will be: `00 00 00 03 04 00 00 90 02`

**Response**
`00 00 00 03 0d 00 00 91 XX ...`

Data from the serial device is sent to _all_ connected clients.

An example response from a request with `02` as data could be
`00 00 00 03 0d 00 00 91 03 00 02 dc 08 9d 00 00 00 00`

The bytes after the prefix are `03 00 02 dc 08 9d 00 00 00 00`

It seems that after the first "90" request the device transmits updated data itself after 6s

### 93/94 Device serial data control (TCP)

**Request**
`00 00 00 03 08 00 00 93 S1 S2 S3 S4 XX ...`

Writes some data to the serial device. A response is expected.

The data after the prefix is:
* `S1 S2 S3 S4`: 4 bytes: increasing sequence number
* `XX ..`: p0 protocol payload

**Response**
`00 00 00 03 11 00 00 94 S1 S2 S3 S4 XX ...`

Data from the serial device is sent _only_ the client that requested it. It it prefixed with the sequence number from the request.

The data after the prefix is:
* `S1 S2 S3 S4`: 4 bytes: the same sequence number as sent in the request
* `XX ..`: p0 protocol payload


## MCU Serial Data Protocol

This is used internally if there's a separate MCU communicating with the Wifi module. It is unused in the SoC edition. The structure is:

`head(0xffff)| len(2B) | cmd(1B) | sn(1B) | flag(2B) | payload(xB) | checksum(1B)`

The sequence number is not synchronized with the sequence number field of 93/94 messages

## p0 protocol

The p0 protocol is the common payload of the Wifi device serial data and MCU/SoC Serial Data. It is framed differently for each, but the structure is the same.

The first byte determines the action:

| Action | Direction    | Information                             |
| ------ | ------------ | --------------------------------------- |
| 01     | Wifi --> Dev | Control Device                          |
| 02     | Wifi --> Dev | Read the current status of the device   |
| 03     | Dev --> Wifi | Device status reply                     |
| 04     | Dev --> Wifi | Report the current status of the device |

### 01 Control Device

```
attrFlags_t
attrVals_t
```

### 02 Read the current status of the device

No payload

### 03 Device status reply

In reply to 02, returns the last data point. The data point is packed and returned as device status.

The /app/datapoint API returns the datapoint definition and can be used to decode the returned data, eg the PH-803W structure and returned data of `?? 02 dc 08 9d 00 00 00 00` decodes like:

```
typedef struct {
  bool valuepH_OUT;
  bool valuemV_OUT;
  bool valueEC_OUT;
  bool valueTEMP_OUT;
  uint16_t valuepH;
  uint16_t valuemV;
  uint16_t valueEC;
  uint16_t valueTEMP;
} dataPoint_t;
```

Device status:
* `??`: rBitBuf:
    * 01: Binary bit mask: ???? ???**x** - PH status
    * 02: Binary bit mask: ???? ??**x**? - ORP status
    * 04: Binary bit mask: ???? ?**x**?? - EC status
    * 08: Binary bit mask: ???? **x**??? - TEMP status
* `02 dc`: PH value multiplied by 100: 732/100 = 7.32
* `08 9d`: Redox value increased by 2000: 2205-2000 = 205 mV
* `00 00`: EC value
* `00 00`: TEMP value

### 04 Report the current status of the device

Same structure as 03, but automatically sent when a new datapoint is published.


## Minimum Interaction scheme

* 1 Connect the device with WLAN via the app
* 2 Do a TCP connection to device IP on port 12416
* 3 Send `00 00 00 03 03 00 00 06`
* 4 get response 
* 5 change byte #8 is response from 0x07->0x08 and remember that one (then steps 3-5 are not needed again and the value can be send out directly)
* 6 send that adjusted value to the device
* 7 verify that response is `00 00 00 03 04 00 00 09 00`
* 8 send `00 00 00 03 04 00 00 90 02` to device

From now on you should get data of message type 91 delivered on changes.

(If this is not the case on changes then we might also need to send message type 93 ... unverified)
