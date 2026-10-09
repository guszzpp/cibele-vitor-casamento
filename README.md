# Cibele & Vitor — site de casamento

Site estático pronto para GitHub Pages com layout responsivo, RSVP, mural de mensagens moderado, presentes demonstrativos, contagem regressiva e painel para os noivos.

## Publicação

Repositório: https://github.com/guszzpp/cibele-vitor-casamento

Para ativar Pages: Settings → Pages → Build and deployment → **Deploy from a branch** → **main** / **/(root)** → Save.

Endereço esperado após ativação: https://guszzpp.github.io/cibele-vitor-casamento/

## Estado atual

- Site, imagem editorial, estilos, formulários e painel administrativo: arquivos publicados no repositório.
- RSVP, mural e intenções de presentes: **demonstração no navegador**, com `localStorage`. Ainda não sincronizam entre usuários.
- Supabase: integração pronta no código, mas **sem projeto vinculado**. O arquivo `supabase/schema.sql` contém tabelas, catálogo, RLS e políticas para um **novo projeto exclusivo de casamento**. Não aplique ao Supabase de outro trabalho.
- Pagamentos por cartão/Pix: **não disponíveis**. A lista registra apenas intenções, não cobra, não reserva e não confirma pagamentos.
- Dados do evento, local e foto: fictícios; imagem gerada por IA, não fotografia real dos noivos.
- O formulário público, quando conectado ao Supabase, exige antes da divulgação controle de spam (CAPTCHA verificado por Edge Function), limitação de requisições, proteção de dados e convites individuais se necessário.

## Configurar banco dedicado

1. Crie novo projeto de casamento no Supabase; não reutilize `escritorioBSB`.
2. Execute `supabase/schema.sql` no SQL Editor do novo projeto.
3. Em `config.js`, informe **somente** a URL pública do projeto e a chave **publishable**, nunca service_role ou senha.
4. Cadastre os noivos no Supabase Auth, com autenticação por e-mail; no SQL Editor inclua o ID do administrador em `public.wedding_admins`.
5. Configure no Supabase Auth a URL do site e os redirect URLs incluindo `https://guszzpp.github.io/cibele-vitor-casamento/admin.html`.
6. Teste RSVP, mural, aprovação e presentes em diferentes navegadores, e verifique as políticas de RLS.
7. Antes do uso real, implemente e teste autenticação/limitação de envio e política de privacidade.

## Pagamentos

Integração futura via Mercado Pago/Asaas: endpoint de criação do checkout, credenciais guardadas exclusivamente no servidor, webhook autenticado e conciliação. **Nunca tratar evento local do navegador como confirmação de pagamento.**

## Arquivos

- `index.html`, `styles.css`, `site.js`, `config.js`
- `admin.html` e `admin.js`
- `assets/cibele-vitor-editorial.webp`
- `supabase/schema.sql`
- `.nojekyll`
