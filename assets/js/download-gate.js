/* Free resource downloads with a short sign-up form (Web3Forms). */
(function () {
  var KEY = 'b9ef0636-110c-4606-9af4-2791890d1021';
  document.querySelectorAll('form.dl-gate').forEach(function (f) {
    var box = f.closest('.dl-box'), done = box.querySelector('.dl-done'), err = f.querySelector('.dl-err'), btn = f.querySelector('button');
    var file = f.dataset.file, title = f.dataset.title;
    function start() {
      var a = document.createElement('a'); a.href = file; a.download = ''; document.body.appendChild(a); a.click(); a.remove();
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault(); err.textContent = '';
      var name = f.name.value.trim(), email = f.email.value.trim();
      if (!name) { err.textContent = 'Please add your name.'; f.name.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please check your email address.'; f.email.focus(); return; }
      if (f.botcheck && f.botcheck.checked) return;
      btn.disabled = true; btn.textContent = 'Preparing your download…';
      var data = { access_key: KEY, subject: 'Worksheet download: ' + title, from_name: 'suchetanabauri.com', name: name, email: email,
        organisation: f.organisation.value.trim() || '—', resource: title, page: location.href };
      var finish = function (ok) {
        f.hidden = true; done.hidden = false; start();
        if (window.gtag) { gtag('event', 'generate_lead', { method: 'worksheet', resource: title }); gtag('event', 'file_download', { file_name: file }); }
        if (!ok) done.querySelector('.dl-note').textContent = 'Your download should start now. If it doesn’t, use the button above.';
      };
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json(); }).then(function (j) { finish(j && j.success); })
        .catch(function () { finish(false); });
    });
  });
})();
