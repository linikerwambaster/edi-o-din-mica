// Área de membros: download da skill (.zip) só para quem já entrou com a senha. O arquivo não fica público em lugar nenhum.
const fs = require("fs");
const path = require("path");
const { liberado } = require("./_privado/acesso.js");

module.exports = (req, res) => {
  if (!liberado(req)) {
    res.writeHead(302, { Location: "/edicao-magnetica" });
    return res.end();
  }
  const zip = fs.readFileSync(path.join(__dirname, "_privado", "edicao-dinamica.zip"));
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="edicao-dinamica.zip"');
  res.setHeader("Content-Length", String(zip.length));
  res.setHeader("Cache-Control", "private, no-store");
  res.end(zip);
};
