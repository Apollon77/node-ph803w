local p_gizwits = Proto("gizwits", "Gizwits Agent");
local p_gizwits_unknown = Proto("gizwits_unknown", "Gizwits Data Point: Unknown product (missing discovery packet?)");

local d_table = DissectorTable.new("gizwits", "Gizwits", ftypes.STRING, base.NONE, p_gizwits)

local CMD_ONBOARDING        = 0x0001  -- UDP
local CMD_REPLY_ONBOARDING  = 0x0002  -- UDP
local CMD_ONDISCOVER        = 0x0003  -- UDP
local CMD_REPLY_BROADCAST   = 0x0004  -- UDP
local CMD_STARTUP_BROADCAST = 0x0005  -- UDP
local CMD_BINDING           = 0x0006  -- TCP
local CMD_REPLY_BINDING     = 0x0007  -- TCP
local CMD_LOGIN             = 0x0008  -- TCP
local CMD_REPLY_LOGIN       = 0x0009  -- TCP
local CMD_HOTSPOTS          = 0x000C  -- TCP
local CMD_REPLY_HOTSPOTS    = 0x000D  -- TCP
local CMD_LOG               = 0x0010  -- TCP
local CMD_INFO              = 0x0013  -- TCP
local CMD_REPLY_INFO        = 0x0014  -- TCP
local CMD_TICK              = 0x0015  -- TCP
local CMD_REPLY_TICK        = 0x0016  -- TCP
local CMD_TEST              = 0x0017  -- TCP
local CMD_REPLY_TEST        = 0x0018  -- TCP
local CMD_AIR_BROADCAST     = 0x0019  -- UDP
local CMD_TRANSMIT          = 0x0090  -- TCP/UDP
local CMD_TRANSMIT_91       = 0x0091  -- TCP/UDP
local CMD_CTL_93            = 0x0093  -- TCP/UDP
local CMD_CTLACK_94         = 0x0094  -- TCP/UDP

local cmds = {
  [CMD_ONBOARDING       ]    = "onBoarding request",
  [CMD_REPLY_ONBOARDING ]    = "onBoarding response",
  [CMD_ONDISCOVER       ]    = "Discovery request",
  [CMD_REPLY_BROADCAST  ]    = "Discovery response",
  [CMD_STARTUP_BROADCAST]    = "Startup Broadcast",
  [CMD_BINDING          ]    = "Device passcode request",
  [CMD_REPLY_BINDING    ]    = "Device passcode response",
  [CMD_LOGIN            ]    = "User login request",
  [CMD_REPLY_LOGIN      ]    = "User login response",
  [CMD_HOTSPOTS         ]    = "Wifi hotspots request",
  [CMD_REPLY_HOTSPOTS   ]    = "Wifi hotspots response",
  [CMD_LOG              ]    = "Log",
  [CMD_INFO             ]    = "Wifi module information request",
  [CMD_REPLY_INFO       ]    = "Wifi module information response",
  [CMD_TICK             ]    = "Ping-Pong request",
  [CMD_REPLY_TICK       ]    = "Ping-Pong response",
  [CMD_TEST             ]    = "Test request",
  [CMD_REPLY_TEST       ]    = "Test response",
  [CMD_AIR_BROADCAST    ]    = "Air Broadcast",
  [CMD_TRANSMIT         ]    = "Device serial data transmit request",
  [CMD_TRANSMIT_91      ]    = "Device serial data transmit response",
  [CMD_CTL_93           ]    = "Device serial data control request",
  [CMD_CTLACK_94        ]    = "Device serial data control response",
}

local LOGIN_SUCCESS = 0
local LOGIN_FAIL    = 1

local logins = {
  [LOGIN_SUCCESS] = "Success",
  [LOGIN_FAIL   ] = "Fail",
}

local f_version = ProtoField.uint32("gizwits.version", "Version", base.DEC)
local f_len = ProtoField.uint64("gizwits.len", "Length", base.DEC)
local f_flags = ProtoField.uint8("gizwits.flags", "Flags", base.HEX)
local f_cmd = ProtoField.uint16("gizwits.cmd", "Command", base.HEX, cmds)

