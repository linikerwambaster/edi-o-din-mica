// Área de membros: entrega a página das aulas só para quem já entrou com a senha.
const fs = require("fs");
const path = require("path");
const { liberado } = require("./_privado/acesso.js");

module.exports = (req, res) => {
  if (!liberado(req)) {
    res.writeHead(302, { Location: "/edicao-magnetica" });
    return res.end();
  }
  const html = fs.readFileSync(path.join(__dirname, "_privado", "area.html"), "utf8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.end(html);
};
