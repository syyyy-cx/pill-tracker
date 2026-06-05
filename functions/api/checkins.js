export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;
  const url = new URL(request.url);
  const path = url.pathname;

  const user = await env.DB.prepare('SELECT pharmacy_id FROM users WHERE id = ?')
    .bind(userId).first();
  if (!user) {
    return new Response(JSON.stringify({ error: '用户不存在' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  // GET today's check-ins
  if (request.method === 'GET' && path.endsWith('/today')) {
    const today = new Date().toISOString().split('T')[0];
    const checkins = await env.DB.prepare(
      'SELECT * FROM check_ins WHERE user_id = ? AND date = ?'
    ).bind(userId, today).all();
    return new Response(JSON.stringify(checkins.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // POST do check-in
  if (request.method === 'POST' && path.endsWith('/do')) {
    const { medicineId, message } = await request.json();
    const today = new Date().toISOString().split('T')[0];

    // Check not already checked in
    const existing = await env.DB.prepare(
      'SELECT id FROM check_ins WHERE medicine_id = ? AND user_id = ? AND date = ?'
    ).bind(medicineId, userId, today).first();
    if (existing) {
      return new Response(JSON.stringify({ error: '已打卡' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get medicine info
    const medicine = await env.DB.prepare('SELECT * FROM medicines WHERE id = ?')
      .bind(medicineId).first();
    if (!medicine) {
      return new Response(JSON.stringify({ error: '药品不存在' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine ontime/late
    const now = new Date();
    const curH = now.getHours(), curM = now.getMinutes();
    const curTotal = curH * 60 + curM;
    let status = 'ontime';

    if (medicine.schedule_type === 'fixed') {
      const [h, m] = (medicine.fixed_time || '00:00').split(':').map(Number);
      if (curTotal > h * 60 + m + 30) status = 'late';
    } else {
      const [h, m] = (medicine.flexible_deadline || '00:00').split(':').map(Number);
      if (curTotal > h * 60 + m) status = 'late';
    }

    const curTimeStr = `${String(curH).padStart(2,'0')}:${String(curM).padStart(2,'0')}`;
    const checkinId = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO check_ins (id, medicine_id, user_id, date, check_time, status, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(checkinId, medicineId, userId, today, curTimeStr, status, message || '').run();

    // If message, also add to messages
    if (message) {
      await env.DB.prepare(
        `INSERT INTO messages (id, pharmacy_id, sender_id, type, content)
         VALUES (?, ?, ?, 'checkin', ?)`
      ).bind(crypto.randomUUID(), user.pharmacy_id, userId,
        `💊 ${medicine.name} 打卡附言：${message}`).run();
    }

    return new Response(JSON.stringify({
      id: checkinId, medicineId, status, check_time: curTimeStr
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // GET check-in history for stats
  if (request.method === 'GET' && path.endsWith('/history')) {
    const period = parseInt(url.searchParams.get('period') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    const start = startDate.toISOString().split('T')[0];

    const history = await env.DB.prepare(
      `SELECT c.*, m.name as medicine_name FROM check_ins c
       JOIN medicines m ON c.medicine_id = m.id
       WHERE c.user_id = ? AND c.date >= ? ORDER BY c.date DESC, c.check_time DESC`
    ).bind(userId, start).all();

    return new Response(JSON.stringify(history.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { 'Content-Type': 'application/json' }
  });
}
