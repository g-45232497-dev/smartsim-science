const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

const json = (statusCode, body) => ({ statusCode, headers: corsHeaders, body: JSON.stringify(body) });

export default async (request) => {
  if (request.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (request.httpMethod !== 'POST') return json(405, { error: 'Kaedah tidak dibenarkan.' });

  try {
    const body = JSON.parse(request.body || '{}');
    const task = body.task;
    if (!['tutor', 'analysis'].includes(task)) return json(400, { error: 'Jenis tugasan tidak sah.' });

    const system = `Anda ialah SMART AI Tutor, pembantu pendidikan Sains Tingkatan 2 dalam Bahasa Melayu Malaysia. Fokus: Bab Asid dan Alkali. Terangkan secara tepat, mesra pelajar dan sesuai umur sekolah. Bezakan fakta eksperimen daripada nilai simulasi. Jangan dakwa nilai simulasi sebagai bacaan makmal sebenar. Jangan beri nasihat mencuba bahan kimia berbahaya. Jika tidak pasti, nyatakan batasan. Jawapan ringkas, tersusun dan membantu pembelajaran.`;
    let userPrompt;
    if (task === 'tutor') {
      const question = String(body.question || '').slice(0, 2000);
      if (!question.trim()) return json(400, { error: 'Soalan kosong.' });
      userPrompt = `Soalan pelajar: ${question}\nKonteks eksperimen semasa (jika ada): ${JSON.stringify(body.context || {})}\nJawab soalan dan berikan satu soalan susulan ringkas jika sesuai.`;
    } else {
      const records = Array.isArray(body.records) ? body.records.slice(0, 30) : [];
      if (!records.length) return json(400, { error: 'Tiada rekod eksperimen untuk dianalisis.' });
      userPrompt = `Analisis rekod SIMULASI berikut untuk topik ${String(body.topic || 'Asid dan Alkali').slice(0,100)}. Data: ${JSON.stringify(records)}. Berikan: (1) pola data, (2) tafsiran saintifik, (3) semakan hipotesis jika tersedia, (4) kesimpulan, (5) satu cadangan penambahbaikan eksperimen. Tegaskan bahawa data ialah data simulasi.`;
    }

    const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    let answer = '';
    if (provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) return json(503, { error: 'OPENAI_API_KEY belum ditetapkan pada backend.' });
      const model = process.env.OPENAI_MODEL || 'gpt-6-mini';
      const r = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST', headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, instructions: system, input: userPrompt, max_output_tokens: 700 })
      });
      const data = await r.json();
      if (!r.ok) return json(502, { error: data.error?.message || 'Penyedia OpenAI tidak dapat memproses permintaan.' });
      answer = data.output_text || (data.output || []).flatMap(x => x.content || []).map(x => x.text || '').join('\n');
    } else if (provider === 'gemini') {
      if (!process.env.GEMINI_API_KEY) return json(503, { error: 'GEMINI_API_KEY belum ditetapkan pada backend.' });
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: userPrompt }] }], generationConfig: { maxOutputTokens: 700, temperature: 0.4 } })
      });
      const data = await r.json();
      if (!r.ok) return json(502, { error: data.error?.message || 'Penyedia Gemini tidak dapat memproses permintaan.' });
      answer = (data.candidates?.[0]?.content?.parts || []).map(x => x.text || '').join('\n');
    } else return json(500, { error: 'AI_PROVIDER mesti ditetapkan kepada gemini atau openai.' });

    if (!answer) return json(502, { error: 'Model AI tidak memulangkan teks jawapan.' });
    return json(200, { answer, provider, generative: true });
  } catch (error) {
    return json(400, { error: 'Permintaan tidak dapat diproses. Semak format data dan cuba lagi.' });
  }
};
