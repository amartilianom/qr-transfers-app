import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are extracting data from a Colombian bank or digital-wallet transfer receipt image.
Return ONLY a JSON object with these fields:
- amount: the transferred amount as a number (no currency symbols, no dots/commas as thousands separators — just digits), or null if not found
- provider: the name of the bank or wallet as a short lowercase string (e.g. "nequi", "daviplata", "bancolombia", "nubank", "davivienda", "banco de bogota", "bbva", "scotiabank colpatria", etc.). Use the exact name as it appears on the receipt, lowercased. Return null if not identifiable.
- transaction_id: the reference/transaction/approval/authorization code as a string, or null
- occurred_at: the transaction date and time as an ISO 8601 string (assume Colombia time UTC-5), or null

Do not include any other text. Only output the JSON object.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json();

    if (!imageBase64) {
      return Response.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: SYSTEM_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: `Anthropic API error: ${errText}` }, { status: 200 });
    }

    const result = await response.json();
    const rawText = result.content?.[0]?.text ?? '';

    // Strip markdown code fences if present
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      return Response.json({ error: 'Could not parse AI response', raw: rawText }, { status: 200 });
    }

    return Response.json(
      {
        amount: extracted.amount ?? null,
        provider: extracted.provider ?? null,
        transaction_id: extracted.transaction_id ?? null,
        occurred_at: extracted.occurred_at ?? null,
      },
      {
        headers: { 'Access-Control-Allow-Origin': '*' },
      },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }
});
