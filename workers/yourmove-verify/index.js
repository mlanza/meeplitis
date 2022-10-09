const base64abc = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "+",
  "/"
];
function encode(data) {
  const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
  let result = "", i2;
  const l2 = uint8.length;
  for(i2 = 2; i2 < l2; i2 += 3){
      result += base64abc[uint8[i2 - 2] >> 2];
      result += base64abc[(uint8[i2 - 2] & 0x03) << 4 | uint8[i2 - 1] >> 4];
      result += base64abc[(uint8[i2 - 1] & 0x0f) << 2 | uint8[i2] >> 6];
      result += base64abc[uint8[i2] & 0x3f];
  }
  if (i2 === l2 + 1) {
      result += base64abc[uint8[i2 - 2] >> 2];
      result += base64abc[(uint8[i2 - 2] & 0x03) << 4];
      result += "==";
  }
  if (i2 === l2) {
      result += base64abc[uint8[i2 - 2] >> 2];
      result += base64abc[(uint8[i2 - 2] & 0x03) << 4 | uint8[i2 - 1] >> 4];
      result += base64abc[(uint8[i2 - 1] & 0x0f) << 2];
      result += "=";
  }
  return result;
}
function decode(b64) {
  const binString = atob(b64);
  const size = binString.length;
  const bytes = new Uint8Array(size);
  for(let i3 = 0; i3 < size; i3++){
      bytes[i3] = binString.charCodeAt(i3);
  }
  return bytes;
}
function addPaddingToBase64url(base64url) {
  if (base64url.length % 4 === 2) return base64url + "==";
  if (base64url.length % 4 === 3) return base64url + "=";
  if (base64url.length % 4 === 1) {
      throw new TypeError("Illegal base64url string!");
  }
  return base64url;
}
function convertBase64urlToBase64(b64url) {
  return addPaddingToBase64url(b64url).replace(/\-/g, "+").replace(/_/g, "/");
}
function convertBase64ToBase64url(b64) {
  return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function encode1(uint8) {
  return convertBase64ToBase64url(encode(uint8));
}
function decode1(b64url) {
  return decode(convertBase64urlToBase64(b64url));
}
const mod = {
  addPaddingToBase64url: addPaddingToBase64url,
  encode: encode1,
  decode: decode1
};
const hexTable = new TextEncoder().encode("0123456789abcdef");
function errInvalidByte(__byte) {
  return new Error("encoding/hex: invalid byte: " + new TextDecoder().decode(new Uint8Array([
      __byte
  ])));
}
function errLength() {
  return new Error("encoding/hex: odd length hex string");
}
function fromHexChar(__byte) {
  if (48 <= __byte && __byte <= 57) return __byte - 48;
  if (97 <= __byte && __byte <= 102) return __byte - 97 + 10;
  if (65 <= __byte && __byte <= 70) return __byte - 65 + 10;
  throw errInvalidByte(__byte);
}
function encodedLen(n) {
  return n * 2;
}
function encode2(src) {
  const dst = new Uint8Array(encodedLen(src.length));
  for(let i4 = 0; i4 < dst.length; i4++){
      const v = src[i4];
      dst[i4 * 2] = hexTable[v >> 4];
      dst[i4 * 2 + 1] = hexTable[v & 0x0f];
  }
  return dst;
}
function encodeToString(src) {
  return new TextDecoder().decode(encode2(src));
}
function decode2(src) {
  const dst = new Uint8Array(decodedLen(src.length));
  for(let i5 = 0; i5 < dst.length; i5++){
      const a = fromHexChar(src[i5 * 2]);
      const b = fromHexChar(src[i5 * 2 + 1]);
      dst[i5] = a << 4 | b;
  }
  if (src.length % 2 == 1) {
      fromHexChar(src[dst.length * 2]);
      throw errLength();
  }
  return dst;
}
function decodedLen(x) {
  return x >>> 1;
}
function decodeString(s) {
  return decode2(new TextEncoder().encode(s));
}
const HEX_CHARS = "0123456789abcdef".split("");
const EXTRA = [
  -2147483648,
  8388608,
  32768,
  128
];
const SHIFT = [
  24,
  16,
  8,
  0
];
const K = [
  0x428a2f98,
  0x71374491,
  0xb5c0fbcf,
  0xe9b5dba5,
  0x3956c25b,
  0x59f111f1,
  0x923f82a4,
  0xab1c5ed5,
  0xd807aa98,
  0x12835b01,
  0x243185be,
  0x550c7dc3,
  0x72be5d74,
  0x80deb1fe,
  0x9bdc06a7,
  0xc19bf174,
  0xe49b69c1,
  0xefbe4786,
  0x0fc19dc6,
  0x240ca1cc,
  0x2de92c6f,
  0x4a7484aa,
  0x5cb0a9dc,
  0x76f988da,
  0x983e5152,
  0xa831c66d,
  0xb00327c8,
  0xbf597fc7,
  0xc6e00bf3,
  0xd5a79147,
  0x06ca6351,
  0x14292967,
  0x27b70a85,
  0x2e1b2138,
  0x4d2c6dfc,
  0x53380d13,
  0x650a7354,
  0x766a0abb,
  0x81c2c92e,
  0x92722c85,
  0xa2bfe8a1,
  0xa81a664b,
  0xc24b8b70,
  0xc76c51a3,
  0xd192e819,
  0xd6990624,
  0xf40e3585,
  0x106aa070,
  0x19a4c116,
  0x1e376c08,
  0x2748774c,
  0x34b0bcb5,
  0x391c0cb3,
  0x4ed8aa4a,
  0x5b9cca4f,
  0x682e6ff3,
  0x748f82ee,
  0x78a5636f,
  0x84c87814,
  0x8cc70208,
  0x90befffa,
  0xa4506ceb,
  0xbef9a3f7,
  0xc67178f2,
];
const blocks = [];
class Sha256 {
  #block;
  #blocks;
  #bytes;
  #finalized;
  #first;
  #h0;
  #h1;
  #h2;
  #h3;
  #h4;
  #h5;
  #h6;
  #h7;
  #hashed;
  #hBytes;
  #is224;
  #lastByteIndex = 0;
  #start;
  constructor(is224 = false, sharedMemory = false){
      this.init(is224, sharedMemory);
  }
  init(is224, sharedMemory) {
      if (sharedMemory) {
          blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
          this.#blocks = blocks;
      } else {
          this.#blocks = [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
          ];
      }
      if (is224) {
          this.#h0 = 0xc1059ed8;
          this.#h1 = 0x367cd507;
          this.#h2 = 0x3070dd17;
          this.#h3 = 0xf70e5939;
          this.#h4 = 0xffc00b31;
          this.#h5 = 0x68581511;
          this.#h6 = 0x64f98fa7;
          this.#h7 = 0xbefa4fa4;
      } else {
          this.#h0 = 0x6a09e667;
          this.#h1 = 0xbb67ae85;
          this.#h2 = 0x3c6ef372;
          this.#h3 = 0xa54ff53a;
          this.#h4 = 0x510e527f;
          this.#h5 = 0x9b05688c;
          this.#h6 = 0x1f83d9ab;
          this.#h7 = 0x5be0cd19;
      }
      this.#block = this.#start = this.#bytes = this.#hBytes = 0;
      this.#finalized = this.#hashed = false;
      this.#first = true;
      this.#is224 = is224;
  }
  update(message) {
      if (this.#finalized) {
          return this;
      }
      let msg;
      if (message instanceof ArrayBuffer) {
          msg = new Uint8Array(message);
      } else {
          msg = message;
      }
      let index = 0;
      const length = msg.length;
      const blocks1 = this.#blocks;
      while(index < length){
          let i6;
          if (this.#hashed) {
              this.#hashed = false;
              blocks1[0] = this.#block;
              blocks1[16] = blocks1[1] = blocks1[2] = blocks1[3] = blocks1[4] = blocks1[5] = blocks1[6] = blocks1[7] = blocks1[8] = blocks1[9] = blocks1[10] = blocks1[11] = blocks1[12] = blocks1[13] = blocks1[14] = blocks1[15] = 0;
          }
          if (typeof msg !== "string") {
              for(i6 = this.#start; index < length && i6 < 64; ++index){
                  blocks1[i6 >> 2] |= msg[index] << SHIFT[(i6++) & 3];
              }
          } else {
              for(i6 = this.#start; index < length && i6 < 64; ++index){
                  let code2 = msg.charCodeAt(index);
                  if (code2 < 0x80) {
                      blocks1[i6 >> 2] |= code2 << SHIFT[(i6++) & 3];
                  } else if (code2 < 0x800) {
                      blocks1[i6 >> 2] |= (0xc0 | code2 >> 6) << SHIFT[(i6++) & 3];
                      blocks1[i6 >> 2] |= (0x80 | code2 & 0x3f) << SHIFT[(i6++) & 3];
                  } else if (code2 < 0xd800 || code2 >= 0xe000) {
                      blocks1[i6 >> 2] |= (0xe0 | code2 >> 12) << SHIFT[(i6++) & 3];
                      blocks1[i6 >> 2] |= (0x80 | code2 >> 6 & 0x3f) << SHIFT[(i6++) & 3];
                      blocks1[i6 >> 2] |= (0x80 | code2 & 0x3f) << SHIFT[(i6++) & 3];
                  } else {
                      code2 = 0x10000 + ((code2 & 0x3ff) << 10 | msg.charCodeAt(++index) & 0x3ff);
                      blocks1[i6 >> 2] |= (0xf0 | code2 >> 18) << SHIFT[(i6++) & 3];
                      blocks1[i6 >> 2] |= (0x80 | code2 >> 12 & 0x3f) << SHIFT[(i6++) & 3];
                      blocks1[i6 >> 2] |= (0x80 | code2 >> 6 & 0x3f) << SHIFT[(i6++) & 3];
                      blocks1[i6 >> 2] |= (0x80 | code2 & 0x3f) << SHIFT[(i6++) & 3];
                  }
              }
          }
          this.#lastByteIndex = i6;
          this.#bytes += i6 - this.#start;
          if (i6 >= 64) {
              this.#block = blocks1[16];
              this.#start = i6 - 64;
              this.hash();
              this.#hashed = true;
          } else {
              this.#start = i6;
          }
      }
      if (this.#bytes > 4294967295) {
          this.#hBytes += this.#bytes / 4294967296 << 0;
          this.#bytes = this.#bytes % 4294967296;
      }
      return this;
  }
  finalize() {
      if (this.#finalized) {
          return;
      }
      this.#finalized = true;
      const blocks2 = this.#blocks;
      const i7 = this.#lastByteIndex;
      blocks2[16] = this.#block;
      blocks2[i7 >> 2] |= EXTRA[i7 & 3];
      this.#block = blocks2[16];
      if (i7 >= 56) {
          if (!this.#hashed) {
              this.hash();
          }
          blocks2[0] = this.#block;
          blocks2[16] = blocks2[1] = blocks2[2] = blocks2[3] = blocks2[4] = blocks2[5] = blocks2[6] = blocks2[7] = blocks2[8] = blocks2[9] = blocks2[10] = blocks2[11] = blocks2[12] = blocks2[13] = blocks2[14] = blocks2[15] = 0;
      }
      blocks2[14] = this.#hBytes << 3 | this.#bytes >>> 29;
      blocks2[15] = this.#bytes << 3;
      this.hash();
  }
  hash() {
      let a = this.#h0;
      let b = this.#h1;
      let c = this.#h2;
      let d = this.#h3;
      let e = this.#h4;
      let f = this.#h5;
      let g = this.#h6;
      let h = this.#h7;
      const blocks3 = this.#blocks;
      let s0;
      let s1;
      let maj;
      let t1;
      let t2;
      let ch;
      let ab;
      let da;
      let cd;
      let bc;
      for(let j = 16; j < 64; ++j){
          t1 = blocks3[j - 15];
          s0 = (t1 >>> 7 | t1 << 25) ^ (t1 >>> 18 | t1 << 14) ^ t1 >>> 3;
          t1 = blocks3[j - 2];
          s1 = (t1 >>> 17 | t1 << 15) ^ (t1 >>> 19 | t1 << 13) ^ t1 >>> 10;
          blocks3[j] = blocks3[j - 16] + s0 + blocks3[j - 7] + s1 << 0;
      }
      bc = b & c;
      for(let j1 = 0; j1 < 64; j1 += 4){
          if (this.#first) {
              if (this.#is224) {
                  ab = 300032;
                  t1 = blocks3[0] - 1413257819;
                  h = t1 - 150054599 << 0;
                  d = t1 + 24177077 << 0;
              } else {
                  ab = 704751109;
                  t1 = blocks3[0] - 210244248;
                  h = t1 - 1521486534 << 0;
                  d = t1 + 143694565 << 0;
              }
              this.#first = false;
          } else {
              s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
              s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
              ab = a & b;
              maj = ab ^ a & c ^ bc;
              ch = e & f ^ ~e & g;
              t1 = h + s1 + ch + K[j1] + blocks3[j1];
              t2 = s0 + maj;
              h = d + t1 << 0;
              d = t1 + t2 << 0;
          }
          s0 = (d >>> 2 | d << 30) ^ (d >>> 13 | d << 19) ^ (d >>> 22 | d << 10);
          s1 = (h >>> 6 | h << 26) ^ (h >>> 11 | h << 21) ^ (h >>> 25 | h << 7);
          da = d & a;
          maj = da ^ d & b ^ ab;
          ch = h & e ^ ~h & f;
          t1 = g + s1 + ch + K[j1 + 1] + blocks3[j1 + 1];
          t2 = s0 + maj;
          g = c + t1 << 0;
          c = t1 + t2 << 0;
          s0 = (c >>> 2 | c << 30) ^ (c >>> 13 | c << 19) ^ (c >>> 22 | c << 10);
          s1 = (g >>> 6 | g << 26) ^ (g >>> 11 | g << 21) ^ (g >>> 25 | g << 7);
          cd = c & d;
          maj = cd ^ c & a ^ da;
          ch = g & h ^ ~g & e;
          t1 = f + s1 + ch + K[j1 + 2] + blocks3[j1 + 2];
          t2 = s0 + maj;
          f = b + t1 << 0;
          b = t1 + t2 << 0;
          s0 = (b >>> 2 | b << 30) ^ (b >>> 13 | b << 19) ^ (b >>> 22 | b << 10);
          s1 = (f >>> 6 | f << 26) ^ (f >>> 11 | f << 21) ^ (f >>> 25 | f << 7);
          bc = b & c;
          maj = bc ^ b & d ^ cd;
          ch = f & g ^ ~f & h;
          t1 = e + s1 + ch + K[j1 + 3] + blocks3[j1 + 3];
          t2 = s0 + maj;
          e = a + t1 << 0;
          a = t1 + t2 << 0;
      }
      this.#h0 = this.#h0 + a << 0;
      this.#h1 = this.#h1 + b << 0;
      this.#h2 = this.#h2 + c << 0;
      this.#h3 = this.#h3 + d << 0;
      this.#h4 = this.#h4 + e << 0;
      this.#h5 = this.#h5 + f << 0;
      this.#h6 = this.#h6 + g << 0;
      this.#h7 = this.#h7 + h << 0;
  }
  hex() {
      this.finalize();
      const h0 = this.#h0;
      const h1 = this.#h1;
      const h2 = this.#h2;
      const h3 = this.#h3;
      const h4 = this.#h4;
      const h5 = this.#h5;
      const h6 = this.#h6;
      const h7 = this.#h7;
      let hex = HEX_CHARS[h0 >> 28 & 0x0f] + HEX_CHARS[h0 >> 24 & 0x0f] + HEX_CHARS[h0 >> 20 & 0x0f] + HEX_CHARS[h0 >> 16 & 0x0f] + HEX_CHARS[h0 >> 12 & 0x0f] + HEX_CHARS[h0 >> 8 & 0x0f] + HEX_CHARS[h0 >> 4 & 0x0f] + HEX_CHARS[h0 & 0x0f] + HEX_CHARS[h1 >> 28 & 0x0f] + HEX_CHARS[h1 >> 24 & 0x0f] + HEX_CHARS[h1 >> 20 & 0x0f] + HEX_CHARS[h1 >> 16 & 0x0f] + HEX_CHARS[h1 >> 12 & 0x0f] + HEX_CHARS[h1 >> 8 & 0x0f] + HEX_CHARS[h1 >> 4 & 0x0f] + HEX_CHARS[h1 & 0x0f] + HEX_CHARS[h2 >> 28 & 0x0f] + HEX_CHARS[h2 >> 24 & 0x0f] + HEX_CHARS[h2 >> 20 & 0x0f] + HEX_CHARS[h2 >> 16 & 0x0f] + HEX_CHARS[h2 >> 12 & 0x0f] + HEX_CHARS[h2 >> 8 & 0x0f] + HEX_CHARS[h2 >> 4 & 0x0f] + HEX_CHARS[h2 & 0x0f] + HEX_CHARS[h3 >> 28 & 0x0f] + HEX_CHARS[h3 >> 24 & 0x0f] + HEX_CHARS[h3 >> 20 & 0x0f] + HEX_CHARS[h3 >> 16 & 0x0f] + HEX_CHARS[h3 >> 12 & 0x0f] + HEX_CHARS[h3 >> 8 & 0x0f] + HEX_CHARS[h3 >> 4 & 0x0f] + HEX_CHARS[h3 & 0x0f] + HEX_CHARS[h4 >> 28 & 0x0f] + HEX_CHARS[h4 >> 24 & 0x0f] + HEX_CHARS[h4 >> 20 & 0x0f] + HEX_CHARS[h4 >> 16 & 0x0f] + HEX_CHARS[h4 >> 12 & 0x0f] + HEX_CHARS[h4 >> 8 & 0x0f] + HEX_CHARS[h4 >> 4 & 0x0f] + HEX_CHARS[h4 & 0x0f] + HEX_CHARS[h5 >> 28 & 0x0f] + HEX_CHARS[h5 >> 24 & 0x0f] + HEX_CHARS[h5 >> 20 & 0x0f] + HEX_CHARS[h5 >> 16 & 0x0f] + HEX_CHARS[h5 >> 12 & 0x0f] + HEX_CHARS[h5 >> 8 & 0x0f] + HEX_CHARS[h5 >> 4 & 0x0f] + HEX_CHARS[h5 & 0x0f] + HEX_CHARS[h6 >> 28 & 0x0f] + HEX_CHARS[h6 >> 24 & 0x0f] + HEX_CHARS[h6 >> 20 & 0x0f] + HEX_CHARS[h6 >> 16 & 0x0f] + HEX_CHARS[h6 >> 12 & 0x0f] + HEX_CHARS[h6 >> 8 & 0x0f] + HEX_CHARS[h6 >> 4 & 0x0f] + HEX_CHARS[h6 & 0x0f];
      if (!this.#is224) {
          hex += HEX_CHARS[h7 >> 28 & 0x0f] + HEX_CHARS[h7 >> 24 & 0x0f] + HEX_CHARS[h7 >> 20 & 0x0f] + HEX_CHARS[h7 >> 16 & 0x0f] + HEX_CHARS[h7 >> 12 & 0x0f] + HEX_CHARS[h7 >> 8 & 0x0f] + HEX_CHARS[h7 >> 4 & 0x0f] + HEX_CHARS[h7 & 0x0f];
      }
      return hex;
  }
  toString() {
      return this.hex();
  }
  digest() {
      this.finalize();
      const h0 = this.#h0;
      const h1 = this.#h1;
      const h2 = this.#h2;
      const h3 = this.#h3;
      const h4 = this.#h4;
      const h5 = this.#h5;
      const h6 = this.#h6;
      const h7 = this.#h7;
      const arr = [
          h0 >> 24 & 0xff,
          h0 >> 16 & 0xff,
          h0 >> 8 & 0xff,
          h0 & 0xff,
          h1 >> 24 & 0xff,
          h1 >> 16 & 0xff,
          h1 >> 8 & 0xff,
          h1 & 0xff,
          h2 >> 24 & 0xff,
          h2 >> 16 & 0xff,
          h2 >> 8 & 0xff,
          h2 & 0xff,
          h3 >> 24 & 0xff,
          h3 >> 16 & 0xff,
          h3 >> 8 & 0xff,
          h3 & 0xff,
          h4 >> 24 & 0xff,
          h4 >> 16 & 0xff,
          h4 >> 8 & 0xff,
          h4 & 0xff,
          h5 >> 24 & 0xff,
          h5 >> 16 & 0xff,
          h5 >> 8 & 0xff,
          h5 & 0xff,
          h6 >> 24 & 0xff,
          h6 >> 16 & 0xff,
          h6 >> 8 & 0xff,
          h6 & 0xff,
      ];
      if (!this.#is224) {
          arr.push(h7 >> 24 & 0xff, h7 >> 16 & 0xff, h7 >> 8 & 0xff, h7 & 0xff);
      }
      return arr;
  }
  array() {
      return this.digest();
  }
  arrayBuffer() {
      this.finalize();
      const buffer = new ArrayBuffer(this.#is224 ? 28 : 32);
      const dataView = new DataView(buffer);
      dataView.setUint32(0, this.#h0);
      dataView.setUint32(4, this.#h1);
      dataView.setUint32(8, this.#h2);
      dataView.setUint32(12, this.#h3);
      dataView.setUint32(16, this.#h4);
      dataView.setUint32(20, this.#h5);
      dataView.setUint32(24, this.#h6);
      if (!this.#is224) {
          dataView.setUint32(28, this.#h7);
      }
      return buffer;
  }
}
class HmacSha256 extends Sha256 {
  #inner;
  #is224;
  #oKeyPad;
  #sharedMemory;
  constructor(secretKey, is224 = false, sharedMemory = false){
      super(is224, sharedMemory);
      let key;
      if (typeof secretKey === "string") {
          const bytes = [];
          const length = secretKey.length;
          let index = 0;
          for(let i8 = 0; i8 < length; ++i8){
              let code3 = secretKey.charCodeAt(i8);
              if (code3 < 0x80) {
                  bytes[index++] = code3;
              } else if (code3 < 0x800) {
                  bytes[index++] = 0xc0 | code3 >> 6;
                  bytes[index++] = 0x80 | code3 & 0x3f;
              } else if (code3 < 0xd800 || code3 >= 0xe000) {
                  bytes[index++] = 0xe0 | code3 >> 12;
                  bytes[index++] = 0x80 | code3 >> 6 & 0x3f;
                  bytes[index++] = 0x80 | code3 & 0x3f;
              } else {
                  code3 = 0x10000 + ((code3 & 0x3ff) << 10 | secretKey.charCodeAt(++i8) & 0x3ff);
                  bytes[index++] = 0xf0 | code3 >> 18;
                  bytes[index++] = 0x80 | code3 >> 12 & 0x3f;
                  bytes[index++] = 0x80 | code3 >> 6 & 0x3f;
                  bytes[index++] = 0x80 | code3 & 0x3f;
              }
          }
          key = bytes;
      } else {
          if (secretKey instanceof ArrayBuffer) {
              key = new Uint8Array(secretKey);
          } else {
              key = secretKey;
          }
      }
      if (key.length > 64) {
          key = new Sha256(is224, true).update(key).array();
      }
      const oKeyPad = [];
      const iKeyPad = [];
      for(let i9 = 0; i9 < 64; ++i9){
          const b = key[i9] || 0;
          oKeyPad[i9] = 0x5c ^ b;
          iKeyPad[i9] = 0x36 ^ b;
      }
      this.update(iKeyPad);
      this.#oKeyPad = oKeyPad;
      this.#inner = true;
      this.#is224 = is224;
      this.#sharedMemory = sharedMemory;
  }
  finalize() {
      super.finalize();
      if (this.#inner) {
          this.#inner = false;
          const innerHash = this.array();
          super.init(this.#is224, this.#sharedMemory);
          this.update(this.#oKeyPad);
          this.update(innerHash);
          super.finalize();
      }
  }
}
const HEX_CHARS1 = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f"
];
const EXTRA1 = [
  -2147483648,
  8388608,
  32768,
  128
];
const SHIFT1 = [
  24,
  16,
  8,
  0
];
const K1 = [
  0x428a2f98,
  0xd728ae22,
  0x71374491,
  0x23ef65cd,
  0xb5c0fbcf,
  0xec4d3b2f,
  0xe9b5dba5,
  0x8189dbbc,
  0x3956c25b,
  0xf348b538,
  0x59f111f1,
  0xb605d019,
  0x923f82a4,
  0xaf194f9b,
  0xab1c5ed5,
  0xda6d8118,
  0xd807aa98,
  0xa3030242,
  0x12835b01,
  0x45706fbe,
  0x243185be,
  0x4ee4b28c,
  0x550c7dc3,
  0xd5ffb4e2,
  0x72be5d74,
  0xf27b896f,
  0x80deb1fe,
  0x3b1696b1,
  0x9bdc06a7,
  0x25c71235,
  0xc19bf174,
  0xcf692694,
  0xe49b69c1,
  0x9ef14ad2,
  0xefbe4786,
  0x384f25e3,
  0x0fc19dc6,
  0x8b8cd5b5,
  0x240ca1cc,
  0x77ac9c65,
  0x2de92c6f,
  0x592b0275,
  0x4a7484aa,
  0x6ea6e483,
  0x5cb0a9dc,
  0xbd41fbd4,
  0x76f988da,
  0x831153b5,
  0x983e5152,
  0xee66dfab,
  0xa831c66d,
  0x2db43210,
  0xb00327c8,
  0x98fb213f,
  0xbf597fc7,
  0xbeef0ee4,
  0xc6e00bf3,
  0x3da88fc2,
  0xd5a79147,
  0x930aa725,
  0x06ca6351,
  0xe003826f,
  0x14292967,
  0x0a0e6e70,
  0x27b70a85,
  0x46d22ffc,
  0x2e1b2138,
  0x5c26c926,
  0x4d2c6dfc,
  0x5ac42aed,
  0x53380d13,
  0x9d95b3df,
  0x650a7354,
  0x8baf63de,
  0x766a0abb,
  0x3c77b2a8,
  0x81c2c92e,
  0x47edaee6,
  0x92722c85,
  0x1482353b,
  0xa2bfe8a1,
  0x4cf10364,
  0xa81a664b,
  0xbc423001,
  0xc24b8b70,
  0xd0f89791,
  0xc76c51a3,
  0x0654be30,
  0xd192e819,
  0xd6ef5218,
  0xd6990624,
  0x5565a910,
  0xf40e3585,
  0x5771202a,
  0x106aa070,
  0x32bbd1b8,
  0x19a4c116,
  0xb8d2d0c8,
  0x1e376c08,
  0x5141ab53,
  0x2748774c,
  0xdf8eeb99,
  0x34b0bcb5,
  0xe19b48a8,
  0x391c0cb3,
  0xc5c95a63,
  0x4ed8aa4a,
  0xe3418acb,
  0x5b9cca4f,
  0x7763e373,
  0x682e6ff3,
  0xd6b2b8a3,
  0x748f82ee,
  0x5defb2fc,
  0x78a5636f,
  0x43172f60,
  0x84c87814,
  0xa1f0ab72,
  0x8cc70208,
  0x1a6439ec,
  0x90befffa,
  0x23631e28,
  0xa4506ceb,
  0xde82bde9,
  0xbef9a3f7,
  0xb2c67915,
  0xc67178f2,
  0xe372532b,
  0xca273ece,
  0xea26619c,
  0xd186b8c7,
  0x21c0c207,
  0xeada7dd6,
  0xcde0eb1e,
  0xf57d4f7f,
  0xee6ed178,
  0x06f067aa,
  0x72176fba,
  0x0a637dc5,
  0xa2c898a6,
  0x113f9804,
  0xbef90dae,
  0x1b710b35,
  0x131c471b,
  0x28db77f5,
  0x23047d84,
  0x32caab7b,
  0x40c72493,
  0x3c9ebe0a,
  0x15c9bebc,
  0x431d67c4,
  0x9c100d4c,
  0x4cc5d4be,
  0xcb3e42b6,
  0x597f299c,
  0xfc657e2a,
  0x5fcb6fab,
  0x3ad6faec,
  0x6c44198c,
  0x4a475817
];
const blocks1 = [];
class Sha512 {
  #blocks;
  #block;
  #bits;
  #start;
  #bytes;
  #hBytes;
  #lastByteIndex = 0;
  #finalized;
  #hashed;
  #h0h;
  #h0l;
  #h1h;
  #h1l;
  #h2h;
  #h2l;
  #h3h;
  #h3l;
  #h4h;
  #h4l;
  #h5h;
  #h5l;
  #h6h;
  #h6l;
  #h7h;
  #h7l;
  constructor(bits = 512, sharedMemory = false){
      this.init(bits, sharedMemory);
  }
  init(bits, sharedMemory) {
      if (sharedMemory) {
          blocks1[0] = blocks1[1] = blocks1[2] = blocks1[3] = blocks1[4] = blocks1[5] = blocks1[6] = blocks1[7] = blocks1[8] = blocks1[9] = blocks1[10] = blocks1[11] = blocks1[12] = blocks1[13] = blocks1[14] = blocks1[15] = blocks1[16] = blocks1[17] = blocks1[18] = blocks1[19] = blocks1[20] = blocks1[21] = blocks1[22] = blocks1[23] = blocks1[24] = blocks1[25] = blocks1[26] = blocks1[27] = blocks1[28] = blocks1[29] = blocks1[30] = blocks1[31] = blocks1[32] = 0;
          this.#blocks = blocks1;
      } else {
          this.#blocks = [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
          ];
      }
      if (bits === 224) {
          this.#h0h = 0x8c3d37c8;
          this.#h0l = 0x19544da2;
          this.#h1h = 0x73e19966;
          this.#h1l = 0x89dcd4d6;
          this.#h2h = 0x1dfab7ae;
          this.#h2l = 0x32ff9c82;
          this.#h3h = 0x679dd514;
          this.#h3l = 0x582f9fcf;
          this.#h4h = 0x0f6d2b69;
          this.#h4l = 0x7bd44da8;
          this.#h5h = 0x77e36f73;
          this.#h5l = 0x04c48942;
          this.#h6h = 0x3f9d85a8;
          this.#h6l = 0x6a1d36c8;
          this.#h7h = 0x1112e6ad;
          this.#h7l = 0x91d692a1;
      } else if (bits === 256) {
          this.#h0h = 0x22312194;
          this.#h0l = 0xfc2bf72c;
          this.#h1h = 0x9f555fa3;
          this.#h1l = 0xc84c64c2;
          this.#h2h = 0x2393b86b;
          this.#h2l = 0x6f53b151;
          this.#h3h = 0x96387719;
          this.#h3l = 0x5940eabd;
          this.#h4h = 0x96283ee2;
          this.#h4l = 0xa88effe3;
          this.#h5h = 0xbe5e1e25;
          this.#h5l = 0x53863992;
          this.#h6h = 0x2b0199fc;
          this.#h6l = 0x2c85b8aa;
          this.#h7h = 0x0eb72ddc;
          this.#h7l = 0x81c52ca2;
      } else if (bits === 384) {
          this.#h0h = 0xcbbb9d5d;
          this.#h0l = 0xc1059ed8;
          this.#h1h = 0x629a292a;
          this.#h1l = 0x367cd507;
          this.#h2h = 0x9159015a;
          this.#h2l = 0x3070dd17;
          this.#h3h = 0x152fecd8;
          this.#h3l = 0xf70e5939;
          this.#h4h = 0x67332667;
          this.#h4l = 0xffc00b31;
          this.#h5h = 0x8eb44a87;
          this.#h5l = 0x68581511;
          this.#h6h = 0xdb0c2e0d;
          this.#h6l = 0x64f98fa7;
          this.#h7h = 0x47b5481d;
          this.#h7l = 0xbefa4fa4;
      } else {
          this.#h0h = 0x6a09e667;
          this.#h0l = 0xf3bcc908;
          this.#h1h = 0xbb67ae85;
          this.#h1l = 0x84caa73b;
          this.#h2h = 0x3c6ef372;
          this.#h2l = 0xfe94f82b;
          this.#h3h = 0xa54ff53a;
          this.#h3l = 0x5f1d36f1;
          this.#h4h = 0x510e527f;
          this.#h4l = 0xade682d1;
          this.#h5h = 0x9b05688c;
          this.#h5l = 0x2b3e6c1f;
          this.#h6h = 0x1f83d9ab;
          this.#h6l = 0xfb41bd6b;
          this.#h7h = 0x5be0cd19;
          this.#h7l = 0x137e2179;
      }
      this.#bits = bits;
      this.#block = this.#start = this.#bytes = this.#hBytes = 0;
      this.#finalized = this.#hashed = false;
  }
  update(message) {
      if (this.#finalized) {
          return this;
      }
      let msg;
      if (message instanceof ArrayBuffer) {
          msg = new Uint8Array(message);
      } else {
          msg = message;
      }
      const length = msg.length;
      const blocks11 = this.#blocks;
      let index = 0;
      while(index < length){
          let i10;
          if (this.#hashed) {
              this.#hashed = false;
              blocks11[0] = this.#block;
              blocks11[1] = blocks11[2] = blocks11[3] = blocks11[4] = blocks11[5] = blocks11[6] = blocks11[7] = blocks11[8] = blocks11[9] = blocks11[10] = blocks11[11] = blocks11[12] = blocks11[13] = blocks11[14] = blocks11[15] = blocks11[16] = blocks11[17] = blocks11[18] = blocks11[19] = blocks11[20] = blocks11[21] = blocks11[22] = blocks11[23] = blocks11[24] = blocks11[25] = blocks11[26] = blocks11[27] = blocks11[28] = blocks11[29] = blocks11[30] = blocks11[31] = blocks11[32] = 0;
          }
          if (typeof msg !== "string") {
              for(i10 = this.#start; index < length && i10 < 128; ++index){
                  blocks11[i10 >> 2] |= msg[index] << SHIFT1[(i10++) & 3];
              }
          } else {
              for(i10 = this.#start; index < length && i10 < 128; ++index){
                  let code4 = msg.charCodeAt(index);
                  if (code4 < 0x80) {
                      blocks11[i10 >> 2] |= code4 << SHIFT1[(i10++) & 3];
                  } else if (code4 < 0x800) {
                      blocks11[i10 >> 2] |= (0xc0 | code4 >> 6) << SHIFT1[(i10++) & 3];
                      blocks11[i10 >> 2] |= (0x80 | code4 & 0x3f) << SHIFT1[(i10++) & 3];
                  } else if (code4 < 0xd800 || code4 >= 0xe000) {
                      blocks11[i10 >> 2] |= (0xe0 | code4 >> 12) << SHIFT1[(i10++) & 3];
                      blocks11[i10 >> 2] |= (0x80 | code4 >> 6 & 0x3f) << SHIFT1[(i10++) & 3];
                      blocks11[i10 >> 2] |= (0x80 | code4 & 0x3f) << SHIFT1[(i10++) & 3];
                  } else {
                      code4 = 0x10000 + ((code4 & 0x3ff) << 10 | msg.charCodeAt(++index) & 0x3ff);
                      blocks11[i10 >> 2] |= (0xf0 | code4 >> 18) << SHIFT1[(i10++) & 3];
                      blocks11[i10 >> 2] |= (0x80 | code4 >> 12 & 0x3f) << SHIFT1[(i10++) & 3];
                      blocks11[i10 >> 2] |= (0x80 | code4 >> 6 & 0x3f) << SHIFT1[(i10++) & 3];
                      blocks11[i10 >> 2] |= (0x80 | code4 & 0x3f) << SHIFT1[(i10++) & 3];
                  }
              }
          }
          this.#lastByteIndex = i10;
          this.#bytes += i10 - this.#start;
          if (i10 >= 128) {
              this.#block = blocks11[32];
              this.#start = i10 - 128;
              this.hash();
              this.#hashed = true;
          } else {
              this.#start = i10;
          }
      }
      if (this.#bytes > 4294967295) {
          this.#hBytes += this.#bytes / 4294967296 << 0;
          this.#bytes = this.#bytes % 4294967296;
      }
      return this;
  }
  finalize() {
      if (this.#finalized) {
          return;
      }
      this.#finalized = true;
      const blocks2 = this.#blocks;
      const i11 = this.#lastByteIndex;
      blocks2[32] = this.#block;
      blocks2[i11 >> 2] |= EXTRA1[i11 & 3];
      this.#block = blocks2[32];
      if (i11 >= 112) {
          if (!this.#hashed) {
              this.hash();
          }
          blocks2[0] = this.#block;
          blocks2[1] = blocks2[2] = blocks2[3] = blocks2[4] = blocks2[5] = blocks2[6] = blocks2[7] = blocks2[8] = blocks2[9] = blocks2[10] = blocks2[11] = blocks2[12] = blocks2[13] = blocks2[14] = blocks2[15] = blocks2[16] = blocks2[17] = blocks2[18] = blocks2[19] = blocks2[20] = blocks2[21] = blocks2[22] = blocks2[23] = blocks2[24] = blocks2[25] = blocks2[26] = blocks2[27] = blocks2[28] = blocks2[29] = blocks2[30] = blocks2[31] = blocks2[32] = 0;
      }
      blocks2[30] = this.#hBytes << 3 | this.#bytes >>> 29;
      blocks2[31] = this.#bytes << 3;
      this.hash();
  }
  hash() {
      const h0h = this.#h0h, h0l = this.#h0l, h1h = this.#h1h, h1l = this.#h1l, h2h = this.#h2h, h2l = this.#h2l, h3h = this.#h3h, h3l = this.#h3l, h4h = this.#h4h, h4l = this.#h4l, h5h = this.#h5h, h5l = this.#h5l, h6h = this.#h6h, h6l = this.#h6l, h7h = this.#h7h, h7l = this.#h7l;
      let s0h, s0l, s1h, s1l, c1, c2, c3, c4, abh, abl, dah, dal, cdh, cdl, bch, bcl, majh, majl, t1h, t1l, t2h, t2l, chh, chl;
      const blocks3 = this.#blocks;
      for(let j = 32; j < 160; j += 2){
          t1h = blocks3[j - 30];
          t1l = blocks3[j - 29];
          s0h = (t1h >>> 1 | t1l << 31) ^ (t1h >>> 8 | t1l << 24) ^ t1h >>> 7;
          s0l = (t1l >>> 1 | t1h << 31) ^ (t1l >>> 8 | t1h << 24) ^ (t1l >>> 7 | t1h << 25);
          t1h = blocks3[j - 4];
          t1l = blocks3[j - 3];
          s1h = (t1h >>> 19 | t1l << 13) ^ (t1l >>> 29 | t1h << 3) ^ t1h >>> 6;
          s1l = (t1l >>> 19 | t1h << 13) ^ (t1h >>> 29 | t1l << 3) ^ (t1l >>> 6 | t1h << 26);
          t1h = blocks3[j - 32];
          t1l = blocks3[j - 31];
          t2h = blocks3[j - 14];
          t2l = blocks3[j - 13];
          c1 = (t2l & 0xffff) + (t1l & 0xffff) + (s0l & 0xffff) + (s1l & 0xffff);
          c2 = (t2l >>> 16) + (t1l >>> 16) + (s0l >>> 16) + (s1l >>> 16) + (c1 >>> 16);
          c3 = (t2h & 0xffff) + (t1h & 0xffff) + (s0h & 0xffff) + (s1h & 0xffff) + (c2 >>> 16);
          c4 = (t2h >>> 16) + (t1h >>> 16) + (s0h >>> 16) + (s1h >>> 16) + (c3 >>> 16);
          blocks3[j] = c4 << 16 | c3 & 0xffff;
          blocks3[j + 1] = c2 << 16 | c1 & 0xffff;
      }
      let ah = h0h, al = h0l, bh = h1h, bl = h1l, ch = h2h, cl = h2l, dh = h3h, dl = h3l, eh = h4h, el = h4l, fh = h5h, fl = h5l, gh = h6h, gl = h6l, hh = h7h, hl = h7l;
      bch = bh & ch;
      bcl = bl & cl;
      for(let j1 = 0; j1 < 160; j1 += 8){
          s0h = (ah >>> 28 | al << 4) ^ (al >>> 2 | ah << 30) ^ (al >>> 7 | ah << 25);
          s0l = (al >>> 28 | ah << 4) ^ (ah >>> 2 | al << 30) ^ (ah >>> 7 | al << 25);
          s1h = (eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (el >>> 9 | eh << 23);
          s1l = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (eh >>> 9 | el << 23);
          abh = ah & bh;
          abl = al & bl;
          majh = abh ^ ah & ch ^ bch;
          majl = abl ^ al & cl ^ bcl;
          chh = eh & fh ^ ~eh & gh;
          chl = el & fl ^ ~el & gl;
          t1h = blocks3[j1];
          t1l = blocks3[j1 + 1];
          t2h = K1[j1];
          t2l = K1[j1 + 1];
          c1 = (t2l & 0xffff) + (t1l & 0xffff) + (chl & 0xffff) + (s1l & 0xffff) + (hl & 0xffff);
          c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (hl >>> 16) + (c1 >>> 16);
          c3 = (t2h & 0xffff) + (t1h & 0xffff) + (chh & 0xffff) + (s1h & 0xffff) + (hh & 0xffff) + (c2 >>> 16);
          c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (hh >>> 16) + (c3 >>> 16);
          t1h = c4 << 16 | c3 & 0xffff;
          t1l = c2 << 16 | c1 & 0xffff;
          c1 = (majl & 0xffff) + (s0l & 0xffff);
          c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
          c3 = (majh & 0xffff) + (s0h & 0xffff) + (c2 >>> 16);
          c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
          t2h = c4 << 16 | c3 & 0xffff;
          t2l = c2 << 16 | c1 & 0xffff;
          c1 = (dl & 0xffff) + (t1l & 0xffff);
          c2 = (dl >>> 16) + (t1l >>> 16) + (c1 >>> 16);
          c3 = (dh & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
          c4 = (dh >>> 16) + (t1h >>> 16) + (c3 >>> 16);
          hh = c4 << 16 | c3 & 0xffff;
          hl = c2 << 16 | c1 & 0xffff;
          c1 = (t2l & 0xffff) + (t1l & 0xffff);
          c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
          c3 = (t2h & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
          c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
          dh = c4 << 16 | c3 & 0xffff;
          dl = c2 << 16 | c1 & 0xffff;
          s0h = (dh >>> 28 | dl << 4) ^ (dl >>> 2 | dh << 30) ^ (dl >>> 7 | dh << 25);
          s0l = (dl >>> 28 | dh << 4) ^ (dh >>> 2 | dl << 30) ^ (dh >>> 7 | dl << 25);
          s1h = (hh >>> 14 | hl << 18) ^ (hh >>> 18 | hl << 14) ^ (hl >>> 9 | hh << 23);
          s1l = (hl >>> 14 | hh << 18) ^ (hl >>> 18 | hh << 14) ^ (hh >>> 9 | hl << 23);
          dah = dh & ah;
          dal = dl & al;
          majh = dah ^ dh & bh ^ abh;
          majl = dal ^ dl & bl ^ abl;
          chh = hh & eh ^ ~hh & fh;
          chl = hl & el ^ ~hl & fl;
          t1h = blocks3[j1 + 2];
          t1l = blocks3[j1 + 3];
          t2h = K1[j1 + 2];
          t2l = K1[j1 + 3];
          c1 = (t2l & 0xffff) + (t1l & 0xffff) + (chl & 0xffff) + (s1l & 0xffff) + (gl & 0xffff);
          c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (gl >>> 16) + (c1 >>> 16);
          c3 = (t2h & 0xffff) + (t1h & 0xffff) + (chh & 0xffff) + (s1h & 0xffff) + (gh & 0xffff) + (c2 >>> 16);
          c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (gh >>> 16) + (c3 >>> 16);
          t1h = c4 << 16 | c3 & 0xffff;
          t1l = c2 << 16 | c1 & 0xffff;
          c1 = (majl & 0xffff) + (s0l & 0xffff);
          c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
          c3 = (majh & 0xffff) + (s0h & 0xffff) + (c2 >>> 16);
          c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
          t2h = c4 << 16 | c3 & 0xffff;
          t2l = c2 << 16 | c1 & 0xffff;
          c1 = (cl & 0xffff) + (t1l & 0xffff);
          c2 = (cl >>> 16) + (t1l >>> 16) + (c1 >>> 16);
          c3 = (ch & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
          c4 = (ch >>> 16) + (t1h >>> 16) + (c3 >>> 16);
          gh = c4 << 16 | c3 & 0xffff;
          gl = c2 << 16 | c1 & 0xffff;
          c1 = (t2l & 0xffff) + (t1l & 0xffff);
          c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
          c3 = (t2h & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
          c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
          ch = c4 << 16 | c3 & 0xffff;
          cl = c2 << 16 | c1 & 0xffff;
          s0h = (ch >>> 28 | cl << 4) ^ (cl >>> 2 | ch << 30) ^ (cl >>> 7 | ch << 25);
          s0l = (cl >>> 28 | ch << 4) ^ (ch >>> 2 | cl << 30) ^ (ch >>> 7 | cl << 25);
          s1h = (gh >>> 14 | gl << 18) ^ (gh >>> 18 | gl << 14) ^ (gl >>> 9 | gh << 23);
          s1l = (gl >>> 14 | gh << 18) ^ (gl >>> 18 | gh << 14) ^ (gh >>> 9 | gl << 23);
          cdh = ch & dh;
          cdl = cl & dl;
          majh = cdh ^ ch & ah ^ dah;
          majl = cdl ^ cl & al ^ dal;
          chh = gh & hh ^ ~gh & eh;
          chl = gl & hl ^ ~gl & el;
          t1h = blocks3[j1 + 4];
          t1l = blocks3[j1 + 5];
          t2h = K1[j1 + 4];
          t2l = K1[j1 + 5];
          c1 = (t2l & 0xffff) + (t1l & 0xffff) + (chl & 0xffff) + (s1l & 0xffff) + (fl & 0xffff);
          c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (fl >>> 16) + (c1 >>> 16);
          c3 = (t2h & 0xffff) + (t1h & 0xffff) + (chh & 0xffff) + (s1h & 0xffff) + (fh & 0xffff) + (c2 >>> 16);
          c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (fh >>> 16) + (c3 >>> 16);
          t1h = c4 << 16 | c3 & 0xffff;
          t1l = c2 << 16 | c1 & 0xffff;
          c1 = (majl & 0xffff) + (s0l & 0xffff);
          c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
          c3 = (majh & 0xffff) + (s0h & 0xffff) + (c2 >>> 16);
          c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
          t2h = c4 << 16 | c3 & 0xffff;
          t2l = c2 << 16 | c1 & 0xffff;
          c1 = (bl & 0xffff) + (t1l & 0xffff);
          c2 = (bl >>> 16) + (t1l >>> 16) + (c1 >>> 16);
          c3 = (bh & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
          c4 = (bh >>> 16) + (t1h >>> 16) + (c3 >>> 16);
          fh = c4 << 16 | c3 & 0xffff;
          fl = c2 << 16 | c1 & 0xffff;
          c1 = (t2l & 0xffff) + (t1l & 0xffff);
          c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
          c3 = (t2h & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
          c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
          bh = c4 << 16 | c3 & 0xffff;
          bl = c2 << 16 | c1 & 0xffff;
          s0h = (bh >>> 28 | bl << 4) ^ (bl >>> 2 | bh << 30) ^ (bl >>> 7 | bh << 25);
          s0l = (bl >>> 28 | bh << 4) ^ (bh >>> 2 | bl << 30) ^ (bh >>> 7 | bl << 25);
          s1h = (fh >>> 14 | fl << 18) ^ (fh >>> 18 | fl << 14) ^ (fl >>> 9 | fh << 23);
          s1l = (fl >>> 14 | fh << 18) ^ (fl >>> 18 | fh << 14) ^ (fh >>> 9 | fl << 23);
          bch = bh & ch;
          bcl = bl & cl;
          majh = bch ^ bh & dh ^ cdh;
          majl = bcl ^ bl & dl ^ cdl;
          chh = fh & gh ^ ~fh & hh;
          chl = fl & gl ^ ~fl & hl;
          t1h = blocks3[j1 + 6];
          t1l = blocks3[j1 + 7];
          t2h = K1[j1 + 6];
          t2l = K1[j1 + 7];
          c1 = (t2l & 0xffff) + (t1l & 0xffff) + (chl & 0xffff) + (s1l & 0xffff) + (el & 0xffff);
          c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (el >>> 16) + (c1 >>> 16);
          c3 = (t2h & 0xffff) + (t1h & 0xffff) + (chh & 0xffff) + (s1h & 0xffff) + (eh & 0xffff) + (c2 >>> 16);
          c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (eh >>> 16) + (c3 >>> 16);
          t1h = c4 << 16 | c3 & 0xffff;
          t1l = c2 << 16 | c1 & 0xffff;
          c1 = (majl & 0xffff) + (s0l & 0xffff);
          c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
          c3 = (majh & 0xffff) + (s0h & 0xffff) + (c2 >>> 16);
          c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
          t2h = c4 << 16 | c3 & 0xffff;
          t2l = c2 << 16 | c1 & 0xffff;
          c1 = (al & 0xffff) + (t1l & 0xffff);
          c2 = (al >>> 16) + (t1l >>> 16) + (c1 >>> 16);
          c3 = (ah & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
          c4 = (ah >>> 16) + (t1h >>> 16) + (c3 >>> 16);
          eh = c4 << 16 | c3 & 0xffff;
          el = c2 << 16 | c1 & 0xffff;
          c1 = (t2l & 0xffff) + (t1l & 0xffff);
          c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
          c3 = (t2h & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
          c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
          ah = c4 << 16 | c3 & 0xffff;
          al = c2 << 16 | c1 & 0xffff;
      }
      c1 = (h0l & 0xffff) + (al & 0xffff);
      c2 = (h0l >>> 16) + (al >>> 16) + (c1 >>> 16);
      c3 = (h0h & 0xffff) + (ah & 0xffff) + (c2 >>> 16);
      c4 = (h0h >>> 16) + (ah >>> 16) + (c3 >>> 16);
      this.#h0h = c4 << 16 | c3 & 0xffff;
      this.#h0l = c2 << 16 | c1 & 0xffff;
      c1 = (h1l & 0xffff) + (bl & 0xffff);
      c2 = (h1l >>> 16) + (bl >>> 16) + (c1 >>> 16);
      c3 = (h1h & 0xffff) + (bh & 0xffff) + (c2 >>> 16);
      c4 = (h1h >>> 16) + (bh >>> 16) + (c3 >>> 16);
      this.#h1h = c4 << 16 | c3 & 0xffff;
      this.#h1l = c2 << 16 | c1 & 0xffff;
      c1 = (h2l & 0xffff) + (cl & 0xffff);
      c2 = (h2l >>> 16) + (cl >>> 16) + (c1 >>> 16);
      c3 = (h2h & 0xffff) + (ch & 0xffff) + (c2 >>> 16);
      c4 = (h2h >>> 16) + (ch >>> 16) + (c3 >>> 16);
      this.#h2h = c4 << 16 | c3 & 0xffff;
      this.#h2l = c2 << 16 | c1 & 0xffff;
      c1 = (h3l & 0xffff) + (dl & 0xffff);
      c2 = (h3l >>> 16) + (dl >>> 16) + (c1 >>> 16);
      c3 = (h3h & 0xffff) + (dh & 0xffff) + (c2 >>> 16);
      c4 = (h3h >>> 16) + (dh >>> 16) + (c3 >>> 16);
      this.#h3h = c4 << 16 | c3 & 0xffff;
      this.#h3l = c2 << 16 | c1 & 0xffff;
      c1 = (h4l & 0xffff) + (el & 0xffff);
      c2 = (h4l >>> 16) + (el >>> 16) + (c1 >>> 16);
      c3 = (h4h & 0xffff) + (eh & 0xffff) + (c2 >>> 16);
      c4 = (h4h >>> 16) + (eh >>> 16) + (c3 >>> 16);
      this.#h4h = c4 << 16 | c3 & 0xffff;
      this.#h4l = c2 << 16 | c1 & 0xffff;
      c1 = (h5l & 0xffff) + (fl & 0xffff);
      c2 = (h5l >>> 16) + (fl >>> 16) + (c1 >>> 16);
      c3 = (h5h & 0xffff) + (fh & 0xffff) + (c2 >>> 16);
      c4 = (h5h >>> 16) + (fh >>> 16) + (c3 >>> 16);
      this.#h5h = c4 << 16 | c3 & 0xffff;
      this.#h5l = c2 << 16 | c1 & 0xffff;
      c1 = (h6l & 0xffff) + (gl & 0xffff);
      c2 = (h6l >>> 16) + (gl >>> 16) + (c1 >>> 16);
      c3 = (h6h & 0xffff) + (gh & 0xffff) + (c2 >>> 16);
      c4 = (h6h >>> 16) + (gh >>> 16) + (c3 >>> 16);
      this.#h6h = c4 << 16 | c3 & 0xffff;
      this.#h6l = c2 << 16 | c1 & 0xffff;
      c1 = (h7l & 0xffff) + (hl & 0xffff);
      c2 = (h7l >>> 16) + (hl >>> 16) + (c1 >>> 16);
      c3 = (h7h & 0xffff) + (hh & 0xffff) + (c2 >>> 16);
      c4 = (h7h >>> 16) + (hh >>> 16) + (c3 >>> 16);
      this.#h7h = c4 << 16 | c3 & 0xffff;
      this.#h7l = c2 << 16 | c1 & 0xffff;
  }
  hex() {
      this.finalize();
      const h0h = this.#h0h, h0l = this.#h0l, h1h = this.#h1h, h1l = this.#h1l, h2h = this.#h2h, h2l = this.#h2l, h3h = this.#h3h, h3l = this.#h3l, h4h = this.#h4h, h4l = this.#h4l, h5h = this.#h5h, h5l = this.#h5l, h6h = this.#h6h, h6l = this.#h6l, h7h = this.#h7h, h7l = this.#h7l, bits = this.#bits;
      let hex = HEX_CHARS1[h0h >> 28 & 0x0f] + HEX_CHARS1[h0h >> 24 & 0x0f] + HEX_CHARS1[h0h >> 20 & 0x0f] + HEX_CHARS1[h0h >> 16 & 0x0f] + HEX_CHARS1[h0h >> 12 & 0x0f] + HEX_CHARS1[h0h >> 8 & 0x0f] + HEX_CHARS1[h0h >> 4 & 0x0f] + HEX_CHARS1[h0h & 0x0f] + HEX_CHARS1[h0l >> 28 & 0x0f] + HEX_CHARS1[h0l >> 24 & 0x0f] + HEX_CHARS1[h0l >> 20 & 0x0f] + HEX_CHARS1[h0l >> 16 & 0x0f] + HEX_CHARS1[h0l >> 12 & 0x0f] + HEX_CHARS1[h0l >> 8 & 0x0f] + HEX_CHARS1[h0l >> 4 & 0x0f] + HEX_CHARS1[h0l & 0x0f] + HEX_CHARS1[h1h >> 28 & 0x0f] + HEX_CHARS1[h1h >> 24 & 0x0f] + HEX_CHARS1[h1h >> 20 & 0x0f] + HEX_CHARS1[h1h >> 16 & 0x0f] + HEX_CHARS1[h1h >> 12 & 0x0f] + HEX_CHARS1[h1h >> 8 & 0x0f] + HEX_CHARS1[h1h >> 4 & 0x0f] + HEX_CHARS1[h1h & 0x0f] + HEX_CHARS1[h1l >> 28 & 0x0f] + HEX_CHARS1[h1l >> 24 & 0x0f] + HEX_CHARS1[h1l >> 20 & 0x0f] + HEX_CHARS1[h1l >> 16 & 0x0f] + HEX_CHARS1[h1l >> 12 & 0x0f] + HEX_CHARS1[h1l >> 8 & 0x0f] + HEX_CHARS1[h1l >> 4 & 0x0f] + HEX_CHARS1[h1l & 0x0f] + HEX_CHARS1[h2h >> 28 & 0x0f] + HEX_CHARS1[h2h >> 24 & 0x0f] + HEX_CHARS1[h2h >> 20 & 0x0f] + HEX_CHARS1[h2h >> 16 & 0x0f] + HEX_CHARS1[h2h >> 12 & 0x0f] + HEX_CHARS1[h2h >> 8 & 0x0f] + HEX_CHARS1[h2h >> 4 & 0x0f] + HEX_CHARS1[h2h & 0x0f] + HEX_CHARS1[h2l >> 28 & 0x0f] + HEX_CHARS1[h2l >> 24 & 0x0f] + HEX_CHARS1[h2l >> 20 & 0x0f] + HEX_CHARS1[h2l >> 16 & 0x0f] + HEX_CHARS1[h2l >> 12 & 0x0f] + HEX_CHARS1[h2l >> 8 & 0x0f] + HEX_CHARS1[h2l >> 4 & 0x0f] + HEX_CHARS1[h2l & 0x0f] + HEX_CHARS1[h3h >> 28 & 0x0f] + HEX_CHARS1[h3h >> 24 & 0x0f] + HEX_CHARS1[h3h >> 20 & 0x0f] + HEX_CHARS1[h3h >> 16 & 0x0f] + HEX_CHARS1[h3h >> 12 & 0x0f] + HEX_CHARS1[h3h >> 8 & 0x0f] + HEX_CHARS1[h3h >> 4 & 0x0f] + HEX_CHARS1[h3h & 0x0f];
      if (bits >= 256) {
          hex += HEX_CHARS1[h3l >> 28 & 0x0f] + HEX_CHARS1[h3l >> 24 & 0x0f] + HEX_CHARS1[h3l >> 20 & 0x0f] + HEX_CHARS1[h3l >> 16 & 0x0f] + HEX_CHARS1[h3l >> 12 & 0x0f] + HEX_CHARS1[h3l >> 8 & 0x0f] + HEX_CHARS1[h3l >> 4 & 0x0f] + HEX_CHARS1[h3l & 0x0f];
      }
      if (bits >= 384) {
          hex += HEX_CHARS1[h4h >> 28 & 0x0f] + HEX_CHARS1[h4h >> 24 & 0x0f] + HEX_CHARS1[h4h >> 20 & 0x0f] + HEX_CHARS1[h4h >> 16 & 0x0f] + HEX_CHARS1[h4h >> 12 & 0x0f] + HEX_CHARS1[h4h >> 8 & 0x0f] + HEX_CHARS1[h4h >> 4 & 0x0f] + HEX_CHARS1[h4h & 0x0f] + HEX_CHARS1[h4l >> 28 & 0x0f] + HEX_CHARS1[h4l >> 24 & 0x0f] + HEX_CHARS1[h4l >> 20 & 0x0f] + HEX_CHARS1[h4l >> 16 & 0x0f] + HEX_CHARS1[h4l >> 12 & 0x0f] + HEX_CHARS1[h4l >> 8 & 0x0f] + HEX_CHARS1[h4l >> 4 & 0x0f] + HEX_CHARS1[h4l & 0x0f] + HEX_CHARS1[h5h >> 28 & 0x0f] + HEX_CHARS1[h5h >> 24 & 0x0f] + HEX_CHARS1[h5h >> 20 & 0x0f] + HEX_CHARS1[h5h >> 16 & 0x0f] + HEX_CHARS1[h5h >> 12 & 0x0f] + HEX_CHARS1[h5h >> 8 & 0x0f] + HEX_CHARS1[h5h >> 4 & 0x0f] + HEX_CHARS1[h5h & 0x0f] + HEX_CHARS1[h5l >> 28 & 0x0f] + HEX_CHARS1[h5l >> 24 & 0x0f] + HEX_CHARS1[h5l >> 20 & 0x0f] + HEX_CHARS1[h5l >> 16 & 0x0f] + HEX_CHARS1[h5l >> 12 & 0x0f] + HEX_CHARS1[h5l >> 8 & 0x0f] + HEX_CHARS1[h5l >> 4 & 0x0f] + HEX_CHARS1[h5l & 0x0f];
      }
      if (bits === 512) {
          hex += HEX_CHARS1[h6h >> 28 & 0x0f] + HEX_CHARS1[h6h >> 24 & 0x0f] + HEX_CHARS1[h6h >> 20 & 0x0f] + HEX_CHARS1[h6h >> 16 & 0x0f] + HEX_CHARS1[h6h >> 12 & 0x0f] + HEX_CHARS1[h6h >> 8 & 0x0f] + HEX_CHARS1[h6h >> 4 & 0x0f] + HEX_CHARS1[h6h & 0x0f] + HEX_CHARS1[h6l >> 28 & 0x0f] + HEX_CHARS1[h6l >> 24 & 0x0f] + HEX_CHARS1[h6l >> 20 & 0x0f] + HEX_CHARS1[h6l >> 16 & 0x0f] + HEX_CHARS1[h6l >> 12 & 0x0f] + HEX_CHARS1[h6l >> 8 & 0x0f] + HEX_CHARS1[h6l >> 4 & 0x0f] + HEX_CHARS1[h6l & 0x0f] + HEX_CHARS1[h7h >> 28 & 0x0f] + HEX_CHARS1[h7h >> 24 & 0x0f] + HEX_CHARS1[h7h >> 20 & 0x0f] + HEX_CHARS1[h7h >> 16 & 0x0f] + HEX_CHARS1[h7h >> 12 & 0x0f] + HEX_CHARS1[h7h >> 8 & 0x0f] + HEX_CHARS1[h7h >> 4 & 0x0f] + HEX_CHARS1[h7h & 0x0f] + HEX_CHARS1[h7l >> 28 & 0x0f] + HEX_CHARS1[h7l >> 24 & 0x0f] + HEX_CHARS1[h7l >> 20 & 0x0f] + HEX_CHARS1[h7l >> 16 & 0x0f] + HEX_CHARS1[h7l >> 12 & 0x0f] + HEX_CHARS1[h7l >> 8 & 0x0f] + HEX_CHARS1[h7l >> 4 & 0x0f] + HEX_CHARS1[h7l & 0x0f];
      }
      return hex;
  }
  toString() {
      return this.hex();
  }
  digest() {
      this.finalize();
      const h0h = this.#h0h, h0l = this.#h0l, h1h = this.#h1h, h1l = this.#h1l, h2h = this.#h2h, h2l = this.#h2l, h3h = this.#h3h, h3l = this.#h3l, h4h = this.#h4h, h4l = this.#h4l, h5h = this.#h5h, h5l = this.#h5l, h6h = this.#h6h, h6l = this.#h6l, h7h = this.#h7h, h7l = this.#h7l, bits = this.#bits;
      const arr = [
          h0h >> 24 & 0xff,
          h0h >> 16 & 0xff,
          h0h >> 8 & 0xff,
          h0h & 0xff,
          h0l >> 24 & 0xff,
          h0l >> 16 & 0xff,
          h0l >> 8 & 0xff,
          h0l & 0xff,
          h1h >> 24 & 0xff,
          h1h >> 16 & 0xff,
          h1h >> 8 & 0xff,
          h1h & 0xff,
          h1l >> 24 & 0xff,
          h1l >> 16 & 0xff,
          h1l >> 8 & 0xff,
          h1l & 0xff,
          h2h >> 24 & 0xff,
          h2h >> 16 & 0xff,
          h2h >> 8 & 0xff,
          h2h & 0xff,
          h2l >> 24 & 0xff,
          h2l >> 16 & 0xff,
          h2l >> 8 & 0xff,
          h2l & 0xff,
          h3h >> 24 & 0xff,
          h3h >> 16 & 0xff,
          h3h >> 8 & 0xff,
          h3h & 0xff
      ];
      if (bits >= 256) {
          arr.push(h3l >> 24 & 0xff, h3l >> 16 & 0xff, h3l >> 8 & 0xff, h3l & 0xff);
      }
      if (bits >= 384) {
          arr.push(h4h >> 24 & 0xff, h4h >> 16 & 0xff, h4h >> 8 & 0xff, h4h & 0xff, h4l >> 24 & 0xff, h4l >> 16 & 0xff, h4l >> 8 & 0xff, h4l & 0xff, h5h >> 24 & 0xff, h5h >> 16 & 0xff, h5h >> 8 & 0xff, h5h & 0xff, h5l >> 24 & 0xff, h5l >> 16 & 0xff, h5l >> 8 & 0xff, h5l & 0xff);
      }
      if (bits === 512) {
          arr.push(h6h >> 24 & 0xff, h6h >> 16 & 0xff, h6h >> 8 & 0xff, h6h & 0xff, h6l >> 24 & 0xff, h6l >> 16 & 0xff, h6l >> 8 & 0xff, h6l & 0xff, h7h >> 24 & 0xff, h7h >> 16 & 0xff, h7h >> 8 & 0xff, h7h & 0xff, h7l >> 24 & 0xff, h7l >> 16 & 0xff, h7l >> 8 & 0xff, h7l & 0xff);
      }
      return arr;
  }
  array() {
      return this.digest();
  }
  arrayBuffer() {
      this.finalize();
      const bits = this.#bits;
      const buffer = new ArrayBuffer(bits / 8);
      const dataView = new DataView(buffer);
      dataView.setUint32(0, this.#h0h);
      dataView.setUint32(4, this.#h0l);
      dataView.setUint32(8, this.#h1h);
      dataView.setUint32(12, this.#h1l);
      dataView.setUint32(16, this.#h2h);
      dataView.setUint32(20, this.#h2l);
      dataView.setUint32(24, this.#h3h);
      if (bits >= 256) {
          dataView.setUint32(28, this.#h3l);
      }
      if (bits >= 384) {
          dataView.setUint32(32, this.#h4h);
          dataView.setUint32(36, this.#h4l);
          dataView.setUint32(40, this.#h5h);
          dataView.setUint32(44, this.#h5l);
      }
      if (bits === 512) {
          dataView.setUint32(48, this.#h6h);
          dataView.setUint32(52, this.#h6l);
          dataView.setUint32(56, this.#h7h);
          dataView.setUint32(60, this.#h7l);
      }
      return buffer;
  }
}
class HmacSha512 extends Sha512 {
  #inner;
  #bits;
  #oKeyPad;
  #sharedMemory;
  constructor(secretKey, bits = 512, sharedMemory = false){
      super(bits, sharedMemory);
      let key;
      if (secretKey instanceof ArrayBuffer) {
          key = new Uint8Array(secretKey);
      } else if (typeof secretKey === "string") {
          const bytes = [];
          const length = secretKey.length;
          let index = 0;
          let code5;
          for(let i12 = 0; i12 < length; ++i12){
              code5 = secretKey.charCodeAt(i12);
              if (code5 < 0x80) {
                  bytes[index++] = code5;
              } else if (code5 < 0x800) {
                  bytes[index++] = 0xc0 | code5 >> 6;
                  bytes[index++] = 0x80 | code5 & 0x3f;
              } else if (code5 < 0xd800 || code5 >= 0xe000) {
                  bytes[index++] = 0xe0 | code5 >> 12;
                  bytes[index++] = 0x80 | code5 >> 6 & 0x3f;
                  bytes[index++] = 0x80 | code5 & 0x3f;
              } else {
                  code5 = 0x10000 + ((code5 & 0x3ff) << 10 | secretKey.charCodeAt(++i12) & 0x3ff);
                  bytes[index++] = 0xf0 | code5 >> 18;
                  bytes[index++] = 0x80 | code5 >> 12 & 0x3f;
                  bytes[index++] = 0x80 | code5 >> 6 & 0x3f;
                  bytes[index++] = 0x80 | code5 & 0x3f;
              }
          }
          key = bytes;
      } else {
          key = secretKey;
      }
      if (key.length > 128) {
          key = new Sha512(bits, true).update(key).array();
      }
      const oKeyPad = [];
      const iKeyPad = [];
      for(let i13 = 0; i13 < 128; ++i13){
          const b = key[i13] || 0;
          oKeyPad[i13] = 0x5c ^ b;
          iKeyPad[i13] = 0x36 ^ b;
      }
      this.update(iKeyPad);
      this.#inner = true;
      this.#bits = bits;
      this.#oKeyPad = oKeyPad;
      this.#sharedMemory = sharedMemory;
  }
  finalize() {
      super.finalize();
      if (this.#inner) {
          this.#inner = false;
          const innerHash = this.array();
          super.init(this.#bits, this.#sharedMemory);
          this.update(this.#oKeyPad);
          this.update(innerHash);
          super.finalize();
      }
  }
}
function big_base64(m) {
  if (m === undefined) return undefined;
  const bytes = [];
  while(m > 0n){
      bytes.push(Number(m & 255n));
      m = m >> 8n;
  }
  bytes.reverse();
  let a = btoa(String.fromCharCode.apply(null, bytes)).replace(/=/g, "");
  a = a.replace(/\+/g, "-");
  a = a.replace(/\//g, "_");
  return a;
}
function getHashFunctionName(hash) {
  if (hash === "sha1") return "SHA-1";
  if (hash === "sha256") return "SHA-256";
  return "";
}
async function createWebCryptoKey(key, usage, options) {
  let jwk = {
      kty: "RSA",
      n: big_base64(key.n),
      ext: true
  };
  if (usage === "encrypt") {
      jwk = {
          ...jwk,
          e: big_base64(key.e)
      };
  } else if (usage === "decrypt") {
      jwk = {
          ...jwk,
          d: big_base64(key.d),
          e: big_base64(key.e),
          p: big_base64(key.p),
          q: big_base64(key.q),
          dp: big_base64(key.dp),
          dq: big_base64(key.dq),
          qi: big_base64(key.qi)
      };
  }
  return await crypto.subtle.importKey("jwk", jwk, {
      name: "RSA-OAEP",
      hash: {
          name: getHashFunctionName(options.hash)
      }
  }, false, [
      usage
  ]);
}
class WebCryptoRSA {
  key;
  options;
  encryptedKey = null;
  decryptedKey = null;
  constructor(key, options){
      this.key = key;
      this.options = options;
  }
  static isSupported(options) {
      if (!crypto.subtle) return false;
      if (options.padding !== "oaep") return false;
      return true;
  }
  static async encrypt(key, m, options) {
      return await crypto.subtle.encrypt({
          name: "RSA-OAEP"
      }, await createWebCryptoKey(key, "encrypt", options), m);
  }
  static async decrypt(key, m, options) {
      return await crypto.subtle.decrypt({
          name: "RSA-OAEP"
      }, await createWebCryptoKey(key, "decrypt", options), m);
  }
}
function power_mod(n, p, m) {
  if (p === 1n) return n;
  if (p % 2n === 0n) {
      const t = power_mod(n, p >> 1n, m);
      return t * t % m;
  } else {
      const t = power_mod(n, p >> 1n, m);
      return t * t * n % m;
  }
}
function getLengths(b64) {
  const len = b64.length;
  let validLen = b64.indexOf("=");
  if (validLen === -1) {
      validLen = len;
  }
  const placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
  return [
      validLen,
      placeHoldersLen
  ];
}
function init(lookup2, revLookup2, urlsafe = false) {
  function _byteLength(validLen, placeHoldersLen) {
      return Math.floor((validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen);
  }
  function tripletToBase64(num) {
      return lookup2[num >> 18 & 0x3f] + lookup2[num >> 12 & 0x3f] + lookup2[num >> 6 & 0x3f] + lookup2[num & 0x3f];
  }
  function encodeChunk(buf, start, end) {
      const out = new Array((end - start) / 3);
      for(let i14 = start, curTriplet = 0; i14 < end; i14 += 3){
          out[curTriplet++] = tripletToBase64((buf[i14] << 16) + (buf[i14 + 1] << 8) + buf[i14 + 2]);
      }
      return out.join("");
  }
  return {
      byteLength (b64) {
          return _byteLength.apply(null, getLengths(b64));
      },
      toUint8Array (b64) {
          const [validLen, placeHoldersLen] = getLengths(b64);
          const buf = new Uint8Array(_byteLength(validLen, placeHoldersLen));
          const len = placeHoldersLen ? validLen - 4 : validLen;
          let tmp;
          let curByte = 0;
          let i15;
          for(i15 = 0; i15 < len; i15 += 4){
              tmp = revLookup2[b64.charCodeAt(i15)] << 18 | revLookup2[b64.charCodeAt(i15 + 1)] << 12 | revLookup2[b64.charCodeAt(i15 + 2)] << 6 | revLookup2[b64.charCodeAt(i15 + 3)];
              buf[curByte++] = tmp >> 16 & 0xff;
              buf[curByte++] = tmp >> 8 & 0xff;
              buf[curByte++] = tmp & 0xff;
          }
          if (placeHoldersLen === 2) {
              tmp = revLookup2[b64.charCodeAt(i15)] << 2 | revLookup2[b64.charCodeAt(i15 + 1)] >> 4;
              buf[curByte++] = tmp & 0xff;
          } else if (placeHoldersLen === 1) {
              tmp = revLookup2[b64.charCodeAt(i15)] << 10 | revLookup2[b64.charCodeAt(i15 + 1)] << 4 | revLookup2[b64.charCodeAt(i15 + 2)] >> 2;
              buf[curByte++] = tmp >> 8 & 0xff;
              buf[curByte++] = tmp & 0xff;
          }
          return buf;
      },
      fromUint8Array (buf) {
          const maxChunkLength = 16383;
          const len = buf.length;
          const extraBytes = len % 3;
          const len2 = len - extraBytes;
          const parts = new Array(Math.ceil(len2 / 16383) + (extraBytes ? 1 : 0));
          let curChunk = 0;
          let chunkEnd;
          for(let i16 = 0; i16 < len2; i16 += maxChunkLength){
              chunkEnd = i16 + maxChunkLength;
              parts[curChunk++] = encodeChunk(buf, i16, chunkEnd > len2 ? len2 : chunkEnd);
          }
          let tmp;
          if (extraBytes === 1) {
              tmp = buf[len2];
              parts[curChunk] = lookup2[tmp >> 2] + lookup2[tmp << 4 & 0x3f];
              if (!urlsafe) parts[curChunk] += "==";
          } else if (extraBytes === 2) {
              tmp = buf[len2] << 8 | buf[len2 + 1] & 0xff;
              parts[curChunk] = lookup2[tmp >> 10] + lookup2[tmp >> 4 & 0x3f] + lookup2[tmp << 2 & 0x3f];
              if (!urlsafe) parts[curChunk] += "=";
          }
          return parts.join("");
      }
  };
}
const lookup = [];
const revLookup = [];
const code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
for(let i = 0, l = code.length; i < l; ++i){
  lookup[i] = code[i];
  revLookup[code.charCodeAt(i)] = i;
}
const { byteLength , toUint8Array , fromUint8Array  } = init(lookup, revLookup, true);
const decoder = new TextDecoder();
const encoder = new TextEncoder();
function toHexString(buf) {
  return buf.reduce((hex, __byte)=>`${hex}${__byte < 16 ? "0" : ""}${__byte.toString(16)}`
  , "");
}
function fromHexString(hex) {
  const len = hex.length;
  if (len % 2 || !/^[0-9a-fA-F]+$/.test(hex)) {
      throw new TypeError("Invalid hex string.");
  }
  hex = hex.toLowerCase();
  const buf = new Uint8Array(Math.floor(len / 2));
  const end = len / 2;
  for(let i17 = 0; i17 < end; ++i17){
      buf[i17] = parseInt(hex.substr(i17 * 2, 2), 16);
  }
  return buf;
}
function decode3(buf, encoding = "utf8") {
  if (/^utf-?8$/i.test(encoding)) {
      return decoder.decode(buf);
  } else if (/^base64$/i.test(encoding)) {
      return fromUint8Array(buf);
  } else if (/^hex(?:adecimal)?$/i.test(encoding)) {
      return toHexString(buf);
  } else {
      throw new TypeError("Unsupported string encoding.");
  }
}
function encode3(str, encoding = "utf8") {
  if (/^utf-?8$/i.test(encoding)) {
      return encoder.encode(str);
  } else if (/^base64$/i.test(encoding)) {
      return toUint8Array(str);
  } else if (/^hex(?:adecimal)?$/i.test(encoding)) {
      return fromHexString(str);
  } else {
      throw new TypeError("Unsupported string encoding.");
  }
}
function rotl(x, n) {
  return x << n | x >>> 32 - n;
}
class SHA1 {
  hashSize = 20;
  _buf = new Uint8Array(64);
  _bufIdx;
  _count;
  _K = new Uint32Array([
      0x5a827999,
      0x6ed9eba1,
      0x8f1bbcdc,
      0xca62c1d6
  ]);
  _H;
  _finalized;
  constructor(){
      this.init();
  }
  static F(t, b, c, d) {
      if (t <= 19) {
          return b & c | ~b & d;
      } else if (t <= 39) {
          return b ^ c ^ d;
      } else if (t <= 59) {
          return b & c | b & d | c & d;
      } else {
          return b ^ c ^ d;
      }
  }
  init() {
      this._H = new Uint32Array([
          0x67452301,
          0xEFCDAB89,
          0x98BADCFE,
          0x10325476,
          0xC3D2E1F0
      ]);
      this._bufIdx = 0;
      this._count = new Uint32Array(2);
      this._buf.fill(0);
      this._finalized = false;
      return this;
  }
  update(msg, inputEncoding) {
      if (msg === null) {
          throw new TypeError("msg must be a string or Uint8Array.");
      } else if (typeof msg === "string") {
          msg = encode3(msg, inputEncoding);
      }
      for(let i18 = 0; i18 < msg.length; i18++){
          this._buf[this._bufIdx++] = msg[i18];
          if (this._bufIdx === 64) {
              this.transform();
              this._bufIdx = 0;
          }
      }
      const c = this._count;
      if ((c[0] += msg.length << 3) < msg.length << 3) {
          c[1]++;
      }
      c[1] += msg.length >>> 29;
      return this;
  }
  digest(outputEncoding) {
      if (this._finalized) {
          throw new Error("digest has already been called.");
      }
      this._finalized = true;
      const b = this._buf;
      let idx = this._bufIdx;
      b[idx++] = 0x80;
      while(idx !== 56){
          if (idx === 64) {
              this.transform();
              idx = 0;
          }
          b[idx++] = 0;
      }
      const c = this._count;
      b[56] = c[1] >>> 24 & 0xff;
      b[57] = c[1] >>> 16 & 0xff;
      b[58] = c[1] >>> 8 & 0xff;
      b[59] = c[1] >>> 0 & 0xff;
      b[60] = c[0] >>> 24 & 0xff;
      b[61] = c[0] >>> 16 & 0xff;
      b[62] = c[0] >>> 8 & 0xff;
      b[63] = c[0] >>> 0 & 0xff;
      this.transform();
      const hash = new Uint8Array(20);
      for(let i19 = 0; i19 < 5; i19++){
          hash[(i19 << 2) + 0] = this._H[i19] >>> 24 & 0xff;
          hash[(i19 << 2) + 1] = this._H[i19] >>> 16 & 0xff;
          hash[(i19 << 2) + 2] = this._H[i19] >>> 8 & 0xff;
          hash[(i19 << 2) + 3] = this._H[i19] >>> 0 & 0xff;
      }
      this.init();
      return outputEncoding ? decode3(hash, outputEncoding) : hash;
  }
  transform() {
      const h = this._H;
      let a = h[0];
      let b = h[1];
      let c = h[2];
      let d = h[3];
      let e = h[4];
      const w = new Uint32Array(80);
      for(let i20 = 0; i20 < 16; i20++){
          w[i20] = this._buf[(i20 << 2) + 3] | this._buf[(i20 << 2) + 2] << 8 | this._buf[(i20 << 2) + 1] << 16 | this._buf[i20 << 2] << 24;
      }
      for(let t = 0; t < 80; t++){
          if (t >= 16) {
              w[t] = rotl(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
          }
          const tmp = rotl(a, 5) + SHA1.F(t, b, c, d) + e + w[t] + this._K[Math.floor(t / 20)] | 0;
          e = d;
          d = c;
          c = rotl(b, 30);
          b = a;
          a = tmp;
      }
      h[0] = h[0] + a | 0;
      h[1] = h[1] + b | 0;
      h[2] = h[2] + c | 0;
      h[3] = h[3] + d | 0;
      h[4] = h[4] + e | 0;
  }
}
function sha1(msg, inputEncoding, outputEncoding) {
  return new SHA1().update(msg, inputEncoding).digest(outputEncoding);
}
class SHA256 {
  hashSize = 32;
  _buf;
  _bufIdx;
  _count;
  _K;
  _H;
  _finalized;
  constructor(){
      this._buf = new Uint8Array(64);
      this._K = new Uint32Array([
          0x428a2f98,
          0x71374491,
          0xb5c0fbcf,
          0xe9b5dba5,
          0x3956c25b,
          0x59f111f1,
          0x923f82a4,
          0xab1c5ed5,
          0xd807aa98,
          0x12835b01,
          0x243185be,
          0x550c7dc3,
          0x72be5d74,
          0x80deb1fe,
          0x9bdc06a7,
          0xc19bf174,
          0xe49b69c1,
          0xefbe4786,
          0x0fc19dc6,
          0x240ca1cc,
          0x2de92c6f,
          0x4a7484aa,
          0x5cb0a9dc,
          0x76f988da,
          0x983e5152,
          0xa831c66d,
          0xb00327c8,
          0xbf597fc7,
          0xc6e00bf3,
          0xd5a79147,
          0x06ca6351,
          0x14292967,
          0x27b70a85,
          0x2e1b2138,
          0x4d2c6dfc,
          0x53380d13,
          0x650a7354,
          0x766a0abb,
          0x81c2c92e,
          0x92722c85,
          0xa2bfe8a1,
          0xa81a664b,
          0xc24b8b70,
          0xc76c51a3,
          0xd192e819,
          0xd6990624,
          0xf40e3585,
          0x106aa070,
          0x19a4c116,
          0x1e376c08,
          0x2748774c,
          0x34b0bcb5,
          0x391c0cb3,
          0x4ed8aa4a,
          0x5b9cca4f,
          0x682e6ff3,
          0x748f82ee,
          0x78a5636f,
          0x84c87814,
          0x8cc70208,
          0x90befffa,
          0xa4506ceb,
          0xbef9a3f7,
          0xc67178f2
      ]);
      this.init();
  }
  init() {
      this._H = new Uint32Array([
          0x6a09e667,
          0xbb67ae85,
          0x3c6ef372,
          0xa54ff53a,
          0x510e527f,
          0x9b05688c,
          0x1f83d9ab,
          0x5be0cd19
      ]);
      this._bufIdx = 0;
      this._count = new Uint32Array(2);
      this._buf.fill(0);
      this._finalized = false;
      return this;
  }
  update(msg, inputEncoding) {
      if (msg === null) {
          throw new TypeError("msg must be a string or Uint8Array.");
      } else if (typeof msg === "string") {
          msg = encode3(msg, inputEncoding);
      }
      for(let i21 = 0, len = msg.length; i21 < len; i21++){
          this._buf[this._bufIdx++] = msg[i21];
          if (this._bufIdx === 64) {
              this._transform();
              this._bufIdx = 0;
          }
      }
      const c = this._count;
      if ((c[0] += msg.length << 3) < msg.length << 3) {
          c[1]++;
      }
      c[1] += msg.length >>> 29;
      return this;
  }
  digest(outputEncoding) {
      if (this._finalized) {
          throw new Error("digest has already been called.");
      }
      this._finalized = true;
      const b = this._buf;
      let idx = this._bufIdx;
      b[idx++] = 0x80;
      while(idx !== 56){
          if (idx === 64) {
              this._transform();
              idx = 0;
          }
          b[idx++] = 0;
      }
      const c = this._count;
      b[56] = c[1] >>> 24 & 0xff;
      b[57] = c[1] >>> 16 & 0xff;
      b[58] = c[1] >>> 8 & 0xff;
      b[59] = c[1] >>> 0 & 0xff;
      b[60] = c[0] >>> 24 & 0xff;
      b[61] = c[0] >>> 16 & 0xff;
      b[62] = c[0] >>> 8 & 0xff;
      b[63] = c[0] >>> 0 & 0xff;
      this._transform();
      const hash = new Uint8Array(32);
      for(let i22 = 0; i22 < 8; i22++){
          hash[(i22 << 2) + 0] = this._H[i22] >>> 24 & 0xff;
          hash[(i22 << 2) + 1] = this._H[i22] >>> 16 & 0xff;
          hash[(i22 << 2) + 2] = this._H[i22] >>> 8 & 0xff;
          hash[(i22 << 2) + 3] = this._H[i22] >>> 0 & 0xff;
      }
      this.init();
      return outputEncoding ? decode3(hash, outputEncoding) : hash;
  }
  _transform() {
      const h = this._H;
      let h0 = h[0];
      let h1 = h[1];
      let h2 = h[2];
      let h3 = h[3];
      let h4 = h[4];
      let h5 = h[5];
      let h6 = h[6];
      let h7 = h[7];
      const w = new Uint32Array(16);
      let i23;
      for(i23 = 0; i23 < 16; i23++){
          w[i23] = this._buf[(i23 << 2) + 3] | this._buf[(i23 << 2) + 2] << 8 | this._buf[(i23 << 2) + 1] << 16 | this._buf[i23 << 2] << 24;
      }
      for(i23 = 0; i23 < 64; i23++){
          let tmp;
          if (i23 < 16) {
              tmp = w[i23];
          } else {
              let a = w[i23 + 1 & 15];
              let b = w[i23 + 14 & 15];
              tmp = w[i23 & 15] = (a >>> 7 ^ a >>> 18 ^ a >>> 3 ^ a << 25 ^ a << 14) + (b >>> 17 ^ b >>> 19 ^ b >>> 10 ^ b << 15 ^ b << 13) + w[i23 & 15] + w[i23 + 9 & 15] | 0;
          }
          tmp = tmp + h7 + (h4 >>> 6 ^ h4 >>> 11 ^ h4 >>> 25 ^ h4 << 26 ^ h4 << 21 ^ h4 << 7) + (h6 ^ h4 & (h5 ^ h6)) + this._K[i23] | 0;
          h7 = h6;
          h6 = h5;
          h5 = h4;
          h4 = h3 + tmp;
          h3 = h2;
          h2 = h1;
          h1 = h0;
          h0 = tmp + (h1 & h2 ^ h3 & (h1 ^ h2)) + (h1 >>> 2 ^ h1 >>> 13 ^ h1 >>> 22 ^ h1 << 30 ^ h1 << 19 ^ h1 << 10) | 0;
      }
      h[0] = h[0] + h0 | 0;
      h[1] = h[1] + h1 | 0;
      h[2] = h[2] + h2 | 0;
      h[3] = h[3] + h3 | 0;
      h[4] = h[4] + h4 | 0;
      h[5] = h[5] + h5 | 0;
      h[6] = h[6] + h6 | 0;
      h[7] = h[7] + h7 | 0;
  }
}
function sha256(msg, inputEncoding, outputEncoding) {
  return new SHA256().update(msg, inputEncoding).digest(outputEncoding);
}
const lookup1 = [];
const revLookup1 = [];
const code1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for(let i1 = 0, l1 = code1.length; i1 < l1; ++i1){
  lookup1[i1] = code1[i1];
  revLookup1[code1.charCodeAt(i1)] = i1;
}
revLookup1["-".charCodeAt(0)] = 62;
revLookup1["_".charCodeAt(0)] = 63;
const { byteLength: byteLength1 , toUint8Array: toUint8Array1 , fromUint8Array: fromUint8Array1  } = init(lookup1, revLookup1);
const decoder1 = new TextDecoder();
const encoder1 = new TextEncoder();
function toHexString1(buf) {
  return buf.reduce((hex, __byte)=>`${hex}${__byte < 16 ? "0" : ""}${__byte.toString(16)}`
  , "");
}
function fromHexString1(hex) {
  const len = hex.length;
  if (len % 2 || !/^[0-9a-fA-F]+$/.test(hex)) {
      throw new TypeError("Invalid hex string.");
  }
  hex = hex.toLowerCase();
  const buf = new Uint8Array(Math.floor(len / 2));
  const end = len / 2;
  for(let i24 = 0; i24 < end; ++i24){
      buf[i24] = parseInt(hex.substr(i24 * 2, 2), 16);
  }
  return buf;
}
function decode4(buf, encoding = "utf8") {
  if (/^utf-?8$/i.test(encoding)) {
      return decoder1.decode(buf);
  } else if (/^base64$/i.test(encoding)) {
      return fromUint8Array1(buf);
  } else if (/^base64url$/i.test(encoding)) {
      return fromUint8Array(buf);
  } else if (/^hex(?:adecimal)?$/i.test(encoding)) {
      return toHexString1(buf);
  } else {
      throw new TypeError("Unsupported string encoding.");
  }
}
function encode4(str, encoding = "utf8") {
  if (/^utf-?8$/i.test(encoding)) {
      return encoder1.encode(str);
  } else if (/^base64(?:url)?$/i.test(encoding)) {
      return toUint8Array1(str);
  } else if (/^hex(?:adecimal)?$/i.test(encoding)) {
      return fromHexString1(str);
  } else {
      throw new TypeError("Unsupported string encoding.");
  }
}
class SHA512 {
  hashSize = 64;
  _buffer = new Uint8Array(128);
  _bufferIndex;
  _count;
  _K;
  _H;
  _finalized;
  constructor(){
      this._K = new Uint32Array([
          0x428a2f98,
          0xd728ae22,
          0x71374491,
          0x23ef65cd,
          0xb5c0fbcf,
          0xec4d3b2f,
          0xe9b5dba5,
          0x8189dbbc,
          0x3956c25b,
          0xf348b538,
          0x59f111f1,
          0xb605d019,
          0x923f82a4,
          0xaf194f9b,
          0xab1c5ed5,
          0xda6d8118,
          0xd807aa98,
          0xa3030242,
          0x12835b01,
          0x45706fbe,
          0x243185be,
          0x4ee4b28c,
          0x550c7dc3,
          0xd5ffb4e2,
          0x72be5d74,
          0xf27b896f,
          0x80deb1fe,
          0x3b1696b1,
          0x9bdc06a7,
          0x25c71235,
          0xc19bf174,
          0xcf692694,
          0xe49b69c1,
          0x9ef14ad2,
          0xefbe4786,
          0x384f25e3,
          0x0fc19dc6,
          0x8b8cd5b5,
          0x240ca1cc,
          0x77ac9c65,
          0x2de92c6f,
          0x592b0275,
          0x4a7484aa,
          0x6ea6e483,
          0x5cb0a9dc,
          0xbd41fbd4,
          0x76f988da,
          0x831153b5,
          0x983e5152,
          0xee66dfab,
          0xa831c66d,
          0x2db43210,
          0xb00327c8,
          0x98fb213f,
          0xbf597fc7,
          0xbeef0ee4,
          0xc6e00bf3,
          0x3da88fc2,
          0xd5a79147,
          0x930aa725,
          0x06ca6351,
          0xe003826f,
          0x14292967,
          0x0a0e6e70,
          0x27b70a85,
          0x46d22ffc,
          0x2e1b2138,
          0x5c26c926,
          0x4d2c6dfc,
          0x5ac42aed,
          0x53380d13,
          0x9d95b3df,
          0x650a7354,
          0x8baf63de,
          0x766a0abb,
          0x3c77b2a8,
          0x81c2c92e,
          0x47edaee6,
          0x92722c85,
          0x1482353b,
          0xa2bfe8a1,
          0x4cf10364,
          0xa81a664b,
          0xbc423001,
          0xc24b8b70,
          0xd0f89791,
          0xc76c51a3,
          0x0654be30,
          0xd192e819,
          0xd6ef5218,
          0xd6990624,
          0x5565a910,
          0xf40e3585,
          0x5771202a,
          0x106aa070,
          0x32bbd1b8,
          0x19a4c116,
          0xb8d2d0c8,
          0x1e376c08,
          0x5141ab53,
          0x2748774c,
          0xdf8eeb99,
          0x34b0bcb5,
          0xe19b48a8,
          0x391c0cb3,
          0xc5c95a63,
          0x4ed8aa4a,
          0xe3418acb,
          0x5b9cca4f,
          0x7763e373,
          0x682e6ff3,
          0xd6b2b8a3,
          0x748f82ee,
          0x5defb2fc,
          0x78a5636f,
          0x43172f60,
          0x84c87814,
          0xa1f0ab72,
          0x8cc70208,
          0x1a6439ec,
          0x90befffa,
          0x23631e28,
          0xa4506ceb,
          0xde82bde9,
          0xbef9a3f7,
          0xb2c67915,
          0xc67178f2,
          0xe372532b,
          0xca273ece,
          0xea26619c,
          0xd186b8c7,
          0x21c0c207,
          0xeada7dd6,
          0xcde0eb1e,
          0xf57d4f7f,
          0xee6ed178,
          0x06f067aa,
          0x72176fba,
          0x0a637dc5,
          0xa2c898a6,
          0x113f9804,
          0xbef90dae,
          0x1b710b35,
          0x131c471b,
          0x28db77f5,
          0x23047d84,
          0x32caab7b,
          0x40c72493,
          0x3c9ebe0a,
          0x15c9bebc,
          0x431d67c4,
          0x9c100d4c,
          0x4cc5d4be,
          0xcb3e42b6,
          0x597f299c,
          0xfc657e2a,
          0x5fcb6fab,
          0x3ad6faec,
          0x6c44198c,
          0x4a475817
      ]);
      this.init();
  }
  init() {
      this._H = new Uint32Array([
          0x6a09e667,
          0xf3bcc908,
          0xbb67ae85,
          0x84caa73b,
          0x3c6ef372,
          0xfe94f82b,
          0xa54ff53a,
          0x5f1d36f1,
          0x510e527f,
          0xade682d1,
          0x9b05688c,
          0x2b3e6c1f,
          0x1f83d9ab,
          0xfb41bd6b,
          0x5be0cd19,
          0x137e2179
      ]);
      this._bufferIndex = 0;
      this._count = new Uint32Array(2);
      this._buffer.fill(0);
      this._finalized = false;
      return this;
  }
  update(msg, inputEncoding) {
      if (msg === null) {
          throw new TypeError("msg must be a string or Uint8Array.");
      } else if (typeof msg === "string") {
          msg = encode4(msg, inputEncoding);
      }
      for(let i25 = 0; i25 < msg.length; i25++){
          this._buffer[this._bufferIndex++] = msg[i25];
          if (this._bufferIndex === 128) {
              this.transform();
              this._bufferIndex = 0;
          }
      }
      let c = this._count;
      if ((c[0] += msg.length << 3) < msg.length << 3) {
          c[1]++;
      }
      c[1] += msg.length >>> 29;
      return this;
  }
  digest(outputEncoding) {
      if (this._finalized) {
          throw new Error("digest has already been called.");
      }
      this._finalized = true;
      var b = this._buffer, idx = this._bufferIndex;
      b[idx++] = 0x80;
      while(idx !== 112){
          if (idx === 128) {
              this.transform();
              idx = 0;
          }
          b[idx++] = 0;
      }
      let c = this._count;
      b[112] = b[113] = b[114] = b[115] = b[116] = b[117] = b[118] = b[119] = 0;
      b[120] = c[1] >>> 24 & 0xff;
      b[121] = c[1] >>> 16 & 0xff;
      b[122] = c[1] >>> 8 & 0xff;
      b[123] = c[1] >>> 0 & 0xff;
      b[124] = c[0] >>> 24 & 0xff;
      b[125] = c[0] >>> 16 & 0xff;
      b[126] = c[0] >>> 8 & 0xff;
      b[127] = c[0] >>> 0 & 0xff;
      this.transform();
      let i26, hash = new Uint8Array(64);
      for(i26 = 0; i26 < 16; i26++){
          hash[(i26 << 2) + 0] = this._H[i26] >>> 24 & 0xff;
          hash[(i26 << 2) + 1] = this._H[i26] >>> 16 & 0xff;
          hash[(i26 << 2) + 2] = this._H[i26] >>> 8 & 0xff;
          hash[(i26 << 2) + 3] = this._H[i26] & 0xff;
      }
      this.init();
      return outputEncoding ? decode4(hash, outputEncoding) : hash;
  }
  transform() {
      let h = this._H, h0h = h[0], h0l = h[1], h1h = h[2], h1l = h[3], h2h = h[4], h2l = h[5], h3h = h[6], h3l = h[7], h4h = h[8], h4l = h[9], h5h = h[10], h5l = h[11], h6h = h[12], h6l = h[13], h7h = h[14], h7l = h[15];
      let ah = h0h, al = h0l, bh = h1h, bl = h1l, ch = h2h, cl = h2l, dh = h3h, dl = h3l, eh = h4h, el = h4l, fh = h5h, fl = h5l, gh = h6h, gl = h6l, hh = h7h, hl = h7l;
      let i27, w = new Uint32Array(160);
      for(i27 = 0; i27 < 32; i27++){
          w[i27] = this._buffer[(i27 << 2) + 3] | this._buffer[(i27 << 2) + 2] << 8 | this._buffer[(i27 << 2) + 1] << 16 | this._buffer[i27 << 2] << 24;
      }
      let gamma0xl, gamma0xh, gamma0l, gamma0h, gamma1xl, gamma1xh, gamma1l, gamma1h, wrl, wrh, wr7l, wr7h, wr16l, wr16h;
      for(i27 = 16; i27 < 80; i27++){
          gamma0xh = w[(i27 - 15) * 2];
          gamma0xl = w[(i27 - 15) * 2 + 1];
          gamma0h = (gamma0xl << 31 | gamma0xh >>> 1) ^ (gamma0xl << 24 | gamma0xh >>> 8) ^ gamma0xh >>> 7;
          gamma0l = (gamma0xh << 31 | gamma0xl >>> 1) ^ (gamma0xh << 24 | gamma0xl >>> 8) ^ (gamma0xh << 25 | gamma0xl >>> 7);
          gamma1xh = w[(i27 - 2) * 2];
          gamma1xl = w[(i27 - 2) * 2 + 1];
          gamma1h = (gamma1xl << 13 | gamma1xh >>> 19) ^ (gamma1xh << 3 | gamma1xl >>> 29) ^ gamma1xh >>> 6;
          gamma1l = (gamma1xh << 13 | gamma1xl >>> 19) ^ (gamma1xl << 3 | gamma1xh >>> 29) ^ (gamma1xh << 26 | gamma1xl >>> 6);
          wr7h = w[(i27 - 7) * 2], wr7l = w[(i27 - 7) * 2 + 1], wr16h = w[(i27 - 16) * 2], wr16l = w[(i27 - 16) * 2 + 1];
          wrl = gamma0l + wr7l;
          wrh = gamma0h + wr7h + (wrl >>> 0 < gamma0l >>> 0 ? 1 : 0);
          wrl += gamma1l;
          wrh += gamma1h + (wrl >>> 0 < gamma1l >>> 0 ? 1 : 0);
          wrl += wr16l;
          wrh += wr16h + (wrl >>> 0 < wr16l >>> 0 ? 1 : 0);
          w[i27 * 2] = wrh;
          w[i27 * 2 + 1] = wrl;
      }
      let chl, chh, majl, majh, sig0l, sig0h, sig1l, sig1h, krl, krh, t1l, t1h, t2l, t2h;
      for(i27 = 0; i27 < 80; i27++){
          chh = eh & fh ^ ~eh & gh;
          chl = el & fl ^ ~el & gl;
          majh = ah & bh ^ ah & ch ^ bh & ch;
          majl = al & bl ^ al & cl ^ bl & cl;
          sig0h = (al << 4 | ah >>> 28) ^ (ah << 30 | al >>> 2) ^ (ah << 25 | al >>> 7);
          sig0l = (ah << 4 | al >>> 28) ^ (al << 30 | ah >>> 2) ^ (al << 25 | ah >>> 7);
          sig1h = (el << 18 | eh >>> 14) ^ (el << 14 | eh >>> 18) ^ (eh << 23 | el >>> 9);
          sig1l = (eh << 18 | el >>> 14) ^ (eh << 14 | el >>> 18) ^ (el << 23 | eh >>> 9);
          krh = this._K[i27 * 2];
          krl = this._K[i27 * 2 + 1];
          t1l = hl + sig1l;
          t1h = hh + sig1h + (t1l >>> 0 < hl >>> 0 ? 1 : 0);
          t1l += chl;
          t1h += chh + (t1l >>> 0 < chl >>> 0 ? 1 : 0);
          t1l += krl;
          t1h += krh + (t1l >>> 0 < krl >>> 0 ? 1 : 0);
          t1l = t1l + w[i27 * 2 + 1];
          t1h += w[i27 * 2] + (t1l >>> 0 < w[i27 * 2 + 1] >>> 0 ? 1 : 0);
          t2l = sig0l + majl;
          t2h = sig0h + majh + (t2l >>> 0 < sig0l >>> 0 ? 1 : 0);
          hh = gh;
          hl = gl;
          gh = fh;
          gl = fl;
          fh = eh;
          fl = el;
          el = dl + t1l | 0;
          eh = dh + t1h + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
          dh = ch;
          dl = cl;
          ch = bh;
          cl = bl;
          bh = ah;
          bl = al;
          al = t1l + t2l | 0;
          ah = t1h + t2h + (al >>> 0 < t1l >>> 0 ? 1 : 0) | 0;
      }
      h0l = h[1] = h0l + al | 0;
      h[0] = h0h + ah + (h0l >>> 0 < al >>> 0 ? 1 : 0) | 0;
      h1l = h[3] = h1l + bl | 0;
      h[2] = h1h + bh + (h1l >>> 0 < bl >>> 0 ? 1 : 0) | 0;
      h2l = h[5] = h2l + cl | 0;
      h[4] = h2h + ch + (h2l >>> 0 < cl >>> 0 ? 1 : 0) | 0;
      h3l = h[7] = h3l + dl | 0;
      h[6] = h3h + dh + (h3l >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      h4l = h[9] = h4l + el | 0;
      h[8] = h4h + eh + (h4l >>> 0 < el >>> 0 ? 1 : 0) | 0;
      h5l = h[11] = h5l + fl | 0;
      h[10] = h5h + fh + (h5l >>> 0 < fl >>> 0 ? 1 : 0) | 0;
      h6l = h[13] = h6l + gl | 0;
      h[12] = h6h + gh + (h6l >>> 0 < gl >>> 0 ? 1 : 0) | 0;
      h7l = h[15] = h7l + hl | 0;
      h[14] = h7h + hh + (h7l >>> 0 < hl >>> 0 ? 1 : 0) | 0;
  }
}
function sha512(msg, inputEncoding, outputEncoding) {
  return new SHA512().init().update(msg, inputEncoding).digest(outputEncoding);
}
function digest(algorithm, m) {
  if (algorithm === "sha1") {
      return sha1(m);
  } else if (algorithm === "sha256") {
      return sha256(m);
  } else if (algorithm === "sha512") {
      return sha512(m);
  }
  throw "Unsupport hash algorithm";
}
function digestLength(algorithm) {
  if (algorithm === "sha512") return 64;
  if (algorithm === "sha256") return 32;
  return 20;
}
function i2osp(x, length) {
  const t = new Uint8Array(length);
  for(let i28 = length - 1; i28 >= 0; i28--){
      if (x === 0n) break;
      t[i28] = Number(x & 255n);
      x = x >> 8n;
  }
  return t;
}
function os2ip(m) {
  let n = 0n;
  for (const c of m)n = (n << 8n) + BigInt(c);
  return n;
}
function mgf1(seed, length, hash) {
  let counter = 0n;
  let output = [];
  while(output.length < length){
      const c = i2osp(counter, 4);
      const h = new Uint8Array(digest(hash, new Uint8Array([
          ...seed,
          ...c
      ])));
      output = [
          ...output,
          ...h
      ];
      counter++;
  }
  return new Uint8Array(output.slice(0, length));
}
function xor(a, b) {
  const c = new Uint8Array(a.length);
  for(let i29 = 0; i29 < c.length; i29++){
      c[i29] = a[i29] ^ b[i29 % b.length];
  }
  return c;
}
function concat(...arg) {
  const length = arg.reduce((a, b)=>a + b.length
  , 0);
  const c = new Uint8Array(length);
  let ptr = 0;
  for(let i30 = 0; i30 < arg.length; i30++){
      c.set(arg[i30], ptr);
      ptr += arg[i30].length;
  }
  return c;
}
function random_bytes(length) {
  const n = new Uint8Array(length);
  for(let i31 = 0; i31 < length; i31++)n[i31] = (Math.random() * 254 | 0) + 1;
  return n;
}
function get_key_size(n) {
  const size_list = [
      64n,
      128n,
      256n,
      512n,
      1024n
  ];
  for (const size of size_list){
      if (n < 1n << size * 8n) return Number(size);
  }
  return 2048;
}
function base64_to_binary(b) {
  let binaryString = window.atob(b);
  let len = binaryString.length;
  let bytes = new Uint8Array(len);
  for(var i32 = 0; i32 < len; i32++){
      bytes[i32] = binaryString.charCodeAt(i32);
  }
  return bytes;
}
function eme_oaep_encode(label, m, k, algorithm) {
  const labelHash = new Uint8Array(digest(algorithm, label));
  const ps = new Uint8Array(k - labelHash.length * 2 - 2 - m.length);
  const db = concat(labelHash, ps, [
      0x01
  ], m);
  const seed = random_bytes(labelHash.length);
  const dbMask = mgf1(seed, k - labelHash.length - 1, algorithm);
  const maskedDb = xor(db, dbMask);
  const seedMask = mgf1(maskedDb, labelHash.length, algorithm);
  const maskedSeed = xor(seed, seedMask);
  return concat([
      0x00
  ], maskedSeed, maskedDb);
}
function eme_oaep_decode(label, c, k, algorithm) {
  const labelHash = new Uint8Array(digest(algorithm, label));
  const maskedSeed = c.slice(1, 1 + labelHash.length);
  const maskedDb = c.slice(1 + labelHash.length);
  const seedMask = mgf1(maskedDb, labelHash.length, algorithm);
  const seed = xor(maskedSeed, seedMask);
  const dbMask = mgf1(seed, k - labelHash.length - 1, algorithm);
  const db = xor(maskedDb, dbMask);
  let ptr = labelHash.length;
  while(ptr < db.length && db[ptr] === 0)ptr++;
  return db.slice(ptr + 1);
}
function ber_decode(bytes, from, to) {
  return ber_next(bytes);
}
function ber_sequence(bytes, from, length) {
  const end = from + length;
  let res = [];
  let ptr = from;
  while(ptr < end){
      const next = ber_next(bytes, ptr);
      res.push(next);
      ptr += next.totalLength;
  }
  return res;
}
function ber_integer(bytes, from, length) {
  let n = 0n;
  for (const b of bytes.slice(from, from + length)){
      n = (n << 8n) + BigInt(b);
  }
  return n;
}
function ber_oid(bytes, from, length) {
  const id = [
      bytes[from] / 40 | 0,
      bytes[from] % 40
  ];
  let value = 0;
  for (const b of bytes.slice(from + 1, from + length)){
      if (b > 128) value += value * 127 + (b - 128);
      else {
          value = value * 128 + b;
          id.push(value);
          value = 0;
      }
  }
  return id.join(".");
}
function ber_unknown(bytes, from, length) {
  return bytes.slice(from, from + length);
}
function ber_simple(n) {
  if (Array.isArray(n.value)) return n.value.map((x)=>ber_simple(x)
  );
  return n.value;
}
function ber_next(bytes, from, to) {
  if (!from) from = 0;
  if (!to) to = bytes.length;
  let ptr = from;
  const type = bytes[ptr++];
  let size = bytes[ptr++];
  if ((size & 0x80) > 0) {
      let ext = size - 0x80;
      size = 0;
      while(--ext >= 0){
          size = (size << 8) + bytes[ptr++];
      }
  }
  let value = null;
  if (type === 0x30) {
      value = ber_sequence(bytes, ptr, size);
  } else if (type === 0x2) {
      value = ber_integer(bytes, ptr, size);
  } else if (type === 0x3) {
      value = ber_sequence(bytes, ptr + 1, size - 1);
  } else if (type === 0x5) {
      value = null;
  } else if (type === 0x6) {
      value = ber_oid(bytes, ptr, size);
  } else {
      value = ber_unknown(bytes, ptr, size);
  }
  return {
      totalLength: ptr - from + size,
      type,
      length: size,
      value
  };
}
class RawBinary extends Uint8Array {
  hex() {
      return [
          ...this
      ].map((x)=>x.toString(16).padStart(2, "0")
      ).join("");
  }
  binary() {
      return this;
  }
  base64() {
      return btoa(String.fromCharCode.apply(null, [
          ...this
      ]));
  }
  base64url() {
      let a = btoa(String.fromCharCode.apply(null, [
          ...this
      ])).replace(/=/g, "");
      a = a.replace(/\+/g, "-");
      a = a.replace(/\//g, "_");
      return a;
  }
  base32() {
      const lookup3 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      const trim = [
          0x0,
          0x1,
          0x3,
          0x7,
          0xf,
          0x1f,
          0x3f,
          0x7f,
          0xff
      ];
      let output = "";
      let bits = 0;
      let current = 0;
      for(let i33 = 0; i33 < this.length; i33++){
          current = (current << 8) + this[i33];
          bits += 8;
          while(bits >= 5){
              bits -= 5;
              output += lookup3[current >> bits];
              current = current & trim[bits];
          }
      }
      if (bits > 0) {
          output += lookup3[current << 5 - bits];
      }
      return output;
  }
  toString() {
      return new TextDecoder().decode(this);
  }
}
function rsaep(n, e, m) {
  return power_mod(m, e, n);
}
function rsadp(key, c) {
  if (!key.d) throw "Invalid RSA key";
  if (key.dp && key.dq && key.qi && key.q && key.p) {
      const m1 = power_mod(c % key.p, key.dp, key.p);
      const m2 = power_mod(c % key.q, key.dq, key.q);
      let h = 0n;
      if (m1 >= m2) {
          h = key.qi * (m1 - m2) % key.p;
      } else {
          h = key.qi * (m1 - m2 + key.p * (key.p / key.q)) % key.p;
      }
      return (m2 + h * key.q) % (key.q * key.p);
  } else {
      return power_mod(c, key.d, key.n);
  }
}
function rsa_oaep_encrypt(bytes, n, e, m, algorithm) {
  const em = eme_oaep_encode(new Uint8Array(0), m, bytes, algorithm);
  const msg = os2ip(em);
  const c = rsaep(n, e, msg);
  return i2osp(c, bytes);
}
function rsa_oaep_decrypt(key, c, algorithm) {
  const em = rsadp(key, os2ip(c));
  const m = eme_oaep_decode(new Uint8Array(0), i2osp(em, key.length), key.length, algorithm);
  return m;
}
function rsa_pkcs1_encrypt(bytes, n, e, m) {
  const p = concat([
      0x00,
      0x02
  ], random_bytes(bytes - m.length - 3), [
      0x00
  ], m);
  const msg = os2ip(p);
  const c = rsaep(n, e, msg);
  return i2osp(c, bytes);
}
function rsa_pkcs1_decrypt(key, c) {
  const em = i2osp(rsadp(key, os2ip(c)), key.length);
  if (em[0] !== 0) throw "Decryption error";
  if (em[1] !== 0x02) throw "Decryption error";
  let psCursor = 2;
  for(; psCursor < em.length; psCursor++){
      if (em[psCursor] === 0x00) break;
  }
  if (psCursor < 10) throw "Decryption error";
  return em.slice(psCursor + 1);
}
function rsa_pkcs1_verify(key, s, m) {
  if (!key.e) throw "Invalid RSA key";
  let em = i2osp(rsaep(key.n, key.e, os2ip(s)), key.length);
  if (em[0] !== 0) throw "Decryption error";
  if (em[1] !== 0x01) throw "Decryption error";
  let psCursor = 2;
  for(; psCursor < em.length; psCursor++){
      if (em[psCursor] === 0x00) break;
  }
  if (psCursor < 10) throw "Decryption error";
  em = em.slice(psCursor + 1);
  const ber = ber_simple(ber_decode(em));
  const decryptedMessage = ber[1];
  if (decryptedMessage.length !== m.length) return false;
  for(let i34 = 0; i34 < decryptedMessage.length; i34++){
      if (decryptedMessage[i34] !== m[i34]) return false;
  }
  return true;
}
function rsa_pkcs1_sign(bytes, n, d, message, algorithm) {
  const oid = [
      0x30,
      0x0d,
      0x06,
      0x09,
      0x60,
      0x86,
      0x48,
      0x01,
      0x65,
      0x03,
      0x04,
      0x02,
      algorithm === "sha512" ? 0x03 : 0x01,
      0x05,
      0x00,
  ];
  const der = [
      0x30,
      message.length + 2 + oid.length,
      ...oid,
      0x04,
      message.length,
      ...message,
  ];
  const ps = new Array(bytes - 3 - der.length).fill(0xff);
  const em = new Uint8Array([
      0x00,
      0x01,
      ...ps,
      0x00,
      ...der
  ]);
  const msg = os2ip(em);
  const c = rsaep(n, d, msg);
  return new RawBinary(i2osp(c, bytes));
}
function emsa_pss_encode(m, emBits, sLen, algorithm) {
  const mHash = digest(algorithm, m);
  const hLen = mHash.length;
  const emLen = Math.ceil(emBits / 8);
  if (emLen < hLen + sLen + 2) throw "Encoding Error";
  const salt = new Uint8Array(sLen);
  crypto.getRandomValues(salt);
  const m1 = new Uint8Array([
      0x0,
      0x0,
      0x0,
      0x0,
      0x0,
      0x0,
      0x0,
      0x0,
      ...mHash,
      ...salt
  ]);
  const h = digest(algorithm, m1);
  const ps = new Uint8Array(emLen - sLen - hLen - 2);
  const db = new Uint8Array([
      ...ps,
      0x01,
      ...salt
  ]);
  const dbMask = mgf1(h, emLen - hLen - 1, algorithm);
  const maskedDB = xor(db, dbMask);
  const leftMost = 8 * emLen - emBits;
  maskedDB[0] = maskedDB[0] & 0xff >> leftMost;
  return new Uint8Array([
      ...maskedDB,
      ...h,
      0xbc
  ]);
}
function emsa_pss_verify(m, em, emBits, sLen, algorithm) {
  const mHash = digest(algorithm, m);
  const hLen = mHash.length;
  const emLen = Math.ceil(emBits / 8);
  if (emLen < hLen + sLen + 2) return false;
  if (em[em.length - 1] !== 0xbc) return false;
  const maskedDB = em.slice(0, emLen - hLen - 1);
  const h = em.slice(emLen - hLen - 1, emLen - 1);
  const leftMost = 8 * emLen - emBits;
  if (maskedDB[0] >> 8 - leftMost != 0) return false;
  const dbMask = mgf1(h, emLen - hLen - 1, algorithm);
  const db = xor(maskedDB, dbMask);
  db[0] = db[0] & 0xff >> leftMost;
  for(let i35 = 1; i35 < emLen - hLen - sLen - 2; i35++){
      if (db[i35] !== 0x00) return false;
  }
  if (db[emLen - hLen - sLen - 2] !== 0x01) return false;
  const salt = db.slice(emLen - hLen - sLen - 1);
  const m1 = new Uint8Array([
      0x0,
      0x0,
      0x0,
      0x0,
      0x0,
      0x0,
      0x0,
      0x0,
      ...mHash,
      ...salt
  ]);
  const h1 = digest(algorithm, m1);
  for(let i110 = 0; i110 < hLen; i110++){
      if (h1[i110] !== h[i110]) return false;
  }
  return true;
}
function rsassa_pss_sign(key, m, algorithm) {
  if (!key.d) throw "Invalid RSA Key";
  const hLen = digestLength(algorithm);
  let em = emsa_pss_encode(m, key.length * 8 - 1, hLen, algorithm);
  return new RawBinary(i2osp(rsaep(key.n, key.d, os2ip(em)), key.length));
}
function rsassa_pss_verify(key, m, signature, algorithm) {
  if (!key.e) throw "Invalid RSA Key";
  const hLen = digestLength(algorithm);
  const em = i2osp(rsaep(key.n, key.e, os2ip(signature)), key.length);
  return emsa_pss_verify(m, em, key.length * 8 - 1, hLen, algorithm);
}
class PureRSA {
  static async encrypt(key, message, options) {
      if (!key.e) throw "Invalid RSA key";
      if (options.padding === "oaep") {
          return new RawBinary(rsa_oaep_encrypt(key.length, key.n, key.e, message, options.hash));
      } else if (options.padding === "pkcs1") {
          return new RawBinary(rsa_pkcs1_encrypt(key.length, key.n, key.e, message));
      }
      throw "Invalid parameters";
  }
  static async decrypt(key, ciper, options) {
      if (!key.d) throw "Invalid RSA key";
      if (options.padding === "oaep") {
          return new RawBinary(rsa_oaep_decrypt(key, ciper, options.hash));
      } else if (options.padding === "pkcs1") {
          return new RawBinary(rsa_pkcs1_decrypt(key, ciper));
      }
      throw "Invalid parameters";
  }
  static async verify(key, signature, message, options) {
      if (!key.e) throw "Invalid RSA key";
      if (options.algorithm === "rsassa-pkcs1-v1_5") {
          return rsa_pkcs1_verify(key, signature, digest(options.hash, message));
      } else {
          return rsassa_pss_verify(key, message, signature, options.hash);
      }
  }
  static async sign(key, message, options) {
      if (!key.d) throw "You need private key to sign the message";
      if (options.algorithm === "rsassa-pkcs1-v1_5") {
          return rsa_pkcs1_sign(key.length, key.n, key.d, digest(options.hash, message), options.hash);
      } else {
          return rsassa_pss_sign(key, message, options.hash);
      }
  }
}
class encode5 {
  static hex(data) {
      if (data.length % 2 !== 0) throw "Invalid hex format";
      const output = new RawBinary(data.length >> 1);
      let ptr = 0;
      for(let i36 = 0; i36 < data.length; i36 += 2){
          output[ptr++] = parseInt(data.substr(i36, 2), 16);
      }
      return output;
  }
  static bigint(n) {
      const bytes = [];
      while(n > 0){
          bytes.push(Number(n & 255n));
          n = n >> 8n;
      }
      bytes.reverse();
      return new RawBinary(bytes);
  }
  static string(data) {
      return new RawBinary(new TextEncoder().encode(data));
  }
  static base64(data) {
      return new RawBinary(Uint8Array.from(atob(data), (c)=>c.charCodeAt(0)
      ));
  }
  static base64url(data) {
      let input = data.replace(/-/g, "+").replace(/_/g, "/");
      const pad = input.length % 4;
      if (pad) {
          if (pad === 1) throw "Invalid length";
          input += new Array(5 - pad).join("=");
      }
      return encode5.base64(input);
  }
  static binary(data) {
      return new RawBinary(data);
  }
  static base32(data) {
      data = data.toUpperCase();
      data = data.replace(/=+$/g, "");
      const lookup4 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      const size = data.length * 5 >> 3;
      const output = new RawBinary(size);
      let ptr = 0;
      let bits = 0;
      let current = 0;
      for(let i37 = 0; i37 < data.length; i37++){
          const value = lookup4.indexOf(data[i37]);
          if (value < 0) throw "Invalid base32 format";
          current = (current << 5) + value;
          bits += 5;
          if (bits >= 8) {
              bits -= 8;
              const t = current >> bits;
              current -= t << bits;
              output[ptr++] = t;
          }
      }
      return output;
  }
}
function detect_format(key) {
  if (typeof key === "object") {
      if (key.kty === "RSA") return "jwk";
  } else if (typeof key === "string") {
      if (key.substr(0, "-----".length) === "-----") return "pem";
  }
  throw new TypeError("Unsupported key format");
}
function rsa_import_jwk(key) {
  if (typeof key !== "object") throw new TypeError("Invalid JWK format");
  if (!key.n) throw new TypeError("RSA key requires n");
  const n = os2ip(encode5.base64url(key.n));
  return {
      e: key.e ? os2ip(encode5.base64url(key.e)) : undefined,
      n: os2ip(encode5.base64url(key.n)),
      d: key.d ? os2ip(encode5.base64url(key.d)) : undefined,
      p: key.p ? os2ip(encode5.base64url(key.p)) : undefined,
      q: key.q ? os2ip(encode5.base64url(key.q)) : undefined,
      dp: key.dp ? os2ip(encode5.base64url(key.dp)) : undefined,
      dq: key.dq ? os2ip(encode5.base64url(key.dq)) : undefined,
      qi: key.qi ? os2ip(encode5.base64url(key.qi)) : undefined,
      length: get_key_size(n)
  };
}
function rsa_import_pem_cert(key) {
  const trimmedKey = key.substr(27, key.length - 53);
  const parseKey = ber_simple(ber_decode(base64_to_binary(trimmedKey)));
  return {
      length: get_key_size(parseKey[0][5][1][0][0]),
      n: parseKey[0][5][1][0][0],
      e: parseKey[0][5][1][0][1]
  };
}
function rsa_import_pem_private(key) {
  const trimmedKey = key.substr(31, key.length - 61);
  const parseKey = ber_simple(ber_decode(base64_to_binary(trimmedKey)));
  return {
      n: parseKey[1],
      d: parseKey[3],
      e: parseKey[2],
      p: parseKey[4],
      q: parseKey[5],
      dp: parseKey[6],
      dq: parseKey[7],
      qi: parseKey[8],
      length: get_key_size(parseKey[1])
  };
}
function rsa_import_pem_private_pkcs8(key) {
  const trimmedKey = key.substr(27, key.length - 57);
  const parseWrappedKey = ber_simple(ber_decode(base64_to_binary(trimmedKey)));
  const parseKey = ber_simple(ber_decode(parseWrappedKey[2]));
  return {
      n: parseKey[1],
      d: parseKey[3],
      e: parseKey[2],
      p: parseKey[4],
      q: parseKey[5],
      dp: parseKey[6],
      dq: parseKey[7],
      qi: parseKey[8],
      length: get_key_size(parseKey[1])
  };
}
function rsa_import_pem_public(key) {
  const trimmedKey = key.substr(26, key.length - 51);
  const parseKey = ber_simple(ber_decode(base64_to_binary(trimmedKey)));
  return {
      length: get_key_size(parseKey[1][0][0]),
      n: parseKey[1][0][0],
      e: parseKey[1][0][1]
  };
}
function rsa_import_pem(key) {
  if (typeof key !== "string") throw new TypeError("PEM key must be string");
  const trimmedKey = key.trim();
  const maps = [
      [
          "-----BEGIN RSA PRIVATE KEY-----",
          rsa_import_pem_private
      ],
      [
          "-----BEGIN PRIVATE KEY-----",
          rsa_import_pem_private_pkcs8
      ],
      [
          "-----BEGIN PUBLIC KEY-----",
          rsa_import_pem_public
      ],
      [
          "-----BEGIN CERTIFICATE-----",
          rsa_import_pem_cert
      ],
  ];
  for (const [prefix, func] of maps){
      if (trimmedKey.indexOf(prefix) === 0) return func(trimmedKey);
  }
  throw new TypeError("Unsupported key format");
}
function rsa_import_key(key, format) {
  const finalFormat = format === "auto" ? detect_format(key) : format;
  if (finalFormat === "jwk") return rsa_import_jwk(key);
  if (finalFormat === "pem") return rsa_import_pem(key);
  throw new TypeError("Unsupported key format");
}
function createSizeBuffer(size) {
  if (size <= 127) return new Uint8Array([
      size
  ]);
  const bytes = [];
  while(size > 0){
      bytes.push(size & 0xff);
      size = size >> 8;
  }
  bytes.reverse();
  return new Uint8Array([
      0x80 + bytes.length,
      ...bytes
  ]);
}
class BER {
  static createSequence(children) {
      const size = children.reduce((accumlatedSize, child)=>accumlatedSize + child.length
      , 0);
      return new Uint8Array([
          0x30,
          ...createSizeBuffer(size),
          ...children.reduce((buffer, child)=>[
                  ...buffer,
                  ...child
              ]
          , []),
      ]);
  }
  static createNull() {
      return new Uint8Array([
          0x05,
          0x00
      ]);
  }
  static createBoolean(value) {
      return new Uint8Array([
          0x01,
          0x01,
          value ? 0x01 : 0x00
      ]);
  }
  static createInteger(value) {
      if (typeof value === "number") return BER.createBigInteger(BigInt(value));
      return BER.createBigInteger(value);
  }
  static createBigInteger(value) {
      if (value === 0n) return new Uint8Array([
          0x02,
          0x01,
          0x00
      ]);
      const isNegative = value < 0;
      const content = [];
      let n = isNegative ? -value : value;
      while(n > 0n){
          content.push(Number(n & 255n));
          n = n >> 8n;
      }
      if (!isNegative) {
          if (content[content.length - 1] & 0x80) content.push(0x00);
      } else {
          for(let i38 = 0; i38 < content.length; i38++)content[i38] = 256 - content[i38];
          if (!(content[content.length - 1] & 0x80)) content.push(0xff);
      }
      content.reverse();
      return new Uint8Array([
          0x02,
          ...createSizeBuffer(content.length),
          ...content,
      ]);
  }
  static createBitString(value) {
      return new Uint8Array([
          0x03,
          ...createSizeBuffer(value.length + 1),
          0x00,
          ...value,
      ]);
  }
}
function add_line_break(base64_str) {
  const lines = [];
  for(let i39 = 0; i39 < base64_str.length; i39 += 64){
      lines.push(base64_str.substr(i39, 64));
  }
  return lines.join("\n");
}
function rsa_export_pkcs8_public(key) {
  const content = BER.createSequence([
      BER.createSequence([
          new Uint8Array([
              0x06,
              0x09,
              0x2a,
              0x86,
              0x48,
              0x86,
              0xf7,
              0x0d,
              0x01,
              0x01,
              0x01,
          ]),
          BER.createNull(),
      ]),
      BER.createBitString(BER.createSequence([
          BER.createInteger(key.n),
          BER.createInteger(key.e || 0n),
      ])),
  ]);
  return "-----BEGIN PUBLIC KEY-----\n" + add_line_break(encode5.binary(content).base64()) + "\n-----END PUBLIC KEY-----\n";
}
function rsa_export_pkcs8_private(key) {
  const content = BER.createSequence([
      BER.createInteger(0),
      BER.createInteger(key.n),
      BER.createInteger(key.e || 0n),
      BER.createInteger(key.d || 0n),
      BER.createInteger(key.p || 0n),
      BER.createInteger(key.q || 0n),
      BER.createInteger(key.dp || 0n),
      BER.createInteger(key.dq || 0n),
      BER.createInteger(key.qi || 0n),
  ]);
  const ber = encode5.binary(content).base64();
  return "-----BEGIN RSA PRIVATE KEY-----\n" + add_line_break(ber) + "\n-----END RSA PRIVATE KEY-----\n";
}
class RSAKey {
  n;
  e;
  d;
  p;
  q;
  dp;
  dq;
  qi;
  length;
  constructor(params){
      this.n = params.n;
      this.e = params.e;
      this.d = params.d;
      this.p = params.p;
      this.q = params.q;
      this.dp = params.dp;
      this.dq = params.dq;
      this.qi = params.qi;
      this.length = params.length;
  }
  pem() {
      if (this.d) {
          return rsa_export_pkcs8_private(this);
      } else {
          return rsa_export_pkcs8_public(this);
      }
  }
  jwk() {
      let jwk = {
          kty: "RSA",
          n: encode5.bigint(this.n).base64url()
      };
      if (this.d) jwk = {
          ...jwk,
          d: encode5.bigint(this.d).base64url()
      };
      if (this.e) jwk = {
          ...jwk,
          e: encode5.bigint(this.e).base64url()
      };
      if (this.p) jwk = {
          ...jwk,
          p: encode5.bigint(this.p).base64url()
      };
      if (this.q) jwk = {
          ...jwk,
          q: encode5.bigint(this.q).base64url()
      };
      if (this.dp) jwk = {
          ...jwk,
          dp: encode5.bigint(this.dp).base64url()
      };
      if (this.dq) jwk = {
          ...jwk,
          dq: encode5.bigint(this.dq).base64url()
      };
      if (this.qi) jwk = {
          ...jwk,
          qi: encode5.bigint(this.qi).base64url()
      };
      return jwk;
  }
}
function computeMessage(m) {
  return typeof m === "string" ? new TextEncoder().encode(m) : m;
}
function computeOption(options) {
  return {
      hash: "sha1",
      padding: "oaep",
      ...options
  };
}
class RSA {
  key;
  constructor(key){
      this.key = key;
  }
  async encrypt(m, options) {
      const computedOption = computeOption(options);
      const func = WebCryptoRSA.isSupported(computedOption) ? WebCryptoRSA.encrypt : PureRSA.encrypt;
      return new RawBinary(await func(this.key, computeMessage(m), computedOption));
  }
  async decrypt(m, options) {
      const computedOption = computeOption(options);
      const func = WebCryptoRSA.isSupported(computedOption) ? WebCryptoRSA.decrypt : PureRSA.decrypt;
      return new RawBinary(await func(this.key, m, computedOption));
  }
  async verify(signature, message, options) {
      const computedOption = {
          algorithm: "rsassa-pkcs1-v1_5",
          hash: "sha256",
          ...options
      };
      return await PureRSA.verify(this.key, signature, computeMessage(message), computedOption);
  }
  async sign(message, options) {
      const computedOption = {
          algorithm: "rsassa-pkcs1-v1_5",
          hash: "sha256",
          ...options
      };
      return await PureRSA.sign(this.key, computeMessage(message), computedOption);
  }
  static parseKey(key, format = "auto") {
      return this.importKey(key, format);
  }
  static importKey(key, format = "auto") {
      return new RSAKey(rsa_import_key(key, format));
  }
}
function assertNever(alg, message) {
  throw new RangeError(message);
}
function safeCompare(a, b) {
  const strA = String(a);
  const lenA = strA.length;
  let strB = String(b);
  let result = 0;
  if (lenA !== strB.length) {
      strB = strA;
      result = 1;
  }
  for(let i40 = 0; i40 < lenA; i40++){
      result |= strA.charCodeAt(i40) ^ strB.charCodeAt(i40);
  }
  return result === 0;
}
async function encrypt(algorithm, key, message) {
  switch(algorithm){
      case "none":
          return "";
      case "HS256":
          return new HmacSha256(key).update(message).toString();
      case "HS512":
          return new HmacSha512(key).update(message).toString();
      case "RS256":
          return (await new RSA(RSA.parseKey(key)).sign(message, {
              algorithm: "rsassa-pkcs1-v1_5",
              hash: "sha256"
          })).hex();
      case "RS512":
          return (await new RSA(RSA.parseKey(key)).sign(message, {
              algorithm: "rsassa-pkcs1-v1_5",
              hash: "sha512"
          })).hex();
      case "PS256":
          return (await new RSA(RSA.parseKey(key)).sign(message, {
              algorithm: "rsassa-pss",
              hash: "sha256"
          })).hex();
      case "PS512":
          return (await new RSA(RSA.parseKey(key)).sign(message, {
              algorithm: "rsassa-pss",
              hash: "sha512"
          })).hex();
      default:
          assertNever(algorithm, "no matching crypto algorithm in the header: " + algorithm);
  }
}
async function verify({ signature , key , algorithm , signingInput  }) {
  try {
      switch(algorithm){
          case "none":
          case "HS256":
          case "HS512":
              {
                  return safeCompare(signature, await encrypt(algorithm, key, signingInput));
              }
          case "RS256":
              {
                  return await new RSA(RSA.parseKey(key)).verify(decodeString(signature), signingInput, {
                      algorithm: "rsassa-pkcs1-v1_5",
                      hash: "sha256"
                  });
              }
          case "RS512":
              {
                  return await new RSA(RSA.parseKey(key)).verify(decodeString(signature), signingInput, {
                      algorithm: "rsassa-pkcs1-v1_5",
                      hash: "sha512"
                  });
              }
          case "PS256":
              {
                  return await new RSA(RSA.parseKey(key)).verify(decodeString(signature), signingInput, {
                      algorithm: "rsassa-pss",
                      hash: "sha256"
                  });
              }
          case "PS512":
              {
                  return await new RSA(RSA.parseKey(key)).verify(decodeString(signature), signingInput, {
                      algorithm: "rsassa-pss",
                      hash: "sha512"
                  });
              }
          default:
              assertNever(algorithm, "no matching crypto algorithm in the header: " + algorithm);
      }
  } catch (err) {
      throw err instanceof Error ? err : new Error(err);
  }
}
function verify1(algorithm, jwtAlg) {
  return Array.isArray(algorithm) ? algorithm.includes(jwtAlg) : algorithm === jwtAlg;
}
new TextEncoder();
const decoder2 = new TextDecoder();
function isExpired(exp, leeway = 0) {
  return exp + leeway < Date.now() / 1000;
}
function isTooEarly(nbf, leeway = 0) {
  return nbf - leeway > Date.now() / 1000;
}
function isObject(obj) {
  return obj !== null && typeof obj === "object" && Array.isArray(obj) === false;
}
function hasInvalidTimingClaims(...claimValues) {
  return claimValues.some((claimValue)=>claimValue !== undefined ? typeof claimValue !== "number" : false
  );
}
function decode5(jwt) {
  const [header, payload, signature] = jwt.split(".").map(mod.decode).map((uint8Array, index)=>{
      switch(index){
          case 0:
          case 1:
              try {
                  return JSON.parse(decoder2.decode(uint8Array));
              } catch  {
                  break;
              }
          case 2:
              return encodeToString(uint8Array);
      }
      throw TypeError("The serialization is invalid.");
  });
  if (typeof signature !== "string") {
      throw new Error(`The signature is missing.`);
  }
  if (typeof header?.alg !== "string") {
      throw new Error(`The header 'alg' parameter must be a string.`);
  }
  if (!isObject(payload)) {
      throw new Error(`The jwt claims set is not a JSON object.`);
  }
  if (hasInvalidTimingClaims(payload.exp, payload.nbf)) {
      throw new Error(`The jwt has an invalid 'exp' or 'nbf' claim.`);
  }
  if (typeof payload.exp === "number" && isExpired(payload.exp, 1)) {
      throw RangeError("The jwt is expired.");
  }
  if (typeof payload.nbf === "number" && isTooEarly(payload.nbf, 1)) {
      throw RangeError("The jwt is used too early.");
  }
  return {
      header,
      payload,
      signature
  };
}
async function verify2(jwt, key, algorithm) {
  const { header , payload , signature  } = decode5(jwt);
  if (!verify1(algorithm, header.alg)) {
      throw new Error(`The jwt's algorithm does not match the specified algorithm '${algorithm}'.`);
  }
  if ("crit" in header) {
      throw new Error("The 'crit' header parameter is currently not supported by this module.");
  }
  if (!await verify({
      signature,
      key,
      algorithm: header.alg,
      signingInput: jwt.slice(0, jwt.lastIndexOf("."))
  })) {
      throw new Error("The jwt's signature does not match the verification signature.");
  }
  return payload;
}

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
});

async function handleRequest(request) {
  const accessToken = request.headers.get('accessToken');
  const {sub, email} = await verify2(accessToken, JWT_SECRET, "HS256");
  return new Response(JSON.stringify({sub, email}), {
    headers: {
      'content-type': 'application/json;charset=UTF-8'
    }
  });
}
