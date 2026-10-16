// Área de membros: um "passe" assinado guardado num cookie seguro depois que a pessoa acerta a senha.
// A senha fica SÓ na Vercel (variável ACESSO_SENHA). Trocou a senha? Todo mundo precisa entrar de novo com a nova.
const crypto = require("crypto");

const segredo = () => process.env.ACESSO_SEGREDO || process.env.ACESSO_SENHA || "";

exports.token = () => crypto.createHmac("sha256", segredo()).update("acesso-area-v1").digest("hex");

exports.liberado = (req) => {
  if (!segredo()) return false;
  const par = String(req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("acesso="));
  if (!par) return false;
  const v = par.slice("acesso=".length);
  const t = exports.token();
  return v.length === t.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(t));
};

exports.senhaConfere = (digitada) => {
  const certa = String(process.env.ACESSO_SENHA || "").trim().toLowerCase();
  const d = String(digitada || "").trim().toLowerCase();
  if (!certa || d.length !== certa.length) return false;
  return crypto.timingSafeEqual(Buffer.from(d), Buffer.from(certa));
};
