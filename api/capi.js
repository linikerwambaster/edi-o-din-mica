// Função da Vercel: recebe os eventos da LP e envia para a API de Conversões da Meta (servidor -> Meta).
// O navegador manda o mesmo evento pelo Pixel com o mesmo event_id; a Meta junta os dois (sem contar em dobro).
// Variáveis de ambiente (Vercel > Settings > Environment Variables):
//   META_PIXEL_ID        ID do Pixel (o mesmo do LP_CONFIG no index.html)
//   META_ACCESS_TOKEN    Token da API de Conversões (Gerenciador de Eventos > Configurações > Gerar token)
//   META_TEST_EVENT_CODE Opcional. Código de teste (aba "Testar eventos"); apague depois de testar
//   META_API_VERSION     Opcional. Versão da Graph API (padrão: v23.0)

// Eventos aceitos: padrão da Meta (Lead = download de material gratuito) + retenção da VSL (personalizados, para remarketing)
const PERMITIDOS = ["PageView", "ViewContent", "Lead", "Contact", "InitiateCheckout", "VSL_Play", "VSL_25", "VSL_50", "VSL_75", "VSL_95"];

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false, erro: "Use POST" });

  const pixel = process.env.META_PIXEL_ID;
  const token = process.env.META_ACCESS_TOKEN;
  if (!pixel || !token) return res.status(200).json({ ok: false, erro: "Pixel ou token não configurados" });

  let b = req.body;
  try { if (typeof b === "string") b = JSON.parse(b); } catch (e) { b = null; }
  if (!b || !PERMITIDOS.includes(b.event_name)) return res.status(400).json({ ok: false, erro: "Evento inválido" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
  const user_data = { client_ip_address: ip, client_user_agent: req.headers["user-agent"] || "" };
  if (b.fbp) user_data.fbp = String(b.fbp);
  if (b.fbc) user_data.fbc = String(b.fbc);

  const custom = b.custom_data && typeof b.custom_data === "object" ? b.custom_data : {};
  const payload = {
    data: [{
      event_name: b.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: String(b.event_id || ""),
      action_source: "website",
      event_source_url: String(b.event_source_url || ""),
      user_data,
      custom_data: custom
    }]
  };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

  const versao = process.env.META_API_VERSION || "v23.0";
  try {
    const r = await fetch(`https://graph.facebook.com/${versao}/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const j = await r.json();
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, meta: j });
  } catch (e) {
    return res.status(502).json({ ok: false, erro: "Falha ao enviar para a Meta" });
  }
};
