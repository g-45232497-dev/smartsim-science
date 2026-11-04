
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return json(405, { error: "Kaedah tidak dibenarkan." });
  }

  try {
    const body = await request.json();
    const task = body.task;

    if (!["tutor", "analysis"].includes(task)) {
      return json(400, { error: "Jenis tugasan tidak sah." });
    }

    const system = `Anda ialah SMART AI Tutor, pembantu pendidikan Sains Tingkatan 2 dalam Bahasa Melayu Malaysia. Fokus: Bab Asid dan Alkali. Terangkan secara tepat, mesra pelajar dan sesuai umur sekolah. Bezakan fakta eksperimen daripada nilai simulasi. Jangan dakwa nilai simulasi sebagai bacaan makmal sebenar. Jawapan ringkas, tersusun dan membantu pembelajaran.`;

    let userPrompt;

    if (task === "tutor") {
      const question = String(body.question || "").slice(0, 2000);

      if (!question.trim()) {
        return json(400, { error: "Soalan kosong." });
      }

      userPrompt = `Soalan pelajar: ${question}
Konteks eksperimen: ${JSON.stringify(body.context || {})}
Jawab dalam Bahasa Melayu dan berikan satu soalan susulan ringkas jika sesuai.`;
    } else {
      const records = Array.isArray(body.records)
        ? body.records.slice(0, 30)
        : [];

      if (!records.length) {
        return json(400, {
          error: "Tiada rekod eksperimen untuk dianalisis."
        });
      }

      userPrompt = `Analisis data SIMULASI Sains Tingkatan 2: ${JSON.stringify(records)}.
Berikan pola data, tafsiran saintifik, semakan hipotesis, kesimpulan dan cadangan penambahbaikan. Tegaskan bahawa data ialah data simulasi.`;
    }

    const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();

    if (provider !== "gemini") {
      return json(500, {
        error: "AI_PROVIDER perlu ditetapkan kepada gemini."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return json(503, {
        error: "GEMINI_API_KEY belum ditetapkan."
      });
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: system }]
          },
          contents: [{
            role: "user",
            parts: [{ text: userPrompt }]
          }],
          generationConfig: {
            maxOutputTokens: 700,
            temperature: 0.4
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json(502, {
        error: data.error?.message || "Gemini gagal memproses permintaan."
      });
    }

    const answer = (data.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || "")
      .join("\n");

    if (!answer) {
      return json(502, {
        error: "Gemini tidak memulangkan jawapan."
      });
    }

    return json(200, {
      answer,
      provider: "gemini",
      generative: true
    });

  } catch (error) {
    return json(500, {
      error: "Ralat backend: " + error.message
    });
  }
};

