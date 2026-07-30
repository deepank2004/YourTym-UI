const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'content-encoding',
  'transfer-encoding',
  'host',
]);

const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'authorization',
  'cache-control',
  'content-type',
  'if-match',
  'if-none-match',
];

export const config = {
  api: { bodyParser: false },
};

function requestPath(req) {
  const value = req.query?.path;
  const segments = Array.isArray(value) ? value : value ? [value] : [];
  return `/${segments.map((segment) => encodeURIComponent(String(segment))).join('/')}`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function upstreamUrl(req) {
  const configuredOrigin = process.env.YOURTYM_API_BASE_URL || process.env.VITE_API_BASE_URL;
  if (!configuredOrigin) throw new Error('YOURTYM_API_BASE_URL is not configured.');

  const target = new URL(requestPath(req), configuredOrigin);
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === 'path' || value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value]) target.searchParams.append(key, String(entry));
  }
  return target;
}

export default async function handler(req, res) {
  if (!['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const headers = new Headers();
    for (const name of FORWARDED_REQUEST_HEADERS) {
      const value = req.headers[name];
      if (value) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }

    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req);
    const upstream = await fetch(upstreamUrl(req), {
      method: req.method,
      headers,
      body: body?.length ? body : undefined,
    });

    res.status(upstream.status);
    upstream.headers.forEach((value, name) => {
      if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) res.setHeader(name, value);
    });

    const responseBody = Buffer.from(await upstream.arrayBuffer());
    return res.send(responseBody);
  } catch (error) {
    return res.status(502).json({ message: error?.message || 'Upstream API unavailable.' });
  }
}
