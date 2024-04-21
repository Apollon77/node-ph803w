---@meta

bit32 = require "bit32"

ENC_BIG_ENDIAN = 0x00000000
ENC_LITTLE_ENDIAN = 0x80000000

---@enum base
base = {
  NONE = 0,
  DEC = 1,
  HEX = 2,
  OCT = 3,
  DEC_HEX = 4,
  HEX_DEC = 5,
  CUSTOM = 6,

  FLOAT = 0,  -- NONE

  ASCII = 0,
  UNICODE = 7,

  DOT = 8,
  DASH = 9,
  COLON = 10,
  SPACE = 11,

  NETMASK = 12,

  PT_UDP = 13,
  PT_TCP = 14,
  PT_DCCP = 15,
  PT_SCTP = 16,

  OUI = 17,

  LOCAL = 1000,
  UTC = 1001,
  DOY_UTC = 1002,
  NTP_UTC = 1003,

  RANGE_STRING = 0x00000100,
  UNIT_STRING = 0x00001000,
}

---@enum ftypes
ftypes = {
  NONE = 0,
  PROTOCOL = 1,
  BOOLEAN = 2,
  CHAR = 3,
  UINT8 = 4,
  UINT16 = 5,
  UINT24 = 6,
  UINT32 = 7,
  UINT40 = 8,
  UINT48 = 9,
  UINT56 = 10,
  UINT64 = 11,
  INT8 = 12,
  INT16 = 13,
  INT24 = 14,
  INT32 = 15,
  INT40 = 16,
  INT48 = 17,
  INT56 = 18,
  INT64 = 19,
  IEEE_11073_SFLOAT = 20,
  IEEE_11073_FLOAT = 21,
  FLOAT = 22,
  DOUBLE = 23,
  ABSOLUTE_TIME = 24,
  RELATIVE_TIME = 25,
  STRING = 26,
  STRINGZ = 27,
  UINT_STRING = 28,
  ETHER = 29,
  BYTES = 30,
  UINT_BYTES = 31,
  IPv4 = 32,
  IPv6 = 33,
  IPXNET = 34,
  FRAMENUM = 35,
  GUID = 36,
  OID = 37,
  EUI64 = 38,
  AX25 = 39,
  VINES = 40,
  REL_OID = 41,
  SYSTEM_ID = 42,
  STRINGZPAD = 43,
  FCWWN = 44,
  STRINGZTRUNC = 45,
}

---@class Dissector
function Dissector() end

---@class DissectorTable
function DissectorTable() end

---comment Try all the dissectors in a given heuristic dissector table.
---@param listname string The name of the heuristic dissector.
---@param tvb any The buffer to dissect.
---@param pinfo any The packet info.
---@param tree any The tree on which to add the protocol items.
---@return boolean # True if the packet was recognized by the sub-dissector (stop dissection here).
function DissectorTable.try_heuristics(listname,
   tvb, pinfo, tree) end

---@param tablename string The short name of the table.
---@return DissectorTable|nil # The DissectorTable reference if found, otherwise nil.
function DissectorTable.get(tablename) end

---@param pattern integer|string The pattern to match (either an integer, a integer range or a string depending on the table’s type).
---@param dissector Proto|Dissector The dissector to add (either a Proto or a Dissector).
function DissectorTable:add(pattern, dissector) end

---@class Field
function Field() end

function Field.new(fieldname) end

---@class FieldInfo
function FieldInfo() end

---@class Proto
---@param name string The name of the protocol.
---@param desc string A Long Text description of the protocol (usually lowercase).
---@return Proto # The new Proto object.
function Proto(name, desc) end

---@class ProtoField
function ProtoField() end

function ProtoField.new(name, abbr, type, valuestring, base, mask, descr) end
function ProtoField.bool(abbr, name, display, valuestring, mask, desc) end
function ProtoField.uint8(abbr, name, base, valuestring, mask, desc) end
function ProtoField.uint16(abbr, name, base, valuestring, mask, desc) end
function ProtoField.uint24(abbr, name, base, valuestring, mask, desc) end
function ProtoField.uint32(abbr, name, base, valuestring, mask, desc) end
function ProtoField.uint64(abbr, name, base, valuestring, mask, desc) end
function ProtoField.int8(abbr, name, base, valuestring, mask, desc) end
function ProtoField.int16(abbr, name, base, valuestring, mask, desc) end
function ProtoField.int24(abbr, name, base, valuestring, mask, desc) end
function ProtoField.int32(abbr, name, base, valuestring, mask, desc) end
function ProtoField.int64(abbr, name, base, valuestring, mask, desc) end
function ProtoField.none(abbr, name, desc) end
