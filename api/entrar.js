// Área de membros: recebe a senha do formulário, confere e libera o acesso por 90 dias (cookie seguro).
// Variável na Vercel: ACESSO_SENHA (a senha que vai no e-mail da Cakto).
const { token, senhaConfere } = require("./_privado/acesso.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.writeHead(303, { Location: "/edicao-magnetica" });
    return res.end();
  }
  let corpo = req.body || {};
  if (typeof corpo === "string") corpo = Object.fromEntries(new URLSearchParams(corpo));
  if (!senhaConfere(corpo.senha)) {
    res.writeHead(303, { Location: "/edicao-magnetica?erro=1" });
    return res.end();
  }
  res.setHeader("Set-Cookie", `acesso=${token()}; Path=/; Max-Age=${60 * 60 * 24 * 90}; HttpOnly; Secure; SameSite=Lax`);
  res.writeHead(303, { Location: "/edicao-magnetica/aulas" });
  res.end();
};
