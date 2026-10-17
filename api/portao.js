// Área de membros: porta de entrada (/edicao-magnetica). Sem senha para digitar:
//  - o link da página de obrigado / e-mail da Cakto traz a chave (?chave=...): confere, guarda o passe por 90 dias e abre as aulas;
//  - quem já entrou neste aparelho vai direto para as aulas;
//  - quem chega sem link vê onde achar o acesso (e um campo de código, só como reserva).
// A chave é a mesma da variável ACESSO_SENHA na Vercel. Vazou? Troque ACESSO_SENHA, faça Redeploy e atualize o link na Cakto.
const fs = require("fs");
const path = require("path");
const { token, liberado, senhaConfere } = require("./_privado/acesso.js");

module.exports = (req, res) => {
  const q = req.query || Object.fromEntries(new URL(req.url, "http://x").searchParams);
  const chave = typeof q.chave === "string" ? q.chave : "";
  if (chave) {
    if (senhaConfere(chave)) {
      res.setHeader("Set-Cookie", `acesso=${token()}; Path=/; Max-Age=${60 * 60 * 24 * 90}; HttpOnly; Secure; SameSite=Lax`);
      // a chave segue só depois do "#": não aparece na barra (a página tira) e não vai para o servidor;
      // serve para o botão "mandar o acesso pro computador" montar o link
      res.writeHead(303, { Location: "/edicao-magnetica/aulas#k=" + encodeURIComponent(chave) });
      return res.end();
    }
    res.writeHead(303, { Location: "/edicao-magnetica?erro=1" });
    return res.end();
  }
  if (liberado(req)) {
    res.writeHead(302, { Location: "/edicao-magnetica/aulas" });
    return res.end();
  }
  const html = fs.readFileSync(path.join(__dirname, "_privado", "portao.html"), "utf8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.end(html);
};
