import assert from 'node:assert/strict';
import test from 'node:test';
import { readBoxHeader, scanLeadingBoxes, patchChunkOffsets } from '../src/index';

function box(type: string, payload: Uint8Array): Uint8Array {
  const size = 8 + payload.byteLength;
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  view.setUint32(0, size);
  out.set(new TextEncoder().encode(type), 4);
  out.set(payload, 8);
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

function u32(value: number): Uint8Array {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value);
  return out;
}

// stco: version/flags (4) + entry count (4) + N x 4-byte absolute offsets
function stco(offsets: number[]): Uint8Array {
  return box('stco', concat([u32(0), u32(offsets.length), ...offsets.map(u32)]));
}

function u64(value: number): Uint8Array {
  const out = new Uint8Array(8);
  const view = new DataView(out.buffer);
  view.setUint32(0, Math.floor(value / 2 ** 32));
  view.setUint32(4, value % 2 ** 32);
  return out;
}

// co64: version/flags (4) + entry count (4) + N x 8-byte absolute offsets
function co64(offsets: number[]): Uint8Array {
  return box('co64', concat([u32(0), u32(offsets.length), ...offsets.map(u64)]));
}

// Recursively finds every stco entry inside `buffer` (a standalone moov box, or
// any subtree of one), mirroring the real container-descent rules the production
// patchChunkOffsets walker uses, rather than assuming a fixed nesting depth.
function findStcoOffsets(buffer: Uint8Array): number[] {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const containerTypes = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);
  const results: number[] = [];

  function walk(start: number, end: number): void {
    let offset = start;
    while (offset + 8 <= end) {
      const header = readBoxHeader(view, offset)!;
      const contentStart = offset + header.headerSize;
      const contentEnd = offset + header.boxSize;
      if (header.type === 'stco') {
        const count = view.getUint32(contentStart + 4);
        for (let index = 0; index < count; index += 1) results.push(view.getUint32(contentStart + 8 + index * 4));
      } else if (containerTypes.has(header.type)) {
        walk(contentStart, contentEnd);
      }
      offset += header.boxSize;
    }
  }

  walk(0, buffer.byteLength);
  return results;
}

test('scanLeadingBoxes finds a trailing mdat and reports its declared size/offset', () => {
  const ftyp = box('ftyp', new Uint8Array(8));
  const free = box('free', new Uint8Array(0));
  const mdatPayload = new Uint8Array(100).fill(7);
  const mdat = box('mdat', mdatPayload);
  const file = concat([ftyp, free, mdat]);

  const layout = scanLeadingBoxes(file);
  assert.ok(layout);
  assert.equal(layout!.alreadyFastStart, false);
  assert.equal(layout!.mdatStart, ftyp.byteLength + free.byteLength);
  assert.equal(layout!.mdatDeclaredSize, mdat.byteLength);
});

test('scanLeadingBoxes reports alreadyFastStart when moov precedes mdat', () => {
  const ftyp = box('ftyp', new Uint8Array(8));
  const moov = box('moov', new Uint8Array(4));
  const file = concat([ftyp, moov]);

  const layout = scanLeadingBoxes(file);
  assert.ok(layout);
  assert.equal(layout!.alreadyFastStart, true);
});

test('scanLeadingBoxes returns null when neither mdat nor moov is found in the scanned head', () => {
  const ftyp = box('ftyp', new Uint8Array(8));
  const free = box('free', new Uint8Array(4));
  const layout = scanLeadingBoxes(concat([ftyp, free]));
  assert.equal(layout, null);
});

test('patchChunkOffsets shifts every stco entry, at any nesting depth, by delta', () => {
  const stbl = box('stbl', stco([1000, 2000, 3000]));
  const minf = box('minf', stbl);
  const mdia = box('mdia', minf);
  const trak = box('trak', mdia);
  const moov = box('moov', trak);

  const delta = 500_000;
  const ok = patchChunkOffsets(moov, delta);
  assert.equal(ok, true);
  assert.deepEqual(findStcoOffsets(moov), [1000 + delta, 2000 + delta, 3000 + delta]);
});

