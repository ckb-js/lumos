(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.CKBCore = {}));
}(this, (function (exports) { 'use strict';

  function dataLengthError(actual, required) {
      throw new Error(`Invalid data length! Required: ${required}, actual: ${actual}`);
  }

  function assertDataLength(actual, required) {
    if (actual !== required) {
      dataLengthError(actual, required);
    }
  }

  function assertArrayBuffer(reader) {
    if (reader instanceof Object && reader.toArrayBuffer instanceof Function) {
      reader = reader.toArrayBuffer();
    }
    if (!(reader instanceof ArrayBuffer)) {
      throw new Error("Provided value must be an ArrayBuffer or can be transformed into ArrayBuffer!");
    }
    return reader;
  }

  function verifyAndExtractOffsets(view, expectedFieldCount, compatible) {
    if (view.byteLength < 4) {
      dataLengthError(view.byteLength, ">4");
    }
    const requiredByteLength = view.getUint32(0, true);
    assertDataLength(view.byteLength, requiredByteLength);
    if (requiredByteLength === 4) {
      return [requiredByteLength];
    }
    if (requiredByteLength < 8) {
      dataLengthError(view.byteLength, ">8");
    }
    const firstOffset = view.getUint32(4, true);
    if (firstOffset % 4 !== 0 || firstOffset < 8) {
      throw new Error(`Invalid first offset: ${firstOffset}`);
    }
    const itemCount = firstOffset / 4 - 1;
    if (itemCount < expectedFieldCount) {
      throw new Error(`Item count not enough! Required: ${expectedFieldCount}, actual: ${itemCount}`);
    } else if ((!compatible) && itemCount > expectedFieldCount) {
      throw new Error(`Item count is more than required! Required: ${expectedFieldCount}, actual: ${itemCount}`);
    }
    if (requiredByteLength < firstOffset) {
      throw new Error(`First offset is larger than byte length: ${firstOffset}`);
    }
    const offsets = [];
    for (let i = 0; i < itemCount; i++) {
      const start = 4 + i * 4;
      offsets.push(view.getUint32(start, true));
    }
    offsets.push(requiredByteLength);
    for (let i = 0; i < offsets.length - 1; i++) {
      if (offsets[i] > offsets[i + 1]) {
        throw new Error(`Offset index ${i}: ${offsets[i]} is larger than offset index ${i + 1}: ${offsets[i + 1]}`);
      }
    }
    return offsets;
  }

  function serializeTable(buffers) {
    const itemCount = buffers.length;
    let totalSize = 4 * (itemCount + 1);
    const offsets = [];

    for (let i = 0; i < itemCount; i++) {
      offsets.push(totalSize);
      totalSize += buffers[i].byteLength;
    }

    const buffer = new ArrayBuffer(totalSize);
    const array = new Uint8Array(buffer);
    const view = new DataView(buffer);

    view.setUint32(0, totalSize, true);
    for (let i = 0; i < itemCount; i++) {
      view.setUint32(4 + i * 4, offsets[i], true);
      array.set(new Uint8Array(buffers[i]), offsets[i]);
    }
    return buffer;
  }

  class Uint32 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 4);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    toBigEndianUint32() {
      return this.view.getUint32(0, false);
    }

    toLittleEndianUint32() {
      return this.view.getUint32(0, true);
    }

    static size() {
      return 4;
    }
  }

  function SerializeUint32(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 4);
    return buffer;
  }

  class Uint64 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 8);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    toBigEndianBigUint64() {
      return this.view.getBigUint64(0, false);
    }

    toLittleEndianBigUint64() {
      return this.view.getUint64(0, true);
    }

    static size() {
      return 8;
    }
  }

  function SerializeUint64(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 8);
    return buffer;
  }

  class Uint128 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 16);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    static size() {
      return 16;
    }
  }

  function SerializeUint128(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 16);
    return buffer;
  }

  class Byte32 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 32);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    static size() {
      return 32;
    }
  }

  function SerializeByte32(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 32);
    return buffer;
  }

  class Uint256 {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 32);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    static size() {
      return 32;
    }
  }

  function SerializeUint256(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 32);
    return buffer;
  }

  class Bytes {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      if (this.view.byteLength < 4) {
        dataLengthError(this.view.byteLength, ">4");
      }
      const requiredByteLength = this.length() + 4;
      assertDataLength(this.view.byteLength, requiredByteLength);
    }

    raw() {
      return this.view.buffer.slice(4);
    }

    indexAt(i) {
      return this.view.getUint8(4 + i);
    }

    length() {
      return this.view.getUint32(0, true);
    }
  }

  function SerializeBytes(value) {
    const item = assertArrayBuffer(value);
    const array = new Uint8Array(4 + item.byteLength);
    (new DataView(array.buffer)).setUint32(0, item.byteLength, true);
    array.set(new Uint8Array(item), 4);
    return array.buffer;
  }

  class BytesOpt {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      if (this.hasValue()) {
        this.value().validate(compatible);
      }
    }

    value() {
      return new Bytes(this.view.buffer, { validate: false });
    }

    hasValue() {
      return this.view.byteLength > 0;
    }
  }

  function SerializeBytesOpt(value) {
    if (value) {
      return SerializeBytes(value);
    } else {
      return new ArrayBuffer(0);
    }
  }

  class BytesVec {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      for (let i = 0; i < len(offsets) - 1; i++) {
        new Bytes(this.view.buffer.slice(offsets[i], offsets[i + 1]), { validate: false }).validate();
      }
    }

    length() {
      if (this.view.byteLength < 8) {
        return 0;
      } else {
        return this.view.getUint32(4, true) / 4 - 1;
      }
    }

    indexAt(i) {
      const start = 4 + i * 4;
      const offset = this.view.getUint32(start, true);
      let offset_end = this.view.byteLength;
      if (i + 1 < this.length()) {
        offset_end = this.view.getUint32(start + 4, true);
      }
      return new Bytes(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeBytesVec(value) {
    return serializeTable(value.map(item => SerializeBytes(item)));
  }

  class Byte32Vec {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      if (this.view.byteLength < 4) {
        dataLengthError(this.view.byteLength, ">4");
      }
      const requiredByteLength = this.length() * Byte32.size() + 4;
      assertDataLength(this.view.byteLength, requiredByteLength);
      for (let i = 0; i < 0; i++) {
        const item = this.indexAt(i);
        item.validate(compatible);
      }
    }

    indexAt(i) {
      return new Byte32(this.view.buffer.slice(4 + i * Byte32.size(), 4 + (i + 1) * Byte32.size()), { validate: false });
    }

    length() {
      return this.view.getUint32(0, true);
    }
  }

  function SerializeByte32Vec(value) {
    const array = new Uint8Array(4 + Byte32.size() * value.length);
    (new DataView(array.buffer)).setUint32(0, value.length, true);
    for (let i = 0; i < value.length; i++) {
      const itemBuffer = SerializeByte32(value[i]);
      array.set(new Uint8Array(itemBuffer), 4 + i * Byte32.size());
    }
    return array.buffer;
  }

  class ScriptOpt {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      if (this.hasValue()) {
        this.value().validate(compatible);
      }
    }

    value() {
      return new Script(this.view.buffer, { validate: false });
    }

    hasValue() {
      return this.view.byteLength > 0;
    }
  }

  function SerializeScriptOpt(value) {
    if (value) {
      return SerializeScript(value);
    } else {
      return new ArrayBuffer(0);
    }
  }

  class ProposalShortId {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, 10);
    }

    indexAt(i) {
      return this.view.getUint8(i);
    }

    raw() {
      return this.view.buffer;
    }

    static size() {
      return 10;
    }
  }

  function SerializeProposalShortId(value) {
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 10);
    return buffer;
  }

  class UncleBlockVec {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      for (let i = 0; i < len(offsets) - 1; i++) {
        new UncleBlock(this.view.buffer.slice(offsets[i], offsets[i + 1]), { validate: false }).validate();
      }
    }

    length() {
      if (this.view.byteLength < 8) {
        return 0;
      } else {
        return this.view.getUint32(4, true) / 4 - 1;
      }
    }

    indexAt(i) {
      const start = 4 + i * 4;
      const offset = this.view.getUint32(start, true);
      let offset_end = this.view.byteLength;
      if (i + 1 < this.length()) {
        offset_end = this.view.getUint32(start + 4, true);
      }
      return new UncleBlock(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeUncleBlockVec(value) {
    return serializeTable(value.map(item => SerializeUncleBlock(item)));
  }

  class TransactionVec {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      for (let i = 0; i < len(offsets) - 1; i++) {
        new Transaction(this.view.buffer.slice(offsets[i], offsets[i + 1]), { validate: false }).validate();
      }
    }

    length() {
      if (this.view.byteLength < 8) {
        return 0;
      } else {
        return this.view.getUint32(4, true) / 4 - 1;
      }
    }

    indexAt(i) {
      const start = 4 + i * 4;
      const offset = this.view.getUint32(start, true);
      let offset_end = this.view.byteLength;
      if (i + 1 < this.length()) {
        offset_end = this.view.getUint32(start + 4, true);
      }
      return new Transaction(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeTransactionVec(value) {
    return serializeTable(value.map(item => SerializeTransaction(item)));
  }

  class ProposalShortIdVec {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      if (this.view.byteLength < 4) {
        dataLengthError(this.view.byteLength, ">4");
      }
      const requiredByteLength = this.length() * ProposalShortId.size() + 4;
      assertDataLength(this.view.byteLength, requiredByteLength);
      for (let i = 0; i < 0; i++) {
        const item = this.indexAt(i);
        item.validate(compatible);
      }
    }

    indexAt(i) {
      return new ProposalShortId(this.view.buffer.slice(4 + i * ProposalShortId.size(), 4 + (i + 1) * ProposalShortId.size()), { validate: false });
    }

    length() {
      return this.view.getUint32(0, true);
    }
  }

  function SerializeProposalShortIdVec(value) {
    const array = new Uint8Array(4 + ProposalShortId.size() * value.length);
    (new DataView(array.buffer)).setUint32(0, value.length, true);
    for (let i = 0; i < value.length; i++) {
      const itemBuffer = SerializeProposalShortId(value[i]);
      array.set(new Uint8Array(itemBuffer), 4 + i * ProposalShortId.size());
    }
    return array.buffer;
  }

  class CellDepVec {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      if (this.view.byteLength < 4) {
        dataLengthError(this.view.byteLength, ">4");
      }
      const requiredByteLength = this.length() * CellDep.size() + 4;
      assertDataLength(this.view.byteLength, requiredByteLength);
      for (let i = 0; i < 0; i++) {
        const item = this.indexAt(i);
        item.validate(compatible);
      }
    }

    indexAt(i) {
      return new CellDep(this.view.buffer.slice(4 + i * CellDep.size(), 4 + (i + 1) * CellDep.size()), { validate: false });
    }

    length() {
      return this.view.getUint32(0, true);
    }
  }

  function SerializeCellDepVec(value) {
    const array = new Uint8Array(4 + CellDep.size() * value.length);
    (new DataView(array.buffer)).setUint32(0, value.length, true);
    for (let i = 0; i < value.length; i++) {
      const itemBuffer = SerializeCellDep(value[i]);
      array.set(new Uint8Array(itemBuffer), 4 + i * CellDep.size());
    }
    return array.buffer;
  }

  class CellInputVec {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      if (this.view.byteLength < 4) {
        dataLengthError(this.view.byteLength, ">4");
      }
      const requiredByteLength = this.length() * CellInput.size() + 4;
      assertDataLength(this.view.byteLength, requiredByteLength);
      for (let i = 0; i < 0; i++) {
        const item = this.indexAt(i);
        item.validate(compatible);
      }
    }

    indexAt(i) {
      return new CellInput(this.view.buffer.slice(4 + i * CellInput.size(), 4 + (i + 1) * CellInput.size()), { validate: false });
    }

    length() {
      return this.view.getUint32(0, true);
    }
  }

  function SerializeCellInputVec(value) {
    const array = new Uint8Array(4 + CellInput.size() * value.length);
    (new DataView(array.buffer)).setUint32(0, value.length, true);
    for (let i = 0; i < value.length; i++) {
      const itemBuffer = SerializeCellInput(value[i]);
      array.set(new Uint8Array(itemBuffer), 4 + i * CellInput.size());
    }
    return array.buffer;
  }

  class CellOutputVec {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      for (let i = 0; i < len(offsets) - 1; i++) {
        new CellOutput(this.view.buffer.slice(offsets[i], offsets[i + 1]), { validate: false }).validate();
      }
    }

    length() {
      if (this.view.byteLength < 8) {
        return 0;
      } else {
        return this.view.getUint32(4, true) / 4 - 1;
      }
    }

    indexAt(i) {
      const start = 4 + i * 4;
      const offset = this.view.getUint32(start, true);
      let offset_end = this.view.byteLength;
      if (i + 1 < this.length()) {
        offset_end = this.view.getUint32(start + 4, true);
      }
      return new CellOutput(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeCellOutputVec(value) {
    return serializeTable(value.map(item => SerializeCellOutput(item)));
  }

  class Script {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new Byte32(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      if (offsets[2] - offsets[1] !== 1) {
        throw new Error(`Invalid offset for hash_type: ${offsets[1]} - ${offsets[2]}`)
      }
      new Bytes(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
    }

    getCodeHash() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Byte32(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getHashType() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new DataView(this.view.buffer.slice(offset, offset_end)).getUint8(0);
    }

    getArgs() {
      const start = 12;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new Bytes(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeScript(value) {
    const buffers = [];
    buffers.push(SerializeByte32(value.code_hash));
    const hashTypeView = new DataView(new ArrayBuffer(1));
    hashTypeView.setUint8(0, value.hash_type);
    buffers.push(hashTypeView.buffer);
    buffers.push(SerializeBytes(value.args));
    return serializeTable(buffers);
  }

  class OutPoint {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    getTxHash() {
      return new Byte32(this.view.buffer.slice(0, 0 + Byte32.size()), { validate: false });
    }

    getIndex() {
      return new Uint32(this.view.buffer.slice(0 + Byte32.size(), 0 + Byte32.size() + Uint32.size()), { validate: false });
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, OutPoint.size());
      this.getTxHash().validate(compatible);
      this.getIndex().validate(compatible);
    }
    static size() {
      return 0 + Byte32.size() + Uint32.size();
    }
  }

  function SerializeOutPoint(value) {
    const array = new Uint8Array(0 + Byte32.size() + Uint32.size());
    array.set(new Uint8Array(SerializeByte32(value.tx_hash)), 0);
    array.set(new Uint8Array(SerializeUint32(value.index)), 0 + Byte32.size());
    return array.buffer;
  }

  class CellInput {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    getSince() {
      return new Uint64(this.view.buffer.slice(0, 0 + Uint64.size()), { validate: false });
    }

    getPreviousOutput() {
      return new OutPoint(this.view.buffer.slice(0 + Uint64.size(), 0 + Uint64.size() + OutPoint.size()), { validate: false });
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, CellInput.size());
      this.getSince().validate(compatible);
      this.getPreviousOutput().validate(compatible);
    }
    static size() {
      return 0 + Uint64.size() + OutPoint.size();
    }
  }

  function SerializeCellInput(value) {
    const array = new Uint8Array(0 + Uint64.size() + OutPoint.size());
    array.set(new Uint8Array(SerializeUint64(value.since)), 0);
    array.set(new Uint8Array(SerializeOutPoint(value.previous_output)), 0 + Uint64.size());
    return array.buffer;
  }

  class CellOutput {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new Uint64(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new Script(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
      new ScriptOpt(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
    }

    getCapacity() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Uint64(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getLock() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Script(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getType() {
      const start = 12;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new ScriptOpt(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeCellOutput(value) {
    const buffers = [];
    buffers.push(SerializeUint64(value.capacity));
    buffers.push(SerializeScript(value.lock));
    buffers.push(SerializeScriptOpt(value.type_));
    return serializeTable(buffers);
  }

  class CellDep {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    getOutPoint() {
      return new OutPoint(this.view.buffer.slice(0, 0 + OutPoint.size()), { validate: false });
    }

    getDepType() {
      return this.view.getUint8(0 + OutPoint.size());
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, CellDep.size());
      this.getOutPoint().validate(compatible);
    }
    static size() {
      return 0 + OutPoint.size() + 1;
    }
  }

  function SerializeCellDep(value) {
    const array = new Uint8Array(0 + OutPoint.size() + 1);
    const view = new DataView(array.buffer);
    array.set(new Uint8Array(SerializeOutPoint(value.out_point)), 0);
    view.setUint8(0 + OutPoint.size(), value.dep_type);
    return array.buffer;
  }

  class RawTransaction {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new Uint32(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new CellDepVec(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
      new Byte32Vec(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
      new CellInputVec(this.view.buffer.slice(offsets[3], offsets[4]), { validate: false }).validate();
      new CellOutputVec(this.view.buffer.slice(offsets[4], offsets[5]), { validate: false }).validate();
      new BytesVec(this.view.buffer.slice(offsets[5], offsets[6]), { validate: false }).validate();
    }

    getVersion() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Uint32(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getCellDeps() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new CellDepVec(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getHeaderDeps() {
      const start = 12;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Byte32Vec(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getInputs() {
      const start = 16;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new CellInputVec(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getOutputs() {
      const start = 20;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new CellOutputVec(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getOutputsData() {
      const start = 24;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new BytesVec(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeRawTransaction(value) {
    const buffers = [];
    buffers.push(SerializeUint32(value.version));
    buffers.push(SerializeCellDepVec(value.cell_deps));
    buffers.push(SerializeByte32Vec(value.header_deps));
    buffers.push(SerializeCellInputVec(value.inputs));
    buffers.push(SerializeCellOutputVec(value.outputs));
    buffers.push(SerializeBytesVec(value.outputs_data));
    return serializeTable(buffers);
  }

  class Transaction {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new RawTransaction(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new BytesVec(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
    }

    getRaw() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new RawTransaction(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getWitnesses() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new BytesVec(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeTransaction(value) {
    const buffers = [];
    buffers.push(SerializeRawTransaction(value.raw));
    buffers.push(SerializeBytesVec(value.witnesses));
    return serializeTable(buffers);
  }

  class RawHeader {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    getVersion() {
      return new Uint32(this.view.buffer.slice(0, 0 + Uint32.size()), { validate: false });
    }

    getCompactTarget() {
      return new Uint32(this.view.buffer.slice(0 + Uint32.size(), 0 + Uint32.size() + Uint32.size()), { validate: false });
    }

    getTimestamp() {
      return new Uint64(this.view.buffer.slice(0 + Uint32.size() + Uint32.size(), 0 + Uint32.size() + Uint32.size() + Uint64.size()), { validate: false });
    }

    getNumber() {
      return new Uint64(this.view.buffer.slice(0 + Uint32.size() + Uint32.size() + Uint64.size(), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size()), { validate: false });
    }

    getEpoch() {
      return new Uint64(this.view.buffer.slice(0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size(), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size()), { validate: false });
    }

    getParentHash() {
      return new Byte32(this.view.buffer.slice(0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size(), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size()), { validate: false });
    }

    getTransactionsRoot() {
      return new Byte32(this.view.buffer.slice(0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size(), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size()), { validate: false });
    }

    getProposalsHash() {
      return new Byte32(this.view.buffer.slice(0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size(), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size() + Byte32.size()), { validate: false });
    }

    getUnclesHash() {
      return new Byte32(this.view.buffer.slice(0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size() + Byte32.size(), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size() + Byte32.size() + Byte32.size()), { validate: false });
    }

    getDao() {
      return new Byte32(this.view.buffer.slice(0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size() + Byte32.size() + Byte32.size(), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size() + Byte32.size() + Byte32.size() + Byte32.size()), { validate: false });
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, RawHeader.size());
      this.getVersion().validate(compatible);
      this.getCompactTarget().validate(compatible);
      this.getTimestamp().validate(compatible);
      this.getNumber().validate(compatible);
      this.getEpoch().validate(compatible);
      this.getParentHash().validate(compatible);
      this.getTransactionsRoot().validate(compatible);
      this.getProposalsHash().validate(compatible);
      this.getUnclesHash().validate(compatible);
      this.getDao().validate(compatible);
    }
    static size() {
      return 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size() + Byte32.size() + Byte32.size() + Byte32.size();
    }
  }

  function SerializeRawHeader(value) {
    const array = new Uint8Array(0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size() + Byte32.size() + Byte32.size() + Byte32.size());
    array.set(new Uint8Array(SerializeUint32(value.version)), 0);
    array.set(new Uint8Array(SerializeUint32(value.compact_target)), 0 + Uint32.size());
    array.set(new Uint8Array(SerializeUint64(value.timestamp)), 0 + Uint32.size() + Uint32.size());
    array.set(new Uint8Array(SerializeUint64(value.number)), 0 + Uint32.size() + Uint32.size() + Uint64.size());
    array.set(new Uint8Array(SerializeUint64(value.epoch)), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size());
    array.set(new Uint8Array(SerializeByte32(value.parent_hash)), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size());
    array.set(new Uint8Array(SerializeByte32(value.transactions_root)), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size());
    array.set(new Uint8Array(SerializeByte32(value.proposals_hash)), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size());
    array.set(new Uint8Array(SerializeByte32(value.extra_hash)), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size() + Byte32.size());
    array.set(new Uint8Array(SerializeByte32(value.dao)), 0 + Uint32.size() + Uint32.size() + Uint64.size() + Uint64.size() + Uint64.size() + Byte32.size() + Byte32.size() + Byte32.size() + Byte32.size());
    return array.buffer;
  }

  class Header {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    getRaw() {
      return new RawHeader(this.view.buffer.slice(0, 0 + RawHeader.size()), { validate: false });
    }

    getNonce() {
      return new Uint128(this.view.buffer.slice(0 + RawHeader.size(), 0 + RawHeader.size() + Uint128.size()), { validate: false });
    }

    validate(compatible = false) {
      assertDataLength(this.view.byteLength, Header.size());
      this.getRaw().validate(compatible);
      this.getNonce().validate(compatible);
    }
    static size() {
      return 0 + RawHeader.size() + Uint128.size();
    }
  }

  function SerializeHeader(value) {
    const array = new Uint8Array(0 + RawHeader.size() + Uint128.size());
    array.set(new Uint8Array(SerializeRawHeader(value.raw)), 0);
    array.set(new Uint8Array(SerializeUint128(value.nonce)), 0 + RawHeader.size());
    return array.buffer;
  }

  class UncleBlock {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new Header(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new ProposalShortIdVec(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
    }

    getHeader() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Header(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getProposals() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new ProposalShortIdVec(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeUncleBlock(value) {
    const buffers = [];
    buffers.push(SerializeHeader(value.header));
    buffers.push(SerializeProposalShortIdVec(value.proposals));
    return serializeTable(buffers);
  }

  class Block {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new Header(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new UncleBlockVec(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
      new TransactionVec(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
      new ProposalShortIdVec(this.view.buffer.slice(offsets[3], offsets[4]), { validate: false }).validate();
    }

    getHeader() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Header(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getUncles() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new UncleBlockVec(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getTransactions() {
      const start = 12;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new TransactionVec(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getProposals() {
      const start = 16;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new ProposalShortIdVec(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeBlock(value) {
    const buffers = [];
    buffers.push(SerializeHeader(value.header));
    buffers.push(SerializeUncleBlockVec(value.uncles));
    buffers.push(SerializeTransactionVec(value.transactions));
    buffers.push(SerializeProposalShortIdVec(value.proposals));
    return serializeTable(buffers);
  }

  class CellbaseWitness {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new Script(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new Bytes(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
    }

    getLock() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new Script(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getMessage() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new Bytes(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeCellbaseWitness(value) {
    const buffers = [];
    buffers.push(SerializeScript(value.lock));
    buffers.push(SerializeBytes(value.message));
    return serializeTable(buffers);
  }

  class WitnessArgs {
    constructor(reader, { validate = true } = {}) {
      this.view = new DataView(assertArrayBuffer(reader));
      if (validate) {
        this.validate();
      }
    }

    validate(compatible = false) {
      const offsets = verifyAndExtractOffsets(this.view, 0, true);
      new BytesOpt(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
      new BytesOpt(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
      new BytesOpt(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
    }

    getLock() {
      const start = 4;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new BytesOpt(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getInputType() {
      const start = 8;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.getUint32(start + 4, true);
      return new BytesOpt(this.view.buffer.slice(offset, offset_end), { validate: false });
    }

    getOutputType() {
      const start = 12;
      const offset = this.view.getUint32(start, true);
      const offset_end = this.view.byteLength;
      return new BytesOpt(this.view.buffer.slice(offset, offset_end), { validate: false });
    }
  }

  function SerializeWitnessArgs(value) {
    const buffers = [];
    buffers.push(SerializeBytesOpt(value.lock));
    buffers.push(SerializeBytesOpt(value.input_type));
    buffers.push(SerializeBytesOpt(value.output_type));
    return serializeTable(buffers);
  }

  exports.Block = Block;
  exports.Byte32 = Byte32;
  exports.Byte32Vec = Byte32Vec;
  exports.Bytes = Bytes;
  exports.BytesOpt = BytesOpt;
  exports.BytesVec = BytesVec;
  exports.CellDep = CellDep;
  exports.CellDepVec = CellDepVec;
  exports.CellInput = CellInput;
  exports.CellInputVec = CellInputVec;
  exports.CellOutput = CellOutput;
  exports.CellOutputVec = CellOutputVec;
  exports.CellbaseWitness = CellbaseWitness;
  exports.Header = Header;
  exports.OutPoint = OutPoint;
  exports.ProposalShortId = ProposalShortId;
  exports.ProposalShortIdVec = ProposalShortIdVec;
  exports.RawHeader = RawHeader;
  exports.RawTransaction = RawTransaction;
  exports.Script = Script;
  exports.ScriptOpt = ScriptOpt;
  exports.SerializeBlock = SerializeBlock;
  exports.SerializeByte32 = SerializeByte32;
  exports.SerializeByte32Vec = SerializeByte32Vec;
  exports.SerializeBytes = SerializeBytes;
  exports.SerializeBytesOpt = SerializeBytesOpt;
  exports.SerializeBytesVec = SerializeBytesVec;
  exports.SerializeCellDep = SerializeCellDep;
  exports.SerializeCellDepVec = SerializeCellDepVec;
  exports.SerializeCellInput = SerializeCellInput;
  exports.SerializeCellInputVec = SerializeCellInputVec;
  exports.SerializeCellOutput = SerializeCellOutput;
  exports.SerializeCellOutputVec = SerializeCellOutputVec;
  exports.SerializeCellbaseWitness = SerializeCellbaseWitness;
  exports.SerializeHeader = SerializeHeader;
  exports.SerializeOutPoint = SerializeOutPoint;
  exports.SerializeProposalShortId = SerializeProposalShortId;
  exports.SerializeProposalShortIdVec = SerializeProposalShortIdVec;
  exports.SerializeRawHeader = SerializeRawHeader;
  exports.SerializeRawTransaction = SerializeRawTransaction;
  exports.SerializeScript = SerializeScript;
  exports.SerializeScriptOpt = SerializeScriptOpt;
  exports.SerializeTransaction = SerializeTransaction;
  exports.SerializeTransactionVec = SerializeTransactionVec;
  exports.SerializeUint128 = SerializeUint128;
  exports.SerializeUint256 = SerializeUint256;
  exports.SerializeUint32 = SerializeUint32;
  exports.SerializeUint64 = SerializeUint64;
  exports.SerializeUncleBlock = SerializeUncleBlock;
  exports.SerializeUncleBlockVec = SerializeUncleBlockVec;
  exports.SerializeWitnessArgs = SerializeWitnessArgs;
  exports.Transaction = Transaction;
  exports.TransactionVec = TransactionVec;
  exports.Uint128 = Uint128;
  exports.Uint256 = Uint256;
  exports.Uint32 = Uint32;
  exports.Uint64 = Uint64;
  exports.UncleBlock = UncleBlock;
  exports.UncleBlockVec = UncleBlockVec;
  exports.WitnessArgs = WitnessArgs;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
