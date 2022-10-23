-- http://api.gizwits.com/app/datapoint?product_key=de9e8d18d9394cce9081b25a531e552b
-- http://mageddo.com/tools/json-to-lua-converter
local prefix = "gizwits.gizkit_soc_pet"
local dataPoint = {
  name = "My WeChat Pet House SOC",
  packetVersion = "0x00000004",
  protocolType = "standard",
  product_key = "de9e8d18d9394cce9081b25a531e552b",
  entities = { {
    display_name = "Gizwits Development Kit",
    attrs = { {
      display_name = "Turn on/off the red light",
      name = "LED_OnOff",
      data_type = "bool",
      position = {
        byte_offset = 0,
        unit = "bit",
        len = 1,
        bit_offset = 0
      },
      type = "status_writable",
      id = 0,
      desc = ""
    }, {
      display_name = "Set LED combination color",
      name = "LED_Color",
      data_type = "enum",
      enum = { "Customize", "Yellow", "Purple", "Pink" },
      position = {
        byte_offset = 0,
        unit = "bit",
        len = 2,
        bit_offset = 1
      },
      type = "status_writable",
      id = 1,
      desc = ""
    }, {
      display_name = "Set LED red value",
      name = "LED_R",
      data_type = "uint8",
      position = {
        byte_offset = 1,
        unit = "byte",
        len = 1,
        bit_offset = 0
      },
      uint_spec = {
        addition = 0,
        max = 254,
        ratio = 1,
        min = 0
      },
      type = "status_writable",
      id = 2,
      desc = ""
    }, {
      display_name = "Set LED green value",
      name = "LED_G",
      data_type = "uint8",
      position = {
        byte_offset = 2,
        unit = "byte",
        len = 1,
        bit_offset = 0
      },
      uint_spec = {
        addition = 0,
        max = 254,
        ratio = 1,
        min = 0
      },
      type = "status_writable",
      id = 3,
      desc = ""
    }, {
      display_name = "Set LED blue value",
      name = "LED_B",
      data_type = "uint8",
      position = {
        byte_offset = 3,
        unit = "byte",
        len = 1,
        bit_offset = 0
      },
      uint_spec = {
        addition = 0,
        max = 254,
        ratio = 1,
        min = 0
      },
      type = "status_writable",
      id = 4,
      desc = ""
    }, {
      display_name = "Set motor speed",
      name = "Motor_Speed",
      data_type = "uint8",
      position = {
        byte_offset = 4,
        unit = "byte",
        len = 1,
        bit_offset = 0
      },
      uint_spec = {
        addition = -5,
        max = 10,
        ratio = 1,
        min = 0
      },
      type = "status_writable",
      id = 5,
      desc = ""
    }, {
      display_name = "Infrared detection",
      name = "Infrared",
      data_type = "bool",
      position = {
        byte_offset = 5,
        unit = "bit",
        len = 1,
        bit_offset = 0
      },
      type = "status_readonly",
      id = 6,
      desc = ""
    }, {
      display_name = "Ambient temperature",
      name = "Temperature",
      data_type = "uint8",
      position = {
        byte_offset = 6,
        unit = "byte",
        len = 1,
        bit_offset = 0
      },
      uint_spec = {
        addition = -13,
        max = 200,
        ratio = 1,
        min = 0
      },
      type = "status_readonly",
      id = 7,
      desc = ""
    }, {
      display_name = "environment humidity",
      name = "Humidity",
      data_type = "uint8",
      position = {
        byte_offset = 7,
        unit = "byte",
        len = 1,
        bit_offset = 0
      },
      uint_spec = {
        addition = 0,
        max = 100,
        ratio = 1,
        min = 0
      },
      type = "status_readonly",
      id = 8,
      desc = ""
    }, {
      display_name = "Alarm 1",
      name = "Alert_1",
      data_type = "bool",
      position = {
        byte_offset = 8,
        unit = "bit",
        len = 1,
        bit_offset = 0
      },
      type = "alert",
      id = 9,
      desc = ""
    }, {
      display_name = "Alarm 2",
      name = "Alert_2",
      data_type = "bool",
      position = {
        byte_offset = 8,
        unit = "bit",
        len = 1,
        bit_offset = 1
      },
      type = "alert",
      id = 10,
      desc = ""
    }, {
      display_name = "LED fault",
      name = "Fault_LED",
      data_type = "bool",
      position = {
        byte_offset = 9,
        unit = "bit",
        len = 1,
        bit_offset = 0
      },
      type = "fault",
      id = 11,
      desc = ""
    }, {
      display_name = "motor failure",
      name = "Fault_Motor",
      data_type = "bool",
      position = {
        byte_offset = 9,
        unit = "bit",
        len = 1,
        bit_offset = 1
      },
      type = "fault",
      id = 12,
      desc = ""
    }, {
      display_name = "Temperature and humidity sensor failure",
      name = "Fault_TemHum",
      data_type = "bool",
      position = {
        byte_offset = 9,
        unit = "bit",
        len = 1,
        bit_offset = 2
      },
      type = "fault",
      id = 13,
      desc = ""
    }, {
      display_name = "Infrared sensor failure",
      name = "Fault_IR",
      data_type = "bool",
      position = {
        byte_offset = 9,
        unit = "bit",
        len = 1,
        bit_offset = 3
      },
      type = "fault",
      id = 14,
      desc = ""
    } },
    name = "entity0",
    id = 0
  } },
  ui = {
    object = {
      version = 4,
      showEditButton = false
    },
    sections = { {
      elements = { {
        boolValue = false,
        object = {
          action = "entity0",
          bind = { "entity0.LED_OnOff" },
          perm = "W"
        },
        type = "QBooleanElement",
        key = "entity0.LED_OnOff",
        title = "Turn on/off the red light"
      }, {
        items = { "Customize", "Yellow", "Purple", "Pink" },
        object = {
          action = "entity0",
          bind = { "entity0.LED_Color" },
          perm = "W"
        },
        type = "QRadioElement",
        key = "entity0.LED_Color",
        title = "Set LED combination color"
      }, {
        title = "Set LED red value",
        bind = "floatValue:float",
        object = {
          action = "entity0",
          bind = { "entity0.LED_R" },
          uint_spec = {
            max = 254,
            step = 1,
            min = 0
          },
          perm = "W"
        },
        value = 0,
        key = "entity0.LED_R",
        maximumValue = 254,
        minimumValue = 0,
        type = "QFloatElement"
      }, {
        title = "Set LED green value",
        bind = "floatValue:float",
        object = {
          action = "entity0",
          bind = { "entity0.LED_G" },
          uint_spec = {
            max = 254,
            step = 1,
            min = 0
          },
          perm = "W"
        },
        value = 0,
        key = "entity0.LED_G",
        maximumValue = 254,
        minimumValue = 0,
        type = "QFloatElement"
      }, {
        title = "Set LED blue value",
        bind = "floatValue:float",
        object = {
          action = "entity0",
          bind = { "entity0.LED_B" },
          uint_spec = {
            max = 254,
            step = 1,
            min = 0
          },
          perm = "W"
        },
        value = 0,
        key = "entity0.LED_B",
        maximumValue = 254,
        minimumValue = 0,
        type = "QFloatElement"
      }, {
        title = "Set the motor speed",
        bind = "floatValue:float",
        object = {
          action = "entity0",
          bind = { "entity0.Motor_Speed" },
          uint_spec = {
            max = 5,
            step = 1,
            min = -5
          },
          perm = "W"
        },
        value = 0,
        key = "entity0.Motor_Speed",
        maximumValue = 5,
        minimumValue = -5,
        type = "QFloatElement"
      }, {
        boolValue = false,
        object = {
          action = "entity0",
          bind = { "entity0.Infrared" },
          perm = "N"
        },
        type = "QBooleanElement",
        key = "entity0.Infrared",
        title = "Infrared Detection"
      }, {
        object = {
          action = "entity0",
          bind = { "entity0.Temperature" },
          uint_spec = {
            max = 187,
            step = 1,
            min = -13
          },
          perm = "N"
        },
        type = "QLabelElement",
        key = "entity0.Temperature",
        title = "Ambient Temperature"
      }, {
        object = {
          action = "entity0",
          bind = { "entity0.Humidity" },
          uint_spec = {
            max = 100,
            step = 1,
            min = 0
          },
          perm = "N"
        },
        type = "QLabelElement",
        key = "entity0.Humidity",
        title = "Ambient Humidity"
      } }
    } }
  }
}

