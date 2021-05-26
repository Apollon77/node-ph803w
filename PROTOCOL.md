# PH-803W Protocol

The following information were reverse engineered via Wireshark and also by consulting code from https://github.com/gizwits/gokit-GAgent/blob/master/software/lan/Socket.c and https://github.com/gizwits/gokit-GAgent/blob/master/software/lan/lan.c (it is not fully the same but near enough to gain additional understanding).

## Communication details

The following ports in the local network are used:
* UDP broadcasts from App into network to port 12414
* UDP broadcasts from Device into network from 2415
* TCP server on device is listening on port 12416


## Protocol details

All details shown below are hex values, so 08 means 0x08 actually.

### Basic protocol structure

All messages start with the prefix

```
00 00 00 03 LL 00 00 PP
```
* The first 4 bytes are static `00 00 00 03`  and needs to be that way, else the device ignores the data package at all
* Bytes #5 (LL) seems to be the number of message bytes starting with byte 6 (means "byte 5" + 5 should be the complete message length)
* Bytes #6 and #7 are currently unknown, on sniffed packages they were always 00
* Byte #8 (PP) is the message type. Please see the table below for the message types and overview.

| Msg Type | Comm. | Direction | Information |
|----------|-------|-----------|-------------|
| 01       | UDP   | App --> Device | onBoarding request: App sends Wifi data to device |
| 02       | UDP   | Device --> App | onBoarding response: Just as OK message |
| 03       | UDP   | App --> Device | Discovery request |
| 04       | UDP   | Device -> App | Discovery response |
| 05       | UDP   | Device -> App | Device Broadcast message |
| 06       | TCP   | App --> Device | Device passcode request |
| 07       | TCP   | Device --> App | Device passcode response |
| 08       | TCP   | App --> Device | User login request |
| 09       | TCP   | Device --> App | User login response |
| 15       | TCP   | App --> Device | Ping-Pong request |
| 16       | TCP   | Device --> App | Ping-Pong response |
| 1b       | UDP   | App --> Device | ?? |
| 90       | TCP   | App --> Device | Device serial data send request |
| 91       | TCP   | Device --> App | Device serial data send passcode response |
| 93       | TCP   | App --> Device | Device extended serial data send request |
| 94       | TCP   | Device --> App | Device extended serial data send passcode response |

The message types are used in this order by the Android app:
* When App starts a discovery broadcast 03 is sent and answered by device (04)
* App then connects to TCP 12416
* Device passcode 06/07
* User login 08/09
* serial data send 90 with "02" as data
* app then receives data package with 91 and after this when values have changed
* serial extended data send 93/94
* then ping-pong every 4s 15/16

### 01/02 onBoarding (UDP)

#### Request
00 XX <XX bytes ssid> 00 YY <YY bytes ssidpwd> (unsure with 00xx/yy or if only xx/yy?)

00 00 00 03 03 00 00 02

### 03/04 Discovery (UDP)

**Request**
Static message `00 00 00 03 03 00 00 03` is sent via UDP broadcast to UDP 12141

**Response**
The device answers with a data package which was kind of static on different timepoints for the same device
`00 00 00 03 68 00 00 04 00 16 XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX 00 06 48 3f da 87 dc 47 00 00 00 XX XX XX XX XX XX XX XX XX Xx XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX 00 00 00 00 00 00 00 02 61 70 69 2e 67 69 7a 77 69 74 73 2e 63 6f 6d 3a 38 30 00 34 2e 30 2e 38 00`

Content mainly unknown, but it contains the api domain from gizwits (api.gizwits.com:80) and as last part a version number (4.0.8)

* `00 00 04 00`: 4 bytes unknown
* `16 XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX 00`: String with length identifier as first byte?, the same content is used for the cloud MQTT messages, so also seems to be a device id, NULL terminated?
* `06 48 3f da 87 dc 47 00 00 00`: 10 bytes unknown
* `XX XX XX XX XX XX XX XX XX Xx XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX`: 32 bytes Device ID or a hash? to be verified
* `00 00 00 00 00 00 00 02`: 8 bytes unknown
* `61 70 69 2e 67 69 7a 77 69 74 73 2e 63 6f 6d 3a 38 30 00`: API server, NULL terminated string?: 'api.gizwits.com:80'
* `34 2e 30 2e 38 00`: version, NULL terminated string?: '4.0.8'

### 05 Broadcast (UDP)

