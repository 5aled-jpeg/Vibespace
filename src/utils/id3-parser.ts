/**
 * ID3 Tag & Metadata Parser for Audio Files
 * Extracts Title, Artist, and embedded APIC album art from MP3 binaries.
 * Provides fallback to filename and procedural gradients.
 */

export interface ExtractedAudioMeta {
  title: string;
  artist: string;
  coverUrl: string;
  hasEmbeddedCover: boolean;
}

/**
 * Strips file extension to produce a clean default title
 */
export function cleanFileName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '').trim();
}

/**
 * Generates a vibrant, randomized Apple/visionOS gradient cover art SVG data URI
 */
export function createRandomGradientCover(seed?: number | string): string {
  const palettes = [
    ['#8A2387', '#E94057', '#F27121'], // Sunset Berry
    ['#00c6ff', '#0072ff'],           // Electric Neon Blue
    ['#f857a6', '#ff5858'],           // Rose Crimson
    ['#4776E6', '#8E54E9'],           // Royal Indigo
    ['#11998e', '#38ef7d'],           // Mint Emerald
    ['#FC466B', '#3F5EFB'],           // Purple Coral
    ['#fa709a', '#fee140'],           // Golden Peach
    ['#30cfd0', '#330867'],           // Cyber Deep
    ['#ff0844', '#ffb199'],           // Fire Aura
    ['#667eea', '#764ba2'],           // Mystic Violet
  ];

  let numSeed: number | undefined;
  if (typeof seed === 'string') {
    numSeed = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  } else {
    numSeed = seed;
  }

  const idx =
    numSeed !== undefined
      ? Math.abs(numSeed) % palettes.length
      : Math.floor(Math.random() * palettes.length);

  const colors = palettes[idx];
  const stops = colors
    .map(
      (c, i) =>
        `<stop offset="${Math.round(
          (i / (colors.length - 1)) * 100
        )}%" stop-color="${c}"/>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      ${stops}
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
  <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1.5"/>
  <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
  <circle cx="200" cy="200" r="80" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
  <circle cx="200" cy="200" r="48" fill="rgba(0,0,0,0.4)"/>
  <circle cx="200" cy="200" r="20" fill="rgba(0,0,0,0.85)"/>
  <circle cx="200" cy="200" r="8" fill="#ffffff" opacity="0.9"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Extracts metadata (Title, Artist, APIC cover art) from an MP3 File.
 */
export async function extractAudioMetadata(file: File): Promise<ExtractedAudioMeta> {
  const defaultTitle = cleanFileName(file.name);
  const defaultArtist = 'Local Artist';
  let title = defaultTitle;
  let artist = defaultArtist;
  let coverUrl: string | null = null;
  let hasEmbeddedCover = false;

  try {
    // Read first 512KB to parse ID3v2 header and frames
    const slice = file.slice(0, 512 * 1024);
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);

    // Verify "ID3" identifier
    if (
      buffer.byteLength >= 10 &&
      view.getUint8(0) === 0x49 &&
      view.getUint8(1) === 0x44 &&
      view.getUint8(2) === 0x33
    ) {
      const version = view.getUint8(3); // 3 for ID3v2.3, 4 for ID3v2.4
      // Tag size is stored in 4 syncsafe bytes (7 bits per byte)
      const tagSize =
        ((view.getUint8(6) & 0x7f) << 21) |
        ((view.getUint8(7) & 0x7f) << 14) |
        ((view.getUint8(8) & 0x7f) << 7) |
        (view.getUint8(9) & 0x7f);

      let offset = 10;
      const end = Math.min(buffer.byteLength, 10 + tagSize);

      while (offset + 10 < end) {
        // Frame ID (4 ASCII characters)
        const frameId = String.fromCharCode(
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3)
        );

        if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

        let frameSize = 0;
        if (version === 4) {
          // Syncsafe integer in v2.4
          frameSize =
            ((view.getUint8(offset + 4) & 0x7f) << 21) |
            ((view.getUint8(offset + 5) & 0x7f) << 14) |
            ((view.getUint8(offset + 6) & 0x7f) << 7) |
            (view.getUint8(offset + 7) & 0x7f);
        } else {
          // Normal 32-bit integer in v2.3
          frameSize = view.getUint32(offset + 4);
        }

        offset += 10; // Skip frame header

        if (frameSize <= 0 || offset + frameSize > buffer.byteLength) break;

        // TIT2 = Title
        if (frameId === 'TIT2') {
          const encoding = view.getUint8(offset);
          const data = new Uint8Array(buffer, offset + 1, frameSize - 1);
          const decoded = decodeId3String(data, encoding);
          if (decoded.trim()) title = decoded.trim();
        }
        // TPE1 = Artist
        else if (frameId === 'TPE1') {
          const encoding = view.getUint8(offset);
          const data = new Uint8Array(buffer, offset + 1, frameSize - 1);
          const decoded = decodeId3String(data, encoding);
          if (decoded.trim()) artist = decoded.trim();
        }
        // APIC = Attached Picture (Album Cover)
        else if (frameId === 'APIC') {
          try {
            let picOffset = offset;
            const encoding = view.getUint8(picOffset++);
            // Read MIME type (null-terminated ASCII)
            let mime = '';
            while (picOffset < offset + frameSize && view.getUint8(picOffset) !== 0) {
              mime += String.fromCharCode(view.getUint8(picOffset++));
            }
            picOffset++; // Skip null byte
            // Skip picture type byte (e.g. 0x03 for front cover)
            picOffset++;

            // Skip description string (null-terminated)
            if (encoding === 1 || encoding === 2) {
              // UTF-16 with 2-byte null terminator
              while (picOffset + 1 < offset + frameSize) {
                if (view.getUint8(picOffset) === 0 && view.getUint8(picOffset + 1) === 0) {
                  picOffset += 2;
                  break;
                }
                picOffset += 2;
              }
            } else {
              // 8-bit null terminator
              while (picOffset < offset + frameSize && view.getUint8(picOffset) !== 0) {
                picOffset++;
              }
              picOffset++;
            }

            const imgBytes = new Uint8Array(
              buffer,
              picOffset,
              offset + frameSize - picOffset
            );
            if (imgBytes.length > 0) {
              const mimeType = mime || 'image/jpeg';
              const blob = new Blob([imgBytes], { type: mimeType });
              coverUrl = URL.createObjectURL(blob);
              hasEmbeddedCover = true;
            }
          } catch {
            // Ignore APIC parsing error, fallback to default
          }
        }

        offset += frameSize;
      }
    }
  } catch {
    // If parsing fails, cleanly fall back to defaults
  }

  // If no embedded cover art found, generate a procedural gradient cover
  if (!coverUrl) {
    coverUrl = createRandomGradientCover();
  }

  return { title, artist, coverUrl, hasEmbeddedCover };
}

function decodeId3String(data: Uint8Array, encoding: number): string {
  try {
    if (encoding === 1 || encoding === 2) {
      return new TextDecoder('utf-16').decode(data).replace(/\0/g, '');
    } else if (encoding === 3) {
      return new TextDecoder('utf-8').decode(data).replace(/\0/g, '');
    } else {
      return new TextDecoder('iso-8859-1').decode(data).replace(/\0/g, '');
    }
  } catch {
    return '';
  }
}
