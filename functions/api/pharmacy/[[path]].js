// functions/api/pharmacy (Cloudflare Pages Functions v2 - [[path]].js)
// Pharmacy creation, joining, and info API

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/pharmacy/create') {
      const { nickname, avatar } = await request.json();
      const pharmacyId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      await env.DB.prepare(
        'INSERT INTO pharmacies (id, invite_code, invite_expires_at) VALUES (?, ?, datetime("now", "+7 days"))'
      ).bind(pharmacyId, inviteCode).run();

      await env.DB.prepare(
        'INSERT INTO users (id, pharmacy_id, nickname, avatar, is_creator) VALUES (?, ?, ?, ?, 1)'
      ).bind(userId, pharmacyId, nickname, avatar || '😊').run();

      const token = await generateToken(userId);

      return new Response(JSON.stringify({ pharmacyId, userId, nickname, inviteCode, token }), {
        headers: { 'Content-Type': 'application/json' }
      });
  }

  if (path === '/api/pharmacy/join') {
      const { nickname, inviteCode, avatar } = await request.json();

      const pharmacy = await env.DB.prepare(
        'SELECT id FROM pharmacies WHERE invite_code = ? AND invite_expires_at > datetime("now")'
      ).bind(inviteCode.toUpperCase()).first();

      if (!pharmacy) {
        return new Response(JSON.stringify({ error: '邀请码无效或已过期' }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        });
      }

      const userCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM users WHERE pharmacy_id = ?'
      ).bind(pharmacy.id).first();

      if (userCount.count >= 2) {
        return new Response(JSON.stringify({ error: '该药局已有两人，无法加入' }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        });
      }

      const userId = crypto.randomUUID();
      await env.DB.prepare(
        'INSERT INTO users (id, pharmacy_id, nickname, avatar, is_creator) VALUES (?, ?, ?, ?, 0)'
      ).bind(userId, pharmacy.id, nickname, avatar || '😊').run();

      const token = await generateToken(userId);

      return new Response(JSON.stringify({ pharmacyId: pharmacy.id, userId, nickname, token }), {
        headers: { 'Content-Type': 'application/json' }
      });
  }

  if (path === '/api/pharmacy/info') {
    const { userId } = context.data;
    const user = await env.DB.prepare(
      `SELECT u.id, u.nickname, u.avatar, u.is_creator, u.pharmacy_id, p.invite_code,
              (SELECT json_group_array(json_object('id', u2.id, 'nickname', u2.nickname, 'avatar', u2.avatar))
               FROM users u2 WHERE u2.pharmacy_id = u.pharmacy_id) as members
       FROM users u JOIN pharmacies p ON u.pharmacy_id = p.id WHERE u.id = ?`
    ).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({ error: '用户不存在' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/pharmacy/update') {
    const { nickname, avatar } = await request.json();
    const { userId } = context.data;
    if (!nickname && !avatar) {
      return new Response(JSON.stringify({ error: '没有可更新的字段' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
    if (nickname) {
      await env.DB.prepare('UPDATE users SET nickname = ? WHERE id = ?').bind(nickname, userId).run();
    }
    if (avatar) {
      await env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(avatar, userId).run();
    }
    return new Response(JSON.stringify({ ok: true, nickname, avatar }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { 'Content-Type': 'application/json' }
  });
}

// Helper: generate a simple JWT-like token
async function generateToken(userId) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: userId, iat: Math.floor(Date.now()/1000) }));
  const signature = btoa(header + '.' + payload);
  return header + '.' + payload + '.' + signature;
}
