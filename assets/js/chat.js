/* Website assistant: floating chat that talks to /api/chat.php */
(function () {
  if (window.__sbChat) return; window.__sbChat = true;
  var KEY = 'sb-chat-v1', MAX = 1200;
  var GREETING = 'Hi! I’m Suchetana’s website assistant, an AI. I can tell you about her services and work, point you to the right case study or article, or pass your enquiry straight to her. What brings you here?';
  var QGREETING = 'Hi! I can answer quick questions about Suchetana’s services, work and how to get in touch. Pick a topic or type a question.';
  var QCHIPS = ['What services do you offer?', 'How much does it cost?', 'Show me her work', 'How do I get in touch?'];
  var CHIPS = ['What can Suchetana help with?', 'How does AI enablement work?', 'Show me relevant case studies', 'I’d like to discuss a project'];

  function load() { try { return JSON.parse(sessionStorage.getItem(KEY)) || { msgs: [], open: false }; } catch (e) { return { msgs: [], open: false }; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var state = load();

  /* ---------- Quick answers: work with no AI key, from facts on the website ---------- */
  var S = 'https://suchetanabauri.com';
  var SERVICES = [
    ['ai-enablement', 'AI Enablement', ['ai', 'artificial intelligence', 'adoption', 'copilot', 'chatgpt', 'genai', 'agent', 'agents', 'automation', 'enablement', 'prompt', 'training'], 'Helping teams understand AI and use it in their real work, beyond the rollout: AI adoption communication, role-specific learning, workflow guidance and responsible use.'],
    ['communications', 'Communications', ['communication', 'communications', 'internal comms', 'internal', 'change', 'town hall', 'newsletter', 'leadership message', 'employee', 'intranet', 'pr', 'public relations'], 'Internal and external messages that are clear, timely and acted on: communication plans, change communication, leadership messages, manager briefings and editorial content.'],
    ['branding', 'Branding', ['brand', 'branding', 'rebrand', 'identity', 'logo', 'guidelines', 'naming', 'tone of voice'], 'Shaping how your brand looks, sounds and shows up: brand strategy, architecture, verbal and visual identity, guidelines and brand experiences.'],
    ['design', 'Design', ['design', 'website', 'web', 'site', 'app', 'ux', 'ui', 'deck', 'presentation', 'layout', 'figma'], 'Websites, apps, decks, layouts and visuals that make complex ideas easy to follow: UX, UI, presentation, editorial, information design and design systems.'],
    ['digital-marketing', 'Digital Marketing', ['marketing', 'digital marketing', 'seo', 'social', 'social media', 'campaign', 'email marketing', 'content marketing', 'ads', 'instagram', 'linkedin marketing'], 'Content and campaigns that build an audience: digital marketing strategy, content, SEO, social media, campaigns, email and measurement.'],
    ['thought-leadership', 'Thought Leadership', ['thought leadership', 'ghostwriting', 'ghostwrite', 'articles', 'op-ed', 'opinion', 'linkedin posts', 'executive', 'ceo', 'founder'], 'Turning leaders’ expertise into articles and posts people want to read: editorial strategy, interviews, ghostwriting, opinion pieces, LinkedIn posts and newsletters.']
  ];
  var CONTACT = 'The quickest ways to reach Suchetana:\n- Contact form: ' + S + '/lets-talk/\n- Email: hello@suchetanabauri.com\n- WhatsApp: [+91 76750 03859](https://wa.me/917675003859)\n- LinkedIn: [suchetanabauri](https://www.linkedin.com/in/suchetanabauri)\nShe replies within two working days.';
  var INTENTS = [
    { k: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste'], a: 'Hello! Ask me about Suchetana’s services, her work, or how to get in touch.', c: ['What services do you offer?', 'How do I get in touch?'] },
    { k: ['service', 'services', 'offer', 'help with', 'what do you do', 'what does she do', 'what can', 'expertise', 'specialise', 'specialize'], a: 'Suchetana offers six services:\n' + SERVICES.map(function (x) { return '- **' + x[1] + '**: ' + S + '/services/' + x[0] + '/'; }).join('\n') + '\nAI Enablement is her lead service. Which one are you interested in?', c: ['AI Enablement', 'Communications', 'Design', 'How do I get in touch?'] },
    { k: ['price', 'pricing', 'cost', 'costs', 'fee', 'fees', 'rate', 'rates', 'charge', 'budget', 'quote', 'how much', 'expensive', 'cheap', 'package'], a: 'Every project is priced on its scope, so there’s no fixed price list. Share a few lines about what you need and Suchetana will reply within two working days with next steps and an estimate: ' + S + '/lets-talk/', c: ['How do I get in touch?', 'What services do you offer?'] },
    { k: ['contact', 'reach', 'email', 'call', 'talk', 'hire', 'work with', 'get in touch', 'enquiry', 'inquiry', 'project', 'book', 'meeting', 'whatsapp', 'phone', 'consultation', 'discuss'], a: CONTACT, c: ['How much does it cost?', 'How long until she replies?'] },
    { k: ['reply', 'respond', 'response', 'how long', 'how soon', 'turnaround', 'urgent', 'quickly'], a: 'Suchetana replies within two working days. If it’s time-sensitive, WhatsApp is the quickest way to reach her: [+91 76750 03859](https://wa.me/917675003859)', c: ['How do I get in touch?'] },
    { k: ['where', 'location', 'based', 'india', 'hyderabad', 'remote', 'remotely', 'time zone', 'timezone', 'abroad', 'international', 'overseas', 'country'], a: 'Suchetana is based in Hyderabad, India, and works remotely with teams across time zones.', c: ['How do I get in touch?', 'What services do you offer?'] },
    { k: ['about', 'who is', 'who are', 'experience', 'background', 'years', 'career', 'qualification', 'qualifications', 'education', 'credentials'], a: 'Suchetana has 17+ years of communication work across publishing houses, business schools, sport and global enterprises, making complex ideas clear enough to act on. Her story, experience and credentials: ' + S + '/about/', c: ['Show me her work', 'What services do you offer?'] },
    { k: ['case study', 'case studies', 'portfolio', 'work', 'examples', 'projects', 'clients', 'results', 'past work', 'samples'], a: 'A few case studies:\n- Internal comms people actually read, Microsoft (via partner): ' + S + '/work/microsoft-internal-comms/\n- AI, beyond the announcement, an insurtech company: ' + S + '/work/insurtech-ai-publications/\n- The first draft gets a second opinion, Suchflow: ' + S + '/work/suchflow/\n- ISB Insight: a publication, not a souvenir: ' + S + '/work/isb-insight/\nAll her work: ' + S + '/work/', c: ['What services do you offer?', 'How do I get in touch?'] },
    { k: ['blog', 'article', 'articles', 'writing', 'read', 'insights', 'posts', 'newsletter'], a: 'Suchetana writes about AI adoption, communication and design, from the work itself. All articles: ' + S + '/blog/\nEach article can also be listened to.', c: ['Show me her work', 'What services do you offer?'] },
    { k: ['job', 'jobs', 'role', 'roles', 'hiring', 'recruit', 'recruiter', 'full-time', 'full time', 'position', 'opening', 'cv', 'resume', 'employment'], a: 'Suchetana is open to suitable roles as well as projects. Recruiters can reach her through the contact form (choose “A role or job opportunity”): ' + S + '/lets-talk/?topic=role or on [LinkedIn](https://www.linkedin.com/in/suchetanabauri)', c: ['Tell me about her experience'] },
    { k: ['thank', 'thanks', 'great', 'perfect', 'bye', 'cheers'], a: 'You’re welcome! If anything else comes up, I’m here.', c: [] }
  ];
  function norm(t) { return ' ' + t.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9+\- ]/g, ' ').replace(/\s+/g, ' ') + ' '; }
  function has(t, k) { return t.indexOf(' ' + k + ' ') > -1 || (k.length > 4 && t.indexOf(k) > -1); }
  function quick(text) {
    var t = norm(text);
    var best = null, score = 0;
    SERVICES.forEach(function (x) {
      var n = 0; if (has(t, x[1].toLowerCase())) n += 3;
      x[2].forEach(function (k) { if (has(t, k)) n += 1.5; });
      if (n > score) { score = n; best = { a: '**' + x[1] + '**: ' + x[3] + '\nMore: ' + S + '/services/' + x[0] + '/\nTo discuss it: ' + S + '/lets-talk/?topic=' + x[0], c: ['How much does it cost?', 'Show me her work', 'How do I get in touch?'] }; }
    });
    INTENTS.forEach(function (it) {
      var n = 0; it.k.forEach(function (k) { if (has(t, k)) n += 1.2; });
      if (n > score) { score = n; best = it; }
    });
    if (best && score > 0) return { a: best.a, c: best.c };
    return { a: 'I can only answer quick questions here, and I don’t have an answer for that one. Suchetana can help directly:\n' + CONTACT.split('\n').slice(1, 3).join('\n'), c: ['What services do you offer?', 'How do I get in touch?'] };
  }
  var MODE = 'quick';

  var root = document.createElement('div'); root.className = 'sbc';
  root.innerHTML =
    '<button class="sbc-fab" type="button" aria-haspopup="dialog" aria-controls="sbc-panel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l.9-4.4A8 8 0 1 1 20 12z"/></svg><span>Ask a question</span></button>' +
    '<section class="sbc-panel" id="sbc-panel" role="dialog" aria-modal="false" aria-labelledby="sbc-title">' +
      '<div class="sbc-head"><div><b id="sbc-title">Website assistant</b><span>AI answers about Suchetana’s services and work. She reads every enquiry herself.</span></div>' +
      '<button class="sbc-x" type="button" aria-label="Close chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="sbc-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<form class="sbc-form"><label for="sbc-in" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Your message</label>' +
      '<textarea id="sbc-in" rows="1" maxlength="' + MAX + '" placeholder="Type your question…"></textarea>' +
      '<button class="sbc-send" type="submit" aria-label="Send"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg></button></form>' +
      '<p class="sbc-note">AI can make mistakes; check anything important with Suchetana. Please don’t share sensitive information. <a href="/privacy-policy/">Privacy</a></p>' +
    '</section>';
  document.body.appendChild(root);

  var fab = root.querySelector('.sbc-fab'), panel = root.querySelector('.sbc-panel'), log = root.querySelector('.sbc-log'),
      form = root.querySelector('.sbc-form'), input = root.querySelector('textarea'), send = root.querySelector('.sbc-send'),
      closeBtn = root.querySelector('.sbc-x'), busy = false;

  function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(text) {
    var h = esc(text);
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, t, u) { return '<a href="' + u.replace(/^https?:/, '\u0000') + '"' + (/suchetanabauri\.com/.test(u) ? '' : ' target="_blank" rel="noopener"') + '>' + t + '</a>'; });
    h = h.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, function (_, p, u) {
      var label = u.replace(/^https?:\/\/(www\.)?suchetanabauri\.com/, '') || '/';
      var ext = !/suchetanabauri\.com/.test(u);
      return p + '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + (ext ? u : 'suchetanabauri.com' + label) + '</a>';
    });
    h = h.replace(/\u0000/g, 'https:');
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    var out = [], list = [];
    h.split(/\n/).forEach(function (line) {
      var m = line.match(/^\s*[-•*]\s+(.*)/);
      if (m) { list.push('<li>' + m[1] + '</li>'); return; }
      if (list.length) { out.push('<ul>' + list.join('') + '</ul>'); list = []; }
      if (line.trim()) out.push('<p>' + line + '</p>');
    });
    if (list.length) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('');
  }
  function bubble(role, text, err) {
    var d = document.createElement('div'); d.className = 'sbc-msg ' + (role === 'user' ? 'me' : 'bot') + (err ? ' err' : '');
    if (role === 'user') d.textContent = text; else d.innerHTML = fmt(text);
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function chips(list) {
    list = list || (MODE === 'ai' ? CHIPS : QCHIPS); if (!list.length) return;
    var c = document.createElement('div'); c.className = 'sbc-chips';
    list.forEach(function (t) { var b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = function () { c.remove(); ask(t); }; c.appendChild(b); });
    log.appendChild(c);
  }
  function render() {
    log.innerHTML = '';
    bubble('assistant', MODE === 'ai' ? GREETING : QGREETING);
    state.msgs.forEach(function (m) { bubble(m.role, m.content); });
    if (!state.msgs.length) chips();
  }
  function setOpen(o) {
    state.open = o; save();
    root.classList.toggle('open', o);
    fab.setAttribute('aria-expanded', o ? 'true' : 'false');
    if (o) { if (!log.children.length) render(); setTimeout(function () { input.focus(); log.scrollTop = log.scrollHeight; }, 30); if (window.gtag) gtag('event', 'chat_open'); }
    else fab.focus();
  }
  function ask(text) {
    text = (text || '').trim().slice(0, MAX); if (!text || busy) return;
    var chipRow = log.querySelector('.sbc-chips'); if (chipRow) chipRow.remove();
    state.msgs.push({ role: 'user', content: text }); save(); bubble('user', text);
    input.value = ''; grow(); busy = true; send.disabled = true;
    if (MODE === 'quick') {
      var r = quick(text);
      setTimeout(function () { state.msgs.push({ role: 'assistant', content: r.a }); save(); bubble('assistant', r.a); chips(r.c); busy = false; send.disabled = false; input.focus(); }, 350);
      if (window.gtag) gtag('event', 'chat_message', { mode: 'quick' });
      return;
    }
    var t = document.createElement('div'); t.className = 'sbc-typing'; t.setAttribute('aria-label', 'Assistant is typing'); t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); log.scrollTop = log.scrollHeight;
    fetch('/api/chat.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: state.msgs.slice(-16), page: location.pathname }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        t.remove();
        if (res.ok && res.j.reply) {
          state.msgs.push({ role: 'assistant', content: res.j.reply }); save(); bubble('assistant', res.j.reply);
          if (res.j.lead_captured && window.gtag) gtag('event', 'generate_lead', { method: 'website_assistant' });
        } else bubble('assistant', (res.j && res.j.error) || 'Sorry, something went wrong. Please email hello@suchetanabauri.com.', true);
      })
      .catch(function () { t.remove(); bubble('assistant', 'I couldn’t connect just now. Please try again, or email hello@suchetanabauri.com.', true); })
      .then(function () { busy = false; send.disabled = false; input.focus(); });
    if (window.gtag && state.msgs.length === 1) gtag('event', 'chat_message');
  }
  function grow() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }

  fab.addEventListener('click', function () { setOpen(true); });
  closeBtn.addEventListener('click', function () { setOpen(false); });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  input.addEventListener('input', grow);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('open')) setOpen(false); });
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-open-chat]'); if (a) { e.preventDefault(); setOpen(true); } });

  function quickLabels() {
    root.querySelector('.sbc-head span').textContent = 'Quick answers about Suchetana’s services, work and how to get in touch.';
    root.querySelector('.sbc-note').innerHTML = 'Automated answers from this website. For anything else, use the <a href="/lets-talk/">contact form</a>. <a href="/privacy-policy/">Privacy</a>';
  }
  quickLabels();
  fetch('/api/chat.php?status=1').then(function (r) { return r.json(); }).then(function (s) {
    if (s && s.ready) {
      MODE = 'ai';
      root.querySelector('.sbc-head span').textContent = 'AI answers about Suchetana’s services and work. She reads every enquiry herself.';
      root.querySelector('.sbc-note').innerHTML = 'AI can make mistakes; check anything important with Suchetana. Please don’t share sensitive information. <a href="/privacy-policy/">Privacy</a>';
      if (log.children.length) render();
    }
  }).catch(function () {}).then(function () {
    if (state.open && window.innerWidth > 640) setOpen(true);
  });
})();
