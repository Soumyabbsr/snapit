/**
 * Ordered keys for resolving a public HTTPS image URL from API/socket/FCM payloads.
 * Cloudinary-first pass prefers URLs served from cloudinary.com (typical: res.cloudinary.com).
 */
const PHOTO_IMAGE_URL_KEYS = [
  'cdnUrl',
  'imageUrl',
  'photoUrl',
  'url',
  'thumbnailUrl',
  'secure_url',
  'secureUrl',
];

const isDev =
  typeof __DEV__ !== 'undefined' &&
  __DEV__;

/**
 * @param {string} url
 * @returns {boolean}
 */
function isLikelyCloudinaryHttps(url) {
  if (url == null || typeof url !== 'string') return false;
  const t = url.trim().toLowerCase();
  return /^https?:\/\//i.test(t) && t.includes('cloudinary.com');
}

function logCandidate(key, raw, normalized) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`[resolvePhotoImageUri] field "${key}":`, raw, '->', normalized);
  }
}

/**
 * Picks a usable remote image URL from API/socket photo objects.
 * Prefers the first valid Cloudinary HTTPS URL (public delivery URLs).
 * Falls back to the first valid http(s) URL (protocol-relative `//` → https).
 * Also checks common nested shapes (e.g. image.url).
 */
export function resolvePhotoImageUri(photo) {
  if (!photo || typeof photo !== 'object') {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log('[resolvePhotoImageUri] invalid photo', photo);
    }
    return null;
  }

  const normalized = [];

  for (const key of PHOTO_IMAGE_URL_KEYS) {
    const raw = photo[key];
    const n = normalizeHttpUrl(raw);
    logCandidate(key, raw, n);
    if (n) normalized.push(n);
  }

  const nestedPickers = [
    ['image.url', () => photo.image?.url],
    ['image.secure_url', () => photo.image?.secure_url],
    ['image.secureUrl', () => photo.image?.secureUrl],
    ['media.url', () => photo.media?.url],
    ['asset.url', () => photo.asset?.url],
    ['urls.full', () => photo.urls?.full],
    ['urls.regular', () => photo.urls?.regular],
  ];
  for (const [label, pick] of nestedPickers) {
    let raw;
    try {
      raw = pick();
    } catch {
      raw = undefined;
    }
    const n = normalizeHttpUrl(raw);
    logCandidate(label, raw, n);
    if (n) normalized.push(n);
  }

  for (const n of normalized) {
    if (isLikelyCloudinaryHttps(n)) {
      if (isDev) {
        // eslint-disable-next-line no-console
        console.log('[resolvePhotoImageUri] picked Cloudinary:', n);
      }
      return n;
    }
  }

  const pick = normalized[0] ?? null;
  if (!pick) {
    let sample = '';
    try {
      sample = JSON.stringify(photo);
      if (sample.length > 2000) sample = `${sample.slice(0, 2000)}…`;
    } catch {
      sample = String(photo);
    }
    // eslint-disable-next-line no-console
    console.warn(
      '[resolvePhotoImageUri] no URL resolved. top-level keys:',
      Object.keys(photo),
      'raw sample:',
      sample
    );
  } else if (isDev) {
    // eslint-disable-next-line no-console
    console.log('[resolvePhotoImageUri] picked first https:', pick);
  }
  return pick;
}

export function normalizeHttpUrl(url) {
  if (url == null || typeof url !== 'string') return null;
  const t = url.trim();
  if (!t) return null;
  if (t.startsWith('//')) return `https:${t}`;
  if (/^https?:\/\//i.test(t)) return t;
  return null;
}
