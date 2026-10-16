# LP · Skill Edição Dinâmica

Página de vendas com a VSL na primeira tela e a oferta ao rolar. Site estático + 1 função da Vercel (`api/capi.js`) para a API de Conversões da Meta.

```
index.html            página (o bloco LP_CONFIG fica no fim do arquivo)
privacidade.html      política de privacidade (link no rodapé)
assets/css/site.css   visual e animações
assets/js/site.js     animações + rastreamento (Pixel, API de Conversões, UTMs, retenção da VSL)
assets/videos/        VSL provisória, antes/depois e galeria
api/capi.js           função da Vercel que envia os eventos para a Meta pelo servidor
vercel.json           cache dos arquivos
```

## 1. Configurar (index.html, bloco `LP_CONFIG`)

| campo | o que colocar |
|---|---|
| `pixelId` | ID do seu Pixel da Meta |
| `checkout` | link do checkout da Cakto (ou Hotmart) |
| `preco` | `"97"` ou `"47"` (muda na página inteira e no valor do InitiateCheckout) |
| `vslEmbed` | código de incorporação do player da VSL (Vturb, Panda...). Vazio = usa `vslArquivo` |
| `vslArquivo` | caminho do vídeo da VSL hospedado aqui mesmo (`/assets/videos/...`) |

## 2. Subir no GitHub e na Vercel

1. Crie um repositório no GitHub e envie **o conteúdo desta pasta** (com `api/` e `assets/`).
2. Na Vercel: **Add New > Project > Import** o repositório. Framework: **Other**. Não precisa de comando de build.
3. **Settings > Environment Variables**:
   - `META_PIXEL_ID` = o mesmo ID do `pixelId`
   - `META_ACCESS_TOKEN` = token da API de Conversões (Gerenciador de Eventos > seu Pixel > Configurações > Gerar token de acesso)
   - `META_TEST_EVENT_CODE` = opcional, só enquanto testa (aba "Testar eventos"); apague depois
4. Faça um novo deploy depois de salvar as variáveis.

## 3. Domínio (linikerwambasterr.com.br)

Hoje o domínio principal mostra o seu site de tráfego (Netlify). Para não mexer nele, use um subdomínio:

1. Vercel > Project > **Settings > Domains** > adicione `skill.linikerwambasterr.com.br`.
2. No **registro.br** > seu domínio > **Editar zona DNS** > novo registro **CNAME**: nome `skill`, valor `cname.vercel-dns.com`.
3. Em alguns minutos a Vercel mostra "Valid Configuration" e já ativa o HTTPS.

(Se quiser a LP no domínio principal, a Vercel mostra o registro **A** `76.76.21.21`; isso substitui o site atual.)

## 4. Rastreamento (o que já vem pronto)

| evento | quando dispara | uso |
|---|---|---|
| `PageView` | abriu a página | padrão |
| `VSL_Play` | tocou em "Toque para ouvir" | público: quem começou a VSL |
| `VSL_25`, `VSL_50`, `VSL_75`, `VSL_95` | assistiu 25/50/75/95% da VSL **com som** | públicos de remarketing por retenção |
| `ViewContent` | chegou na oferta | padrão (otimização e público) |
| `InitiateCheckout` | clicou em comprar (com valor e moeda) | padrão |
| `Purchase` | **na plataforma de pagamento** | ative o Pixel/API de Conversões da Cakto ou Hotmart com o mesmo Pixel |

- Todo evento vai pelo **Pixel** e pela **API de Conversões** com o mesmo `event_id` (a Meta remove a duplicidade).
- `fbp`, `fbc` (criado a partir do `fbclid`), IP e navegador vão junto: melhora a correspondência dos eventos.
- Os **UTMs** do anúncio (`utm_*`, `src`, `sck`, `xcod`, `fbclid`) ficam guardados e são passados para o link do checkout: a venda fica atribuída à campanha certa.

**Públicos sugeridos no Gerenciador de Anúncios** (Público personalizado > Site > eventos):
- Assistiu 75% da VSL nos últimos 7 dias (`VSL_75`) e não comprou: remarketing com depoimento/garantia.
- Começou a VSL e parou antes de 25% (`VSL_Play` e não `VSL_25`): remarketing com outro gancho.
- `InitiateCheckout` sem `Purchase`: lembrete de checkout.
- Semelhante (lookalike) de `VSL_75`.

**VSL em player externo:** a retenção acima é medida quando o vídeo está hospedado aqui (`vslArquivo`). No Vturb ou no Panda, ligue a integração de Pixel do próprio player para ter os eventos de retenção; a página continua medindo PageView, ViewContent e InitiateCheckout.

## 5. Testar

1. Coloque `META_TEST_EVENT_CODE` na Vercel e abra a página.
2. No Gerenciador de Eventos > **Testar eventos**: devem aparecer `PageView` (navegador e servidor), depois `VSL_Play` e os marcos ao assistir com som, `ViewContent` ao chegar na oferta e `InitiateCheckout` ao clicar em comprar.
3. Apague `META_TEST_EVENT_CODE` e faça novo deploy.
