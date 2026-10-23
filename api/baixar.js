// Área de membros: download das skills (.zip) só para quem já entrou com a senha. O arquivo não fica público em lugar nenhum.
// ?skill=sites baixa o bônus Site Dinâmico; sem parâmetro, a Edição Dinâmica.
const fs = require("fs");
const path = require("path");
const { liberado } = require("./_privado/acesso.js");

module.exports = (req, res) => {
  if (!liberado(req)) {
    res.writeHead(302, { Location: "/edicao-magnetica" });
    return res.end();
  }
  const nome = ((req.query && req.query.skill === "sites") || /[?&]skill=sites/.test(req.url || "")) ? "site-dinamico.zip" : "edicao-dinamica.zip";
  const zip = fs.readFileSync(path.join(__dirname, "_privado", nome));
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${nome}"`);
  res.setHeader("Content-Length", String(zip.length));
  res.setHeader("Cache-Control", "private, no-store");
  res.end(zip);
};