Only saw in code, not yet in the wild, so unknown

### 06/07 Device passcode (TCP)

**Request**
`00 00 00 03 03 00 00 06`
Static message  is sent

**Response**

`00 00 00 03 0f 00 00 07 00 0a X1 X2 X3 X4 X5 X6 X7 X8 X9 X0`

The response contains the usual prefix and after that
* two byte length indicator, always 10 aka `00 0a`
* 10 byte with characters from the device passcode (maybe the first 10 characters of the wifi secret ... unknown)

### 08/09 User login (TCP)
This command is required to register the connection in the device!

**Request**
`00 00 00 03 0f 00 00 08 00 0a X1 X2 X3 X4 X5 X6 X7 X8 X9 X0`

The request contains the usual prefix and after that
* two byte length indicator, always 10 aka `00 0a`
* 10 byte with characters from the device passcode (in fact the string returned in command type 07)

**Response**
`00 00 00 03 04 00 00 09 0X`

The response contains the usual prefix and the last byte indicated wether the login action was successful (00) or not (01).

### 1b ?? (UDP)

**Request**
Static message `00 00 00 03 03 00 00 1b` is sent via UDP broadcast to UDP 12141

**Response**
We did not saw a response... so unknown

### 15/16 Ping-Pong (TCP)

The Ping-Pong is executed every 4s.

**Request**
`00 00 00 03 03 00 00 15`

**Respone**
`00 00 00 03 03 00 00 16`

### 90/91 Device serial data send (TCP)

**Request**
`00 00 00 03 04 00 00 90 XX ...`

This command writes some bytes (XX) to the serial device, no length indicator exists as it seems.

The android app sends `02` as data to request values as it seems: e.g. `00 00 00 03 04 00 00 90 02`

**Response**
`00 00 00 03 0d 00 00 91 XX ...`

The response contains the serial data response after the prefix.

An example response from a request with `02` as data could be
`00 00 00 03 0d 00 00 91 ?? ?? 02 dc 08 9d 00 00 00 00`

The data after the prefix are:
* `?? ??`: We saw the following values until now, assumptions based in this (needs more checks together with what's shown in display):
    * 03 00: Binary: 0000 0011 0000 0000 - default? Inactive? No water?
    * 04 00: Binary: 0000 0100 0000 0000 - in water?
    * 04 02: Binary: 0000 0100 0000 00**1**0 - ORP on
    * 04 03: Binary: 0000 0100 0000 001**1** - PH on
    * 04 01: Binary: 0000 0100 0000 00**0**1 - ORP off
    * 04 00: Binary: 0000 0100 0000 000**0** - PH off
* `02 dc`: PH value multiplied by 100: 732/100 = 7.32
* `08 9d`: Redox value increased by 2000: 2205-2000 = 205 mV
* `00 00`: unknown
* `00 00`: unknown

It seems that after the first "90" request the device sends updated data itself after 6s

### 93/94 Device extended serial data send (TCP)

*Request*
`00 00 00 03 08 00 00 93 00 00 00 RR 02`

We assume that also data are written to the serial portion of the device, but differently. In fact details unknown.
From checking several requests the RR byte changes and we saw 04 and 0C

**Response**
e.g. (with 04 in ?? from above)
`00 00 00 03 11 00 00 94 00 00 00 04 03 00 02 dc 08 9d 00 00 00 00`

The data after the prefix are:
* `00 00`: unknown
* `00 04`: unknown, second byte seems to be the same as sent in as RR in request
* `?? ??`: see description in "90/91" response
* `02 dc`: PH value multiplied by 100: 732/100 = 7.32
* `08 9d`: Redox value increased by 2000: 2205-2000 = 205 mV
* `00 00`: unknown
* `00 00`: unknown


## Minimum Interaction scheme

* 1 connect the device with WLAn via the app
* 2 Do a TCP connection to device IP on port 12416
* 3 Send `00 00 00 03 03 00 00 06`
* 4 get response 
* 5 change byte #8 is response from 0x07->0x08 and remember that one (then steps 3-5 are not needed again and the value can be send out directly)
* 6 send that adjusted value to the device
* 7 verify that response is `00 00 00 03 04 00 00 09 00`
* 8 send `00 00 00 03 04 00 00 90 02` to device

From now on you should get data of message type 91 delivered on changes.

(If this is not the case on changes then we might also need to send message type 93 ... unverified)