local f_deviceid_len = ProtoField.uint32("gizwits.deviceid_len", "Device Id Length", base.DEC)
local f_deviceid = ProtoField.string("gizwits.deviceid", "Device Id", base.ASCII)
local f_firmwareversion_len = ProtoField.uint32("gizwits.firmwareversion_len", "Firmware Version Length", base.DEC)
local f_firmwareversion = ProtoField.string("gizwits.firmwareversion", "Firmware Version", base.ASCII)
local f_productkey_len = ProtoField.uint32("gizwits.productkey_len", "Product Key Length", base.DEC)
local f_productkey = ProtoField.string("gizwits.productkey", "Product Key", base.ASCII)
local f_mcuattributes = ProtoField.bytes("gizwits.productkey", "MCU Attributes")
local f_apiserver = ProtoField.stringz("gizwits.apiserver", "API Server", base.ASCII)
local f_agentversion = ProtoField.stringz("gizwits.agentversion", "Agent Version", base.ASCII)

local f_login = ProtoField.uint16("gizwits.login", "Login", base.DEC, logins)

local f_mac = ProtoField.ether("gizwits.mac", "Mac Address")
local f_mac_len = ProtoField.uint8("gizwits.mac_len", "Mac Address Length", base.DEC)
local f_sn = ProtoField.bytes("gizwits.sn", "Sequence Number")
local f_payload = ProtoField.bytes("gizwits.payload", "Payload")
local f_passcode_len = ProtoField.uint32("gizwits.passcode_len", "Passcode Length", base.DEC)
local f_passcode = ProtoField.string("gizwits.passcode", "Passcode", base.ASCII)

p_gizwits.fields = {
   f_version, f_len, f_flags, f_cmd,
   f_deviceid_len, f_deviceid,
   f_firmwareversion_len, f_firmwareversion,
   f_productkey_len, f_productkey,
   f_mcuattributes, f_apiserver, f_agentversion,
   f_login,
   f_mac_len, f_mac, f_sn, f_payload,
   f_passcode_len, f_passcode,
}

local productkeys_by_ip = {}

local data_dis = Dissector.get("data")

local function varint(range)
  local value = 0
  for i = 0, math.min(4, range:len()) do
    local b = range(i, 1):uint()
    value = bit32.bor(value, bit32.lshift(bit32.band(b, 0x7f), i * 7))
    if b < 0x80 then
      return value, i + 1;
    end
  end
  error("varint too long")
end