local ACTION_CONTROL_DEVICE       = 0x01  -- Protocol 4.10 WiFi Module Control Device WiFi Module Send
local ACTION_READ_DEV_STATUS      = 0x02  -- Protocol 4.8 WiFi Module Reads the current status of the device WiFi module sent
local ACTION_READ_DEV_STATUS_ACK  = 0x03  -- Protocol 4.8 WiFi Module Read Device Current Status Device MCU Reply
local ACTION_REPORT_DEV_STATUS    = 0x04  -- Protocol 4.9 device MCU to the WiFi module to actively report the current status of the device to send the MCU
local ACTION_W2D_TRANSPARENT_DATA = 0x05  -- WiFi to device MCU transparent
local ACTION_D2W_TRANSPARENT_DATA = 0x06  -- Device MCU to WiFi

local actions = {
  [ACTION_CONTROL_DEVICE      ] = "Control Device",
  [ACTION_READ_DEV_STATUS     ] = "Read Device Status",
  [ACTION_READ_DEV_STATUS_ACK ] = "Read Device Status Ack",
  [ACTION_REPORT_DEV_STATUS   ] = "Report Device Status",
  [ACTION_W2D_TRANSPARENT_DATA] = "Private data: WiFi to device MCU",
  [ACTION_D2W_TRANSPARENT_DATA] = "Private data: Device MCU to WiFi",
}

