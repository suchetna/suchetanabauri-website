/* Website assistant: floating chat that talks to /api/chat.php */
(function () {
  if (window.__sbChat) return; window.__sbChat = true;
  var KEY = 'sb-chat-v1', MAX = 1200;
  var GREETING = 'Hi! I’m Suchetana’s website assistant, an AI. I can tell you about her services and work, point you to the right case study or article, or pass your enquiry straight to her. What brings you here?';
  var CHIPS = ['What can Suchetana help with?', 'How does AI enablement work?', 'Show me relevant case studies', 'I’d like to discuss a project'];

  function load() { try { return JSON.parse(sessionStorage.getItem(KEY)) || { msgs: [], open: false }; } catch (e) { return { msgs: [], open: false }; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var state = load();

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
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, t, u) { return '<a href="' + u + '">' + t + '</a>'; });
    h = h.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, function (_, p, u) {
      var label = u.replace(/^https?:\/\/(www\.)?suchetanabauri\.com/, '') || '/';
      var ext = !/suchetanabauri\.com/.test(u);
      return p + '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + (ext ? u : 'suchetanabauri.com' + label) + '</a>';
    });
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
  function chips() {
    var c = document.createElement('div'); c.className = 'sbc-chips';
    CHIPS.forEach(function (t) { var b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = function () { c.remove(); ask(t); }; c.appendChild(b); });
    log.appendChild(c);
  }
  function render() {
    log.innerHTML = '';
    bubble('assistant', GREETING);
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

  root.style.display = 'none';
  fetch('/api/chat.php?status=1').then(function (r) { return r.json(); }).then(function (s) {
    if (!s || !s.ready) return;
    root.style.display = '';
    if (state.open && window.innerWidth > 640) setOpen(true);
  }).catch(function () {});
})();