local function dissector(buf, pkt, tree)

  local len, len_len = varint(buf(4))
  local subtree = tree:add(p_gizwits, buf(0, 4 + len_len + len))
  local off = 0

  subtree:add_packet_field(f_version, buf(off, 4), ENC_BIG_ENDIAN)
  off = off + 4

  subtree:add_packet_field(f_len, buf(off, len_len), ENC_BIG_ENDIAN)
  off = off + len_len

  subtree:add_packet_field(f_flags, buf(off, 1), ENC_BIG_ENDIAN)
  off = off + 1
  len = len - 1

  subtree:add_packet_field(f_cmd, buf(off, 2), ENC_BIG_ENDIAN)
  local cmd = buf(off, 2):uint()
  off = off + 2
  len = len - 2

  local cmd_s = cmds[cmd]
  if cmd_s == nil then cmd_s = string.format("Unknown command (0x%04x)", cmd) end
  subtree:append_text(", " .. cmd_s)

  if cmd == CMD_REPLY_BROADCAST then
    subtree:add_packet_field(f_deviceid_len, buf(off, 2), ENC_BIG_ENDIAN)
    local deviceid_len = buf(off, 2):uint()
    off = off + 2
    len = len - 2

    subtree:add_packet_field(f_deviceid, buf(off, deviceid_len), ENC_BIG_ENDIAN)
    off = off + deviceid_len
    len = len - deviceid_len

    subtree:add_packet_field(f_mac_len, buf(off, 2), ENC_BIG_ENDIAN)
    local mac_len = buf(off, 2):uint()
    off = off + 2
    len = len - 2

    subtree:add_packet_field(f_mac, buf(off, mac_len), ENC_BIG_ENDIAN)
    off = off + mac_len
    len = len - mac_len

    subtree:add_packet_field(f_firmwareversion_len, buf(off, 2), ENC_BIG_ENDIAN)
    local firmwareversion_len = buf(off, 2):uint()
    off = off + 2
    len = len - 2

    subtree:add_packet_field(f_firmwareversion, buf(off, firmwareversion_len), ENC_BIG_ENDIAN)
    off = off + firmwareversion_len
    len = len - firmwareversion_len

    subtree:add_packet_field(f_productkey_len, buf(off, 2), ENC_BIG_ENDIAN)
    local productkey_len = buf(off, 2):uint()
    off = off + 2
    len = len - 2

    subtree:add_packet_field(f_productkey, buf(off, productkey_len), ENC_BIG_ENDIAN)
    local productkey = buf(off, productkey_len):string()
    off = off + productkey_len
    len = len - productkey_len

    -- store productkey for later use
    productkeys_by_ip[tostring(pkt.src)] = productkey

    subtree:add_packet_field(f_mcuattributes, buf(off, 8), ENC_BIG_ENDIAN)
    off = off + 8
    len = len - 8

    local f_apiserver_len = buf(off):strsize()
    subtree:add_packet_field(f_apiserver, buf(off), ENC_BIG_ENDIAN)
    off = off + f_apiserver_len
    len = len - f_apiserver_len

    local f_agentversion_len = buf(off):strsize()
    subtree:add_packet_field(f_agentversion, buf(off), ENC_BIG_ENDIAN)
    off = off + f_agentversion_len
    len = len - f_agentversion_len
  end

  if pkt.match_uint == 12414 and cmd == CMD_TRANSMIT_91 then
    subtree:add_packet_field(f_mac_len, buf(off, 1), ENC_BIG_ENDIAN)
    local mac_len = buf(off, 1):uint()
    off = off + 1
    len = len - 1

    subtree:add_packet_field(f_mac, buf(off, mac_len), ENC_BIG_ENDIAN)
    off = off + mac_len
    len = len - mac_len
  end

  if cmd == CMD_CTL_93 or cmd == CMD_CTLACK_94 then
    subtree:add_packet_field(f_sn, buf(off, 4), ENC_BIG_ENDIAN)
    off = off + 4
    len = len - 4
  end

  if cmd == CMD_REPLY_BINDING or cmd == CMD_LOGIN then
    subtree:add_packet_field(f_passcode_len, buf(off, 2), ENC_BIG_ENDIAN)
    local passcode_len = buf(off, 2):uint()
    off = off + 2
    len = len - 2

    subtree:add_packet_field(f_passcode, buf(off, passcode_len), ENC_BIG_ENDIAN)
    off = off + passcode_len
    len = len - passcode_len
  end

  if cmd == CMD_REPLY_LOGIN then
    subtree:add_packet_field(f_login, buf(off, 1), ENC_BIG_ENDIAN)
    local login = buf(off, 1):uint()
    off = off + 1
    len = len - 1

    local login_s = logins[login]
    if login_s == nil then login_s = string.format("Unknown result (0x%02x)", login) end
    subtree:append_text(", " .. login_s)
  end

  subtree:set_len(off)

  if cmd == CMD_TRANSMIT or cmd == CMD_TRANSMIT_91 or cmd == CMD_CTL_93 or cmd == CMD_CTLACK_94 then
    if buf:len() > off then
      local addr
      if cmd == CMD_TRANSMIT or cmd == CMD_CTL_93 then
        addr = pkt.dst
      else
        addr = pkt.src
      end

      local product_key = productkeys_by_ip[tostring(addr)];
      if product_key and d_table:get_dissector(product_key) then
        local bytes = d_table:try(product_key, buf(off):tvb(), pkt, tree)
        off = off + bytes
        len = len - bytes
      else
        local subtree = tree:add(p_gizwits_unknown)
        subtree:add(f_payload, buf(off, len))
        off = off + len
        len = 0
      end
    end
  end

  if buf:len() > off then
    tree:add(f_payload, buf(off, len))
    off = off + len
    len = 0
  end

  if buf:len() > off then
    -- fallback dissector that just shows the raw data.
    data_dis:call(buf(off):tvb(), pkt, tree)

    --dissector(buf(off), pkt, tree)
  end

end

function p_gizwits.dissector(buf, pkt, tree)

  if pkt.match_uint == 12414 or pkt.match_uint == 12416 then
    -- This helps Wireshark keep the currently selected field when switching between tcp/udp and mqtt packets
    tree:add(p_gizwits, "...")
  end

  dissector(buf, pkt, tree)

end

local udp_encap_table = DissectorTable.get("udp.port")
local tcp_encap_table = DissectorTable.get("tcp.port")
--local mqtt_topic_table = Dissector.get("mqtt").topic")

---@diagnostic disable-next-line: need-check-nil
udp_encap_table:add(12414, p_gizwits)
---@diagnostic disable-next-line: need-check-nil
tcp_encap_table:add(12416, p_gizwits)
--mqtt_topic_table:add("dev2app/", p_gizwits)
