# node-ph803w
Library to interact locally with PH-803W devices

## Device details

The PH803W device is internally an ESP which uses the GizWits platform. With this the device offers two ways of communication:
* The device connects to the gizwits cloud via MQTT and publishs the device data there, where the Android app gets the data from
* The device also offers local options via UDP for discovery and setup (Onboarding) and also a TCP interface for communication with the device and to request data

This library is focussing on the local LAN interface via UDP and TCP.

## LAN communication protocol

Please see [Protocol page](PROTOCOL.md).

## Usage


## Changelog
