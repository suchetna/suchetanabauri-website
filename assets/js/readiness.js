/* AI Readiness Check: questionnaire on /ai-readiness/, scored and written up by /api/readiness.php */
(function () {
  var API = '/api/readiness.php';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('rc-form'); if (!form) return;

  var CONTEXT = [
    { k: 'size', q: 'How many people work in your organisation?', t: 'select', o: ['Under 50', '50–250', '250–1,000', '1,000–5,000', 'Over 5,000'] },
    { k: 'industry', q: 'Which industry are you in?', t: 'select', o: ['IT services and software', 'Banking, financial services and insurance', 'Manufacturing', 'Healthcare and pharma', 'Education', 'Retail, D2C and consumer', 'Professional services', 'Media and communications', 'Non-profit or public sector', 'Other'] },
    { k: 'role', q: 'Which best describes your role?', t: 'select', o: ['Founder or CEO', 'Leadership team', 'HR, people or L&D', 'Internal communications', 'IT or digital', 'Operations', 'Manager', 'Other'] },
    { k: 'tools', q: 'Which AI tools does your organisation use now? (optional)', t: 'text', ph: 'For example ChatGPT, Microsoft Copilot, Gemini, or none' }
  ];
  var STEPS = [
    ['Leadership and direction', [
      ['q1', 'Has leadership explained why the organisation is using AI?', ['No', 'It has been talked about', 'There are written goals', 'There are goals with owners and measures']],
      ['q2', 'Who owns AI adoption?', ['Nobody in particular', 'IT, on its own', 'An informal group across teams', 'A named owner with a budget']]]],
    ['People and skills', [
      ['q3', 'How many employees use AI for work each week?', ['Hardly any', 'A few enthusiasts', 'About a third', 'Most']],
      ['q4', 'What AI training have people had?', ['None', 'A one-off session', 'Role-based training for some teams', 'Ongoing, role-based learning']]]],
    ['Work and use cases', [
      ['q5', 'Have you identified tasks where AI helps?', ['No', 'General ideas only', 'A list of use cases', 'A prioritised list, with current performance measured']],
      ['q6', 'Is AI part of any process from start to finish?', ['No', 'Individuals experiment', 'One team is running a pilot', 'Several processes, with human review']]]],
    ['Tools and information', [
      ['q7', 'Do people have approved AI tools?', ['No, they use personal accounts', 'Some, but it is unclear which', 'Yes, an approved list', 'Yes, approved and connected to company systems']],
      ['q8', 'Is your information (policies, documents, knowledge) organised for AI to use?', ['Scattered', 'Partly', 'Mostly in one place', 'Organised, current and owned']]]],
    ['Responsible use', [
      ['q9', 'Is there an AI use policy?', ['None', 'Being drafted', 'Published', 'Published, understood and reviewed regularly']],
      ['q10', 'Do people know what data must never go into AI tools?', ['No', 'Some people do', 'Most people do', 'Everyone does, and it is checked']]]],
    ['Communication and change', [
      ['q11', 'How has AI been communicated to employees?', ['Not at all', 'Occasional mentions', 'A launch announcement', 'An ongoing programme, with managers involved']],
      ['q12', 'How do employees feel about AI at work?', ['Worried, or unaware', 'Mixed, and rarely discussed', 'Mostly curious', 'Confident, and sharing what works']]]]
  ];
  var TOTAL = STEPS.length + 1;
  var step = 0, token = null;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---- Build the steps ----
  var html = '<fieldset class="rc-step" data-step="0"><legend class="rc-legend">About your organisation</legend>';
  CONTEXT.forEach(function (c) {
    html += '<label class="ct-field"><span>' + esc(c.q) + '</span>';
    if (c.t === 'select') html += '<select name="' + c.k + '" required><option value="">Choose one</option>' + c.o.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
    else html += '<input type="text" name="' + c.k + '" maxlength="160" placeholder="' + esc(c.ph) + '">';
    html += '</label>';
  });
  html += '</fieldset>';
  STEPS.forEach(function (s, i) {
    html += '<fieldset class="rc-step" data-step="' + (i + 1) + '" hidden><legend class="rc-legend">' + esc(s[0]) + '</legend>';
    s[1].forEach(function (q) {
      html += '<div class="rc-q" role="radiogroup" aria-labelledby="' + q[0] + '-l"><p class="rc-qt" id="' + q[0] + '-l">' + esc(q[1]) + '</p><div class="rc-opts">';
      q[2].forEach(function (o, v) {
        html += '<label class="rc-opt"><input type="radio" name="' + q[0] + '" value="' + v + '"><span>' + esc(o) + '</span></label>';
      });
      html += '</div></div>';
    });
    html += '</fieldset>';
  });
  $('rc-steps').innerHTML = html;
  form.hidden = false;

  var steps = form.querySelectorAll('.rc-step');
  function show(n) {
    step = n;
    steps.forEach(function (el, i) { el.hidden = i !== n; });
    $('rc-back').style.visibility = n === 0 ? 'hidden' : 'visible';
    $('rc-next').textContent = n === TOTAL - 1 ? 'See my result' : 'Next';
    $('rc-step-label').textContent = 'Step ' + (n + 1) + ' of ' + TOTAL;
    $('rc-bar').style.width = (n / TOTAL * 100) + '%';
    $('rc-error').textContent = '';
  }
  function valid(n) {
    var el = steps[n], ok = true;
    if (n === 0) {
      el.querySelectorAll('select[required]').forEach(function (s) { var bad = !s.value; s.setAttribute('aria-invalid', bad); if (bad) ok = false; });
      if (!ok) $('rc-error').textContent = 'Please answer each question to continue.';
    } else {
      el.querySelectorAll('.rc-q').forEach(function (q) { var bad = !q.querySelector('input:checked'); q.classList.toggle('rc-missing', bad); if (bad) ok = false; });
      if (!ok) $('rc-error').textContent = 'Please choose an answer for both questions.';
    }
    return ok;
  }
  function scrollTop() { var y = form.getBoundingClientRect().top + window.scrollY - 100; if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' }); }

  $('rc-next').addEventListener('click', function () {
    if (!valid(step)) return;
    if (step < TOTAL - 1) { show(step + 1); scrollTop(); var f = steps[step].querySelector('input,select'); if (f) f.focus({ preventScroll: true }); }
    else submit();
  });
  $('rc-back').addEventListener('click', function () { if (step > 0) { show(step - 1); scrollTop(); } });
  form.addEventListener('change', function (e) {
    var q = e.target.closest('.rc-q'); if (q) q.classList.remove('rc-missing');
    if (e.target.tagName === 'SELECT') e.target.removeAttribute('aria-invalid');
  });

  function post(body) {
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.'); return d; }); });
  }

  function submit() {
    var fd = new FormData(form), answers = {}, context = {};
    CONTEXT.forEach(function (c) { context[c.k] = fd.get(c.k) || ''; });
    STEPS.forEach(function (s) { s[1].forEach(function (q) { answers[q[0]] = parseInt(fd.get(q[0]), 10); }); });
    form.hidden = true; $('rc-working').hidden = false; scrollTop();
    if (window.gtag) gtag('event', 'readiness_submit');
    post({ action: 'score', answers: answers, context: context }).then(function (d) {
      token = d.token;
      $('rc-working').hidden = true; $('rc-result').hidden = false;
      $('rc-level').textContent = d.level;
      $('rc-summary').textContent = d.summary;
      $('rc-areas').innerHTML = d.areas.map(function (a) {
        return '<li><span class="rc-an">' + esc(a.name) + '</span><span class="rc-track"><span style="width:' + (a.score / 6 * 100) + '%"></span></span><span class="rc-as">' + a.score + '/6</span></li>';
      }).join('');
      count(d.total);
      $('rc-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.gtag) gtag('event', 'readiness_result', { level: d.level, score: d.total });
    }).catch(function (err) {
      $('rc-working').hidden = true; form.hidden = false; $('rc-error').textContent = err.message;
    });
  }
  function count(total) {
    var dial = $('rc-dial'), t0 = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { $('rc-total').textContent = total; dial.style.setProperty('--p', total / 36); return; }
    function frame(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1100), e = 1 - Math.pow(1 - k, 3);
      $('rc-total').textContent = Math.round(total * e); dial.style.setProperty('--p', total / 36 * e); if (k < 1) requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
  }

  // ---- Email gate ----
  var send = $('rc-send');
  send.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(send), st = $('rc-send-status'), btn = send.querySelector('button');
    send.querySelectorAll('[aria-invalid]').forEach(function (x) { x.removeAttribute('aria-invalid'); });
    if (!String(fd.get('name')).trim()) { send.name.setAttribute('aria-invalid', 'true'); st.className = 'ct-status err'; st.textContent = 'Please add your name.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(fd.get('email')).trim())) { send.email.setAttribute('aria-invalid', 'true'); st.className = 'ct-status err'; st.textContent = 'Please check your email address.'; return; }
    btn.disabled = true; st.className = 'ct-status'; st.textContent = 'Sending…';
    post({ action: 'send', token: token, name: fd.get('name'), email: fd.get('email'), organisation: fd.get('organisation'), call: !!fd.get('call'), website: fd.get('website') })
      .then(function (d) {
        $('rc-gate').innerHTML = '<h3>Your report is on its way</h3><p>' + (d.emailed === false ? 'The email didn’t send, but your full report is below.' : 'Check your inbox (and spam, just in case). It’s also below.') + (fd.get('call') ? ' I’ll be in touch within two working days to arrange a call.' : '') + '</p>';
        $('rc-notes').innerHTML = d.areas.map(function (a) { return '<li><strong>' + esc(a.name) + ' · ' + a.score + '/6</strong><p>' + esc(a.note) + '</p></li>'; }).join('');
        $('rc-moves').innerHTML = d.moves.map(function (m) { return '<li><strong>' + esc(m.title) + '</strong><p>' + esc(m.detail) + '</p></li>'; }).join('');
        $('rc-full').hidden = false;
        if (window.gtag) gtag('event', 'readiness_lead', { call: !!fd.get('call') });
      })
      .catch(function (err) { btn.disabled = false; st.className = 'ct-status err'; st.textContent = err.message; });
  });

  $('rc-restart').addEventListener('click', function () { window.scrollTo(0, 0); location.reload(); });

  show(0);
})();
