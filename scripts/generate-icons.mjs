// Gera ícones PNG simples (fundo marrom + círculo creme) para o manifest do
// PWA, sem depender de libs externas de imagem. O cliente pode substituir
// esses arquivos por uma logo definitiva depois.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const BROWN = [124, 79, 42]; // #7C4F2A — cor primária
const CREAM = [250, 244, 233]; // #FAF4E9

let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makeIcon(size, { maskable = false } = {}) {
  const raw = Buffer.alloc(size * (1 + size * 3));
  const cx = size / 2;
  const cy = size / 2;
  const r = maskable ? size * 0.32 : size * 0.36;
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 3);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const inCircle = dx * dx + dy * dy <= r * r;
      const [r_, g_, b_] = inCircle ? CREAM : BROWN;
      const px = rowStart + 1 + x * 3;
      raw[px] = r_;
      raw[px + 1] = g_;
      raw[px + 2] = b_;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("web/public/icons", { recursive: true });
writeFileSync("web/public/icons/icon-192.png", makeIcon(192));
writeFileSync("web/public/icons/icon-512.png", makeIcon(512));
writeFileSync("web/public/icons/maskable-512.png", makeIcon(512, { maskable: true }));
writeFileSync("web/public/icons/apple-touch-icon.png", makeIcon(180));
console.log("Ícones gerados em web/public/icons/");
