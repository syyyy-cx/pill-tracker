// functions/api/medicines.js
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

  // GET - list active medicines
  if (request.method === 'GET') {
    const medicines = await env.DB.prepare(
      'SELECT * FROM medicines WHERE pharmacy_id = ? AND is_active = 1 ORDER BY created_at ASC'
    ).bind(user.pharmacy_id).all();
    return new Response(JSON.stringify(medicines.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // POST - add medicine
  if (request.method === 'POST') {
    const data = await request.json();
    const medicineId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO medicines (id, pharmacy_id, name, added_by, taken_by, schedule_type, fixed_time, flexible_deadline, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      medicineId, user.pharmacy_id, data.name, userId, data.takenBy,
      data.scheduleType, data.fixedTime || null, data.flexibleDeadline || null, data.note || ''
    ).run();
    return new Response(JSON.stringify({ id: medicineId }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // PUT - update medicine
  if (request.method === 'PUT') {
    const id = url.searchParams.get('id');
    const data = await request.json();
    await env.DB.prepare(
      `UPDATE medicines SET name=?, taken_by=?, schedule_type=?, fixed_time=?, flexible_deadline=?, note=?
       WHERE id=? AND pharmacy_id=?`
    ).bind(
      data.name, data.takenBy, data.scheduleType, data.fixedTime || null,
      data.flexibleDeadline || null, data.note || '', id, user.pharmacy_id
    ).run();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // DELETE - soft delete
  if (request.method === 'DELETE') {
    const id = url.searchParams.get('id');
    await env.DB.prepare('UPDATE medicines SET is_active = 0 WHERE id = ? AND pharmacy_id = ?')
      .bind(id, user.pharmacy_id).run();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { 'Content-Type': 'application/json' }
  });
}