test('patchChunkOffsets refuses to overflow a 32-bit stco entry and signals failure', () => {
  const stbl = box('stbl', stco([0xfffffff0]));
  const moov = box('moov', box('trak', box('mdia', box('minf', stbl))));
  const ok = patchChunkOffsets(moov, 1000);
  assert.equal(ok, false);
});

test('patchChunkOffsets handles co64 (64-bit) chunk-offset tables', () => {
  const bigOffset = 5_000_000_000; // exceeds uint32 range, requires co64 in a real file
  const stbl = box('stbl', co64([bigOffset]));
  const moov = box('moov', box('trak', box('mdia', box('minf', stbl))));
  const delta = 830_824;
  const ok = patchChunkOffsets(moov, delta);
  assert.equal(ok, true);

  const view = new DataView(moov.buffer, moov.byteOffset, moov.byteLength);
  // moov(8) trak(8) mdia(8) minf(8) stbl(8) co64 header(8) version/count(8) -> first entry
  const entryOffset = 8 + 8 + 8 + 8 + 8 + 8 + 8;
  const high = view.getUint32(entryOffset);
  const low = view.getUint32(entryOffset + 4);
  assert.equal(high * 2 ** 32 + low, bigOffset + delta);
});

test('end-to-end: relocating moov before mdat preserves total size and keeps chunk offsets pointing at the same bytes', () => {
  const ftyp = box('ftyp', new Uint8Array(8).fill(1));
  const free = box('free', new Uint8Array(4).fill(2));
  const mdatPayload = new Uint8Array(10_000);
  for (let index = 0; index < mdatPayload.length; index += 1) mdatPayload[index] = index % 256;
  const mdat = box('mdat', mdatPayload);

  const originalMdatStart = ftyp.byteLength + free.byteLength;
  // Chunk offsets, in the ORIGINAL layout, pointing at a few sample bytes inside mdat's payload.
  const sampleIndexesIntoPayload = [0, 1234, 9999];
  const originalOffsets = sampleIndexesIntoPayload.map(index => originalMdatStart + 8 + index);
  const stbl = box('stbl', stco(originalOffsets));
  const moov = box('moov', box('trak', box('mdia', box('minf', stbl))));

  const originalFile = concat([ftyp, free, mdat, moov]);
  const fileSize = originalFile.byteLength;

  // --- Replicates buildFaststartPrefix's algorithm using only the exported pure helpers ---
  const layout = scanLeadingBoxes(originalFile)!;
  assert.equal(layout.alreadyFastStart, false);
  const moovStart = layout.mdatStart + layout.mdatDeclaredSize;
  const moovSize = fileSize - moovStart;
  assert.equal(moovStart, originalFile.byteLength - moov.byteLength);

  const moovBytes = originalFile.slice(moovStart, fileSize);
  const patched = patchChunkOffsets(moovBytes, moovSize);
  assert.equal(patched, true);

  const prefixBytes = concat([originalFile.subarray(0, layout.mdatStart), moovBytes]);
  const newFile = concat([prefixBytes, originalFile.subarray(layout.mdatStart, moovStart)]);

  // Total size must be exactly conserved (pure relocation, no re-encoding).
  assert.equal(newFile.byteLength, fileSize);

  // New layout must be parseable as ftyp -> free -> moov -> mdat.
  const newLayout = scanLeadingBoxes(newFile)!;
  assert.equal(newLayout.alreadyFastStart, true);

  // Every patched chunk offset must now point at the exact same underlying byte
  // values as the corresponding original offset did in the old layout.
  const relocatedMoov = newFile.subarray(originalMdatStart, originalMdatStart + moovSize);
  const patchedOffsets = findStcoOffsets(relocatedMoov);
  assert.equal(patchedOffsets.length, originalOffsets.length);
  for (let i = 0; i < originalOffsets.length; i += 1) {
    assert.equal(patchedOffsets[i], originalOffsets[i] + moovSize);
    assert.equal(newFile[patchedOffsets[i]], originalFile[originalOffsets[i]]);
  }
});