local f_action = ProtoField.uint8(prefix .. ".action", "Action", base.HEX, actions)
local f_flags = ProtoField.uint16(prefix .. ".flags", "Flags", base.HEX)

local fields = {
  f_action, f_flags,
}

local attrs_by_type = {
  status_writable = {},
  status_readonly = {},
  alert = {},
  fault = {},
}
local count_bits_by_type = {
  status_writable = 0,
  status_readonly = 0,
  alert = 0,
  fault = 0,
}
local attrs = dataPoint.entities[1].attrs
for _, attr in ipairs(attrs) do
  local list = attrs_by_type[attr.type]
  list[#list + 1] = attr
  if attr.data_type == "bool" then
    count_bits_by_type[attr.type] = count_bits_by_type[attr.type] + 1
  end
end

local add_packet_field_for_flag = {}
local count_flag_bits = math.ceil(#attrs_by_type.status_writable / 8)

do
  local mask = 1;
  for i, attr in ipairs(attrs_by_type.status_writable) do
    local field = ProtoField.bool(prefix .. ".flags." .. attr.name, attr.display_name, count_flag_bits * 8, {'Set', 'Not set'}, mask)
    add_packet_field_for_flag[#add_packet_field_for_flag + 1] = function (subtree, r_values)
      local f = subtree:add_packet_field(field, r_values, ENC_BIG_ENDIAN)
      return attr, f, r_values:bitfield(count_flag_bits * 8 - i)
    end
    fields[#fields + 1] = field
    mask = mask * 2;
  end
end

local make_protofield_by_data_type = {
  uint8 = function(attr)
    return ProtoField.uint8(prefix .. ".value." .. attr.name, attr.display_name)
  end,
  uint16 = function(attr)
    return ProtoField.uint16(prefix .. ".value." .. attr.name, attr.display_name)
  end,
  uint24 = function(attr)
    return ProtoField.uint24(prefix .. ".value." .. attr.name, attr.display_name)
  end,
  uint32 = function(attr)
    return ProtoField.uint32(prefix .. ".value." .. attr.name, attr.display_name)
  end,
  int8 = function(attr)
    return ProtoField.int8(prefix .. ".value." .. attr.name, attr.display_name)
  end,
  int16 = function(attr)
    return ProtoField.int16(prefix .. ".value." .. attr.name, attr.display_name)
  end,
  int24 = function(attr)
    return ProtoField.int24(prefix .. ".value." .. attr.name, attr.display_name)
  end,
  int32 = function(attr)
    return ProtoField.int32(prefix .. ".value." .. attr.name, attr.display_name)
  end,
  enum = function(attr)
    local table = {}
    for k, v in ipairs(attr.enum) do
      table[k - 1] = v
    end
    return ProtoField.uint8(prefix .. ".value." .. attr.name, attr.display_name, base.UNIT_DEC, table)
  end,
  bool = function(attr)
    local display = count_bits_by_type[attr.type] * 8
    local mask = bit32.lshift(1, attr.position.bit_offset)
    return ProtoField.bool(prefix .. ".value." .. attr.name, attr.display_name, display, nil, mask)
  end,
  fallback = function(attr)
    return ProtoField.none(prefix .. ".value." .. attr.name, attr.display_name .. ', unknown data_type: ' .. attr.data_type)
  end,
}

local add_packet_field_by_type = {
  status_writable = {},
  status_readonly = {},
  alert = {},
  fault = {},
}
for type, attrs_for_type in pairs(attrs_by_type) do
  count_bits_by_type[type] = math.ceil(count_bits_by_type[type] / 8)

  for i, attr in ipairs(attrs_for_type) do
    local maker = make_protofield_by_data_type[attr.data_type]
    if not maker then
      maker = make_protofield_by_data_type.fallback
    end
    local field = maker(attr)
    local list = add_packet_field_by_type[attr.type]
    list[#list + 1] = function (subtree, r_values)
      local len = attr.position.len
      if attr.position.unit == 'bit' then
        len = math.ceil(len / 8)
      end
      return attr, subtree:add_packet_field(field, r_values(attr.position.byte_offset, len), ENC_BIG_ENDIAN)
    end
    fields[#fields + 1] = field
  end
end

local proto = Proto(prefix, "Gizwits Data Point: " .. dataPoint.name);
proto.fields = fields

local data_dis = Dissector.get("data")

function proto.dissector(buf, pkt, tree)

  local subtree = tree:add(proto, buf())
  local off = 0
  local len = buf:len()

  subtree:add(f_action, buf(off, 1))
  local action = buf(off, 1):uint()
  off = off + 1
  len = len - 1

  if action == ACTION_CONTROL_DEVICE and count_flag_bits > 0 then

    local r_flags = buf(off, count_flag_bits)
    off = off + count_flag_bits
    len = len - count_flag_bits

    local t_flags = subtree:add_packet_field(f_flags, r_flags, ENC_BIG_ENDIAN)
    local values = {}

    for i, add_packet_field in ipairs(add_packet_field_for_flag) do
      local attr, _, value = add_packet_field(t_flags, r_flags)
      if not (value == 0) then
        values[#values+1] = attr.name
      end
    end
    t_flags:append_text(" (" .. table.concat(values, ", ") .. ")")

    local r_values = buf(off, len)
    off = off + len
    len = 0

    for i, add_packet_field in ipairs(add_packet_field_by_type.status_writable) do
      local attr, treeitem = add_packet_field(subtree, r_values)
    end

  elseif action == ACTION_REPORT_DEV_STATUS then

    local r_status = buf(off, len)
    off = off + len
    len = 0

    for _, add_packet_field in ipairs(add_packet_field_by_type.status_writable) do
      add_packet_field(subtree, r_status)
    end

    for _, add_packet_field in ipairs(add_packet_field_by_type.status_readonly) do
      add_packet_field(subtree, r_status)
    end

    for _, add_packet_field in ipairs(add_packet_field_by_type.alert) do
      add_packet_field(subtree, r_status)
    end

    for _, add_packet_field in ipairs(add_packet_field_by_type.fault) do
      add_packet_field(subtree, r_status)
    end

  end

  if buf:len() > off then

    data_dis:call(buf(off):tvb(), pkt, subtree)

  end

end

DissectorTable.get("gizwits"):add(dataPoint.product_key, proto)
