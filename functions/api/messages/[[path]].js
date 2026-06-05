export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;
  const url = new URL(request.url);

  const user = await env.DB.prepare('SELECT pharmacy_id FROM users WHERE id = ?')
    .bind(userId).first();
  if (!user) {
    return new Response(JSON.stringify({ error: '用户不存在' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  // GET /api/messages?since=ISO_TIMESTAMP
  if (request.method === 'GET') {
    const since = url.searchParams.get('since') || '1970-01-01T00:00:00Z';
    const messages = await env.DB.prepare(
      `SELECT m.*, u.nickname as sender_name, u.avatar as sender_avatar
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.pharmacy_id = ? AND m.created_at > ?
       ORDER BY m.created_at ASC LIMIT 100`
    ).bind(user.pharmacy_id, since).all();
    return new Response(JSON.stringify(messages.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // POST /api/messages
  if (request.method === 'POST') {
    const { content } = await request.json();
    if (!content || !content.trim()) {
      return new Response(JSON.stringify({ error: '消息不能为空' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
    const msgId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO messages (id, pharmacy_id, sender_id, type, content) VALUES (?, ?, ?, ?, ?)'
    ).bind(msgId, user.pharmacy_id, userId, 'text', content.trim()).run();
    return new Response(JSON.stringify({ id: msgId }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { 'Content-Type': 'application/json' }
  });
}
