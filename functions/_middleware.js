// functions/_middleware.js
// Cloudflare Pages Functions middleware for CORS and JWT auth

async function generateToken(userId) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: userId, iat: Math.floor(Date.now()/1000) }));
  const signature = btoa(header + '.' + payload);
  return header + '.' + payload + '.' + signature;
}

async function verifyToken(token) {
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub;
  } catch { return null; }
}

export async function onRequest(context) {
  const { request, next } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);

  // Public routes (no auth required)
  if (url.pathname === '/api/pharmacy/create' || url.pathname === '/api/pharmacy/join') {
    const response = await next();
    Object.entries(corsHeaders).forEach(([k,v]) => response.headers.set(k,v));
    return response;
  }

  // All other routes require JWT auth
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '未认证' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const userId = await verifyToken(auth.slice(7));
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Token 无效' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Pass userId to downstream handlers
  context.data = { userId };
  const response = await next();
  Object.entries(corsHeaders).forEach(([k,v]) => response.headers.set(k,v));
  return response;
}
