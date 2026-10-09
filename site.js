/* Cibele & Vitor — site estático + Supabase opcional.
 * Sem configuração, todos os formulários operam no modo DEMONSTRAÇÃO local.
 * Modo de demonstração nunca cobra ou simula aprovação financeira.
 */
(() => {
  'use strict';
  const DEMO_GIFTS = [
    { id:'11111111-1111-4111-8111-111111111111',title:'Nosso primeiro café',description:'Para as manhãs preguiçosas a dois.',price_cents:8900,category:'lar',symbol:'☕',color:'sand' },
    { id:'22222222-2222-4222-8222-222222222222',title:'Jantar sob as estrelas',description:'Uma noite só nossa, com muito amor.',price_cents:25000,category:'momentos',symbol:'🍷',color:'rose' },
    { id:'33333333-3333-4333-8333-333333333333',title:'Um cantinho especial',description:'Pequenos detalhes para o nosso novo lar.',price_cents:18900,category:'lar',symbol:'🪴',color:'sage' },
    { id:'44444444-4444-4444-8444-444444444444',title:'Passeio na lua de mel',description:'Uma aventura para lembrar para sempre.',price_cents:35000,category:'viagem',symbol:'🏝️',color:'blue' },
    { id:'55555555-5555-4555-8555-555555555555',title:'Brinde à vida',description:'Uma taça erguida ao nosso futuro.',price_cents:12000,category:'momentos',symbol:'🥂',color:'sand' },
    { id:'66666666-6666-4666-8666-666666666666',title:'Noites de sonhos',description:'Uma noite especial durante a viagem.',price_cents:49000,category:'viagem',symbol:'🧳',color:'rose' }
  ];
  const EXAMPLE_MESSAGES = [
    { author:'Mariana e Felipe',body:'Que a vida a dois seja repleta de cumplicidade, amor e muitos momentos lindos. Estamos torcendo por vocês!',created_at:'2027-01-14T12:00:00-03:00' },
    { author:'Ana Clara',body:'O amor de vocês ilumina tudo ao redor. Que esse novo capítulo seja o mais bonito de todos!',created_at:'2027-01-10T12:00:00-03:00' },
    { author:'Lucas e Bia',body:'Que nunca faltem sorrisos, abraços apertados e motivos para celebrar. Viva os noivos!',created_at:'2027-01-05T12:00:00-03:00' }
  ];
  const config = window.WEDDING_CONFIG || {};
  let db = null;
  let gifts = DEMO_GIFTS.slice();
  let selectedGift = null;
  let filter = 'todos';
  const el = (id) => document.getElementById(id);
  const money = (cents) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(cents)/100);
  const escaped = (value) => String(value??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const store = (key, v) => { try {localStorage.setItem('cv_demo_'+key,JSON.stringify(v));}catch(_){} };
  const read = (key) => {try{return JSON.parse(localStorage.getItem('cv_demo_'+key) || '[]');}catch(_){return [];} };
  const toast = (text,error=false) => {const box=el('toast');box.textContent=text;box.className='toast visible'+(error?' error':'');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>box.className='toast',5500);};
  const hasBackend = Boolean(config.supabaseUrl?.trim() && config.supabasePublishableKey?.trim());

  function createGiftCard(g) {
    const card=document.createElement('article'); card.className='gift-card';
    const categoryLabel = {lar:'NOSSO LAR',viagem:'LUA DE MEL',momentos:'EXPERIÊNCIAS'}[g.category] || 'PRESENTE';
    const color = ['sage','rose','sand','blue'].includes(g.color)?g.color:'sage';
    card.innerHTML=`<div class="gift-visual" data-color="${color}"><div class="gift-art" aria-hidden="true">${escaped(g.symbol || '♡')}</div></div><div class="gift-topline"><span>${categoryLabel}</span><span>✳ C & V</span></div><h3>${escaped(g.title)}</h3><p>${escaped(g.description)}</p><div class="gift-bottom"><span class="gift-price">${money(g.price_cents)}</span><button class="gift-action" aria-label="Presentear: ${escaped(g.title)}" title="Quero presentear">↗</button></div>`;
    card.querySelector('button').addEventListener('click',()=>openGift(g));return card;
  }
  function renderGifts(){const grid=el('giftGrid');grid.replaceChildren(...gifts.filter(g=>filter==='todos'||g.category===filter).map(createGiftCard));if(!grid.children.length){grid.textContent='Nenhum presente disponível nesta categoria.';}}
  function renderMessages(messages){const box=el('messageList');box.replaceChildren();messages.forEach(m=>{const article=document.createElement('article');article.className='message-card';const body=document.createElement('p');body.textContent=m.body;const footer=document.createElement('div');footer.className='message-footer';footer.textContent='COM CARINHO, '+m.author.toLocaleUpperCase('pt-BR');article.append(body,footer);box.appendChild(article);});if(!messages.length){box.textContent='Ainda não há recados publicados. Seja o primeiro a deixar o seu carinho!';}}
  const validateEmail = (input) => {if(input.value.trim() && !input.validity.valid){input.reportValidity();return false;}return true;};
  const busy=(button,on,defaultLabel)=>{button.disabled=on;button.innerHTML=on?'ENVIANDO…':defaultLabel;};
  const within=(s,min,max)=>typeof s==='string' && s.trim().length>=min&&s.trim().length<=max;
  async function load(){
    if(hasBackend){
      if(!window.supabase?.createClient){toast('O cliente Supabase não foi carregado. Verifique a conexão com a internet.',true);return;}
      try{db=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
        const [{data:all,error:giftsError},{data:msgs,error:msgsError}]=await Promise.all([
          db.from('gifts').select('id,title,description,price_cents,category,symbol,color').eq('active',true).order('display_order'),
          db.from('wedding_messages').select('author,body,created_at').eq('approved',true).order('created_at',{ascending:false}).limit(6)
        ]);
        if(giftsError||msgsError)throw giftsError||msgsError;
        gifts=all??[];renderGifts();renderMessages(msgs??[]);
      }catch(err){console.error('Erro ao carregar Supabase:',err);toast('Falha no Supabase. Revise a configuração e as permissões de leitura.',true);renderMessages([]);}
    }else{renderGifts();renderMessages([...read('messages').map(x=>({...x,approved:true})).reverse(),...EXAMPLE_MESSAGES]);}
  }
  function initCountdown(){let t;const update=()=>{const date=Date.parse(config.weddingDate||'2027-09-18T16:30:00-03:00');const diff=Math.max(0,(date-Date.now())/1000);const arr=[Math.floor(diff/86400),Math.floor((diff%86400)/3600),Math.floor((diff%3600)/60),Math.floor(diff%60)];el('countdown').querySelectorAll('strong').forEach((x,i)=>x.textContent=String(arr[i]).padStart(i===0?3:2,'0'));if(!diff)clearInterval(t)};update();t=setInterval(update,1000);}
  async function submitRsvp(e){e.preventDefault();if(hasBackend&&!db){toast('O Supabase não está disponível. Nenhum dado foi enviado.',true);return;}const form=e.currentTarget,submit=el('rsvpSubmit');if(form.elements.company.value)return;const name=el('rsvpName').value.trim(),email=el('rsvpEmail').value.trim();if(!within(name,2,120)){el('rsvpName').reportValidity();toast('Informe seu nome completo.',true);return;}if(!validateEmail(el('rsvpEmail')))return;const data={guest_name:name,email:email||null,attending:form.elements.attending.value==='yes',companions:Number(el('rsvpCompanions').value),dietary:el('rsvpDiet').value.trim()||null};if(!data.attending)data.companions=0;
    busy(submit,true);try{if(db){const {error}=await db.from('rsvps').insert(data);if(error)throw error;}else{const all=read('rsvps');all.push({...data,created_at:new Date().toISOString()});store('rsvps',all);}form.reset();toast('Resposta registrada! '+(db?'Obrigado por confirmar.':'No modo demonstração, ela ficou salva apenas neste navegador.'));}catch(err){console.error(err);toast('Não foi possível registrar sua resposta. Tente novamente.',true);}finally{busy(submit,false,'ENVIAR CONFIRMAÇÃO <span>↗</span>');}}
  async function submitMessage(e){e.preventDefault();if(hasBackend&&!db){toast('O Supabase não está disponível. Nenhum dado foi enviado.',true);return;}const form=e.currentTarget;if(form.elements.company.value)return;const author=el('messageName').value.trim(),body=el('messageBody').value.trim();if(!within(author,2,100)||!within(body,6,700)){toast('Preencha seu nome e um recado de ao menos seis caracteres.',true);return;}
    const submit=el('messageSubmit');busy(submit,true);try{if(db){const {error}=await db.from('wedding_messages').insert({author,body});if(error)throw error;toast('Recado enviado! Ele aparecerá depois de aprovado pelos noivos.');}else{const all=read('messages');all.push({author,body,created_at:new Date().toISOString()});store('messages',all);renderMessages([...all].reverse().concat(EXAMPLE_MESSAGES));toast('Recado incluído na demonstração deste navegador.');}form.reset();}catch(err){console.error(err);toast('Não foi possível enviar seu recado.',true);}finally{busy(submit,false,'ENVIAR MEU RECADO <span>↗</span>');}}
  function openGift(g){selectedGift=g;el('modalTitle').textContent='Um carinho especial';el('modalGift').innerHTML=`<strong>${escaped(g.title)}</strong><span>${money(g.price_cents)}</span>`;el('giftModal').classList.add('open');el('giftModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';el('buyerName').focus();}
  function closeGift(){el('giftModal').classList.remove('open');el('giftModal').setAttribute('aria-hidden','true');document.body.style.overflow='';el('giftIntentForm').reset();selectedGift=null;}
  async function submitGiftIntent(e){e.preventDefault();if(hasBackend&&!db){toast('O Supabase não está disponível. Nenhum dado foi enviado.',true);return;}if(!selectedGift)return;const buyer_name=el('buyerName').value.trim(),buyer_email=el('buyerEmail').value.trim(),note=el('buyerNote').value.trim();if(!within(buyer_name,2,100)){toast('Informe seu nome.',true);return;}if(!validateEmail(el('buyerEmail')))return;const payload={gift_id:selectedGift.id,buyer_name,buyer_email:buyer_email||null,note:note||null};const submit=el('giftIntentSubmit');busy(submit,true);
    try{if(db){const {error}=await db.from('gift_intents').insert(payload);if(error)throw error;}else{const data=read('gift_intents');data.push({...payload,gift_name:selectedGift.title,price_cents:selectedGift.price_cents,created_at:new Date().toISOString()});store('gift_intents',data);}closeGift();toast(db?'Intenção registrada! Isso não constitui pagamento nem reserva.':'Intenção registrada somente neste navegador (demonstração). Nenhum pagamento foi realizado.');}catch(err){console.error(err);toast('Não foi possível registrar a intenção.',true);}finally{busy(submit,false,'REGISTRAR INTENÇÃO DE PRESENTEAR <span>↗</span>');}}
  el('rsvpForm').addEventListener('submit',submitRsvp);el('messageForm').addEventListener('submit',submitMessage);el('giftIntentForm').addEventListener('submit',submitGiftIntent);el('modalClose').addEventListener('click',closeGift);el('giftModal').addEventListener('click',e=>{if(e.target.dataset.closeModal)closeGift()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&selectedGift)closeGift()});
  document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x===b));renderGifts()}));
  const toggle=el('menuToggle'),nav=el('primaryNav');toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'✕':'☰';});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰';}));
  initCountdown();load();
})();