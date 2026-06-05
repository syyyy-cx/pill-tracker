export async function onRequest(context) {
  const { request, env } = context;
  const { userId } = context.data;

  // Get current user and partner info
  const user = await env.DB.prepare(
    `SELECT u.*, u2.nickname as partner_name, u2.id as partner_id
     FROM users u
     LEFT JOIN users u2 ON u2.pharmacy_id = u.pharmacy_id AND u2.id != u.id
     WHERE u.id = ?`
  ).bind(userId).first();

  if (!user) {
    return new Response(JSON.stringify({ error: '用户不存在' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const today = new Date().toISOString().split('T')[0];

  // Get today's check-in stats
  const myCheckins = await env.DB.prepare(
    `SELECT status, COUNT(*) as count FROM check_ins
     WHERE user_id = ? AND date = ? GROUP BY status`
  ).bind(userId, today).all();

  const myTotal = myCheckins.results.reduce((s, r) => s + r.count, 0);
  const myOntime = myCheckins.results.find(r => r.status === 'ontime')?.count || 0;
  const myLate = myCheckins.results.find(r => r.status === 'late')?.count || 0;

  let partnerData = {};
  if (user.partner_id) {
    const partnerCheckins = await env.DB.prepare(
      `SELECT status, COUNT(*) as count FROM check_ins
       WHERE user_id = ? AND date = ? GROUP BY status`
    ).bind(user.partner_id, today).all();
    partnerData = {
      total: partnerCheckins.results.reduce((s, r) => s + r.count, 0),
      ontime: partnerCheckins.results.find(r => r.status === 'ontime')?.count || 0
    };
  }

  // Get consecutive days
  const streak = await getStreak(env, userId);

  // Generate AI encouragement
  const message = await generateAIMessage(env, user, myTotal, myOntime, myLate, partnerData, streak);

  // Save to messages
  await env.DB.prepare(
    `INSERT INTO messages (id, pharmacy_id, sender_id, type, content)
     VALUES (?, ?, NULL, 'ai_encourage', ?)`
  ).bind(crypto.randomUUID(), user.pharmacy_id, message).run();

  return new Response(JSON.stringify({ message }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getStreak(env, userId) {
  const checkins = await env.DB.prepare(
    `SELECT DISTINCT date FROM check_ins
     WHERE user_id = ? AND status != 'missed'
     ORDER BY date DESC LIMIT 60`
  ).bind(userId).all();

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < checkins.results.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedDate = expected.toISOString().split('T')[0];
    if (checkins.results[i].date === expectedDate) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

async function generateAIMessage(env, user, myTotal, myOntime, myLate, partnerData, streak) {
  const apiKey = env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    // Fallback message if no API key configured
    const fallbacks = [
      `${user.nickname}，今天也辛苦了！记得照顾好自己 💕`,
      `${user.nickname}，你已经做得很棒了，继续加油哦 🌟`,
      `${user.nickname}，健康是给自己最好的礼物 🎁`,
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  const prompt = `你是一个温暖的朋友。根据以下数据生成一段 100 字以内的中文鼓励话语：

${user.nickname}：今天打卡 ${myTotal} 次（按时 ${myOntime} 次${myLate > 0 ? `，迟到 ${myLate} 次` : ''}）
${user.partner_name ? `${user.partner_name}：今天打卡 ${partnerData.total} 次（按时 ${partnerData.ontime} 次）` : ''}
连续打卡：${streak} 天

要求：温暖、亲切、个性化、不评价好坏、重在鼓励。用中文，语气像朋友一样自然。`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.8,
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '今天也辛苦了！继续加油哦 💪';
  } catch (err) {
    console.error('AI API error:', err);
    return '今天也辛苦了！继续加油哦 💪';
  }
}
