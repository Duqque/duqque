/* =========================================================
   CHAMPS ASSISTÉS
   Trois contrôles qui n'existent pas en HTML : une liste de pays qui se cherche
   au clavier, un téléphone avec son indicatif, et une adresse qui se complète.

   Tout se dégrade proprement. Sans JavaScript, sans réseau, ou si le service
   d'adresses ne répond pas, il reste des champs texte ordinaires : on ne bloque
   jamais une adhésion parce qu'une aide à la saisie est indisponible.
   ========================================================= */
(function () {
 'use strict';

 const D = document;
 const P = window.PAYS;

 const echapper = (t) => String(t == null ? '' : t)
  .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

 /* --- Liste déroulante avec recherche ---------------------------------------
    Un select natif de 242 entrées oblige à faire défiler ; une saisie libre
    laisse passer « Bresil », « BR » et « brésile ». D'où un champ qui filtre. */
 function combo(hote, opts) {
  const id = hote.id;
  const rendu = opts.rendu || ((p) => p.drapeau + ' ' + p.nom);
  let ouvert = false, actif = -1, liste = [];

  hote.innerHTML =
   '<div class="ch-combo">' +
    '<input type="text" class="ch-saisie" id="' + id + '_saisie" autocomplete="off" role="combobox"' +
     ' aria-expanded="false" aria-autocomplete="list" aria-controls="' + id + '_liste"' +
     ' placeholder="' + echapper(opts.placeholder || 'Rechercher…') + '" />' +
    '<ul class="ch-liste" id="' + id + '_liste" role="listbox" hidden></ul>' +
   '</div>';

  const saisie = hote.querySelector('.ch-saisie');
  const ul = hote.querySelector('.ch-liste');

  if (opts.valeur && P.parCode[opts.valeur]) saisie.value = rendu(P.parCode[opts.valeur]);

  function fermer() { ouvert = false; actif = -1; ul.hidden = true; saisie.setAttribute('aria-expanded', 'false'); }

  function dessiner(q) {
   liste = P.chercher(q, 9);
   if (!liste.length) { fermer(); return; }
   ul.innerHTML = liste.map((p, i) =>
    '<li role="option" id="' + id + '_o' + i + '" data-code="' + p.code + '"' +
    (i === actif ? ' aria-selected="true" class="on"' : ' aria-selected="false"') + '>' +
     '<span class="ch-dr">' + p.drapeau + '</span><span class="ch-nom">' + echapper(p.nom) + '</span>' +
     (opts.montrerIndicatif ? '<span class="ch-ind">' + p.indicatif + '</span>' : '') +
    '</li>').join('');
   ul.hidden = false; ouvert = true; saisie.setAttribute('aria-expanded', 'true');
  }

  function choisir(p) {
   if (!p) return;
   saisie.value = rendu(p);
   fermer();
   if (opts.onChoix) opts.onChoix(p);
  }

  saisie.addEventListener('input', () => { actif = -1; dessiner(saisie.value); });
  saisie.addEventListener('focus', () => dessiner(saisie.value === rendu(P.parCode[opts.valeur] || {}) ? '' : saisie.value));
  saisie.addEventListener('blur', () => setTimeout(fermer, 160));

  saisie.addEventListener('keydown', (e) => {
   if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!ouvert) { dessiner(saisie.value); return; }
    actif = e.key === 'ArrowDown' ? Math.min(actif + 1, liste.length - 1) : Math.max(actif - 1, 0);
    dessiner(saisie.value);
    saisie.setAttribute('aria-activedescendant', id + '_o' + actif);
    const el = ul.children[actif]; if (el) el.scrollIntoView({ block: 'nearest' });
   } else if (e.key === 'Enter') {
    if (ouvert) { e.preventDefault(); choisir(liste[actif >= 0 ? actif : 0]); }
   } else if (e.key === 'Escape') { fermer(); }
  });

  ul.addEventListener('mousedown', (e) => {
   const li = e.target.closest('li'); if (!li) return;
   e.preventDefault();
   choisir(P.parCode[li.dataset.code]);
  });

  return { saisie: saisie, poser: (code) => { const p = P.parCode[code]; if (p) { saisie.value = rendu(p); if (opts.onChoix) opts.onChoix(p); } } };
 }

 /* --- Téléphone -------------------------------------------------------------
    L'indicatif suit le pays choisi plus haut, tant que personne n'y a touché.
    Dès qu'il est modifié à la main, il ne bouge plus : un athlète installé en
    France peut garder un numéro portugais. */
 function telephone(hote, opts) {
  hote.innerHTML =
   '<div class="ch-tel">' +
    '<button type="button" class="ch-prefixe" aria-haspopup="listbox" aria-expanded="false">' +
     '<span class="ch-dr"></span><span class="ch-ind"></span>' +
     '<span class="ch-caret" aria-hidden="true">▾</span></button>' +
    '<div class="ch-tel-pop" hidden><div class="ch-pop-hote" id="' + hote.id + '_pop"></div></div>' +
    '<input type="tel" class="ch-numero" id="' + hote.id + '_num" autocomplete="tel-national"' +
     ' inputmode="tel" placeholder="6 12 34 56 78" />' +
   '</div>';

  const bouton = hote.querySelector('.ch-prefixe');
  const pop = hote.querySelector('.ch-tel-pop');
  const num = hote.querySelector('.ch-numero');
  let code = opts.pays || 'FR';
  let force = false;   // l'indicatif a-t-il été choisi à la main ?

  function afficher() {
   const p = P.parCode[code] || P.parCode.FR;
   bouton.querySelector('.ch-dr').textContent = p.drapeau;
   bouton.querySelector('.ch-ind').textContent = p.indicatif;
   bouton.setAttribute('aria-label', 'Indicatif : ' + p.nom + ' ' + p.indicatif);
  }

  function valeur() {
   const n = num.value.replace(/\s+/g, ' ').trim();
   if (!n) return '';
   return (P.parCode[code] || P.parCode.FR).indicatif + ' ' + n;
  }

  combo(hote.querySelector('.ch-pop-hote'), {
   placeholder: 'Pays ou indicatif…', montrerIndicatif: true,
   rendu: (p) => p.drapeau + ' ' + p.nom + ' ' + p.indicatif,
   onChoix: (p) => { code = p.code; force = true; afficher(); pop.hidden = true;
                     bouton.setAttribute('aria-expanded', 'false'); num.focus(); if (opts.onChange) opts.onChange(valeur(), code); }
  });

  bouton.addEventListener('click', () => {
   const o = pop.hidden;
   pop.hidden = !o;
   bouton.setAttribute('aria-expanded', String(o));
   if (o) pop.querySelector('.ch-saisie').focus();
  });
  D.addEventListener('click', (e) => {
   if (!hote.contains(e.target)) { pop.hidden = true; bouton.setAttribute('aria-expanded', 'false'); }
  });
  num.addEventListener('input', () => { if (opts.onChange) opts.onChange(valeur(), code); });

  if (opts.valeur) {
   // Remet en place un numéro déjà saisi : indicatif d'un côté, reste de l'autre.
   const m = String(opts.valeur).match(/^(\+\d+)\s*(.*)$/);
   if (m) {
    const trouve = P.tous.filter((p) => p.indicatif === m[1]);
    if (trouve.length) { code = (trouve.filter((p) => p.code === opts.pays)[0] || trouve[0]).code; force = true; }
    num.value = m[2];
   } else num.value = opts.valeur;
  }
  afficher();

  return {
   valeur: valeur,
   suivrePays: (nouveau) => { if (!force && P.parCode[nouveau]) { code = nouveau; afficher(); if (opts.onChange) opts.onChange(valeur(), code); } }
  };
 }

 /* --- Commune ---------------------------------------------------------------
    Demandee avant l'adresse : une fois la commune connue, la recherche de rue
    porte sur quelques milliers d'adresses au lieu de vingt-cinq millions. Les
    propositions deviennent justes des les premieres lettres, et « 12 rue de
    Rivoli » ne renvoie plus quatre villes differentes. */
 function ville(hote, opts) {
  hote.innerHTML =
   '<div class="ch-combo">' +
    '<input type="text" class="ch-saisie ch-vil" id="' + hote.id + '_saisie" autocomplete="address-level2"' +
     ' role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="' + hote.id + '_liste"' +
     ' placeholder="Commencez à taper le nom de la commune" />' +
    '<ul class="ch-liste" id="' + hote.id + '_liste" role="listbox" hidden></ul>' +
    '<p class="ch-aide-adr" hidden>Service indisponible, saisissez librement.</p>' +
   '</div>';

  const saisie = hote.querySelector('.ch-saisie');
  const ul = hote.querySelector('.ch-liste');
  const avis = hote.querySelector('.ch-aide-adr');
  let liste = [], actif = -1, minuteur = null, pays = opts.pays || 'FR';

  if (opts.valeur) saisie.value = opts.valeur;

  function fermer() { ul.hidden = true; actif = -1; saisie.setAttribute('aria-expanded', 'false'); }

  function dessiner() {
   if (!liste.length) { fermer(); return; }
   ul.innerHTML = liste.map(function (f, i) {
    const p = f.properties;
    return '<li role="option" data-i="' + i + '"' + (i === actif ? ' class="on" aria-selected="true"' : ' aria-selected="false"') + '>' +
     '<span class="ch-nom">' + echapper(p.city || p.name) + '</span>' +
     '<span class="ch-ville">' + echapper(p.postcode || '') + '</span></li>';
   }).join('');
   ul.hidden = false; saisie.setAttribute('aria-expanded', 'true');
  }

  function chercher(q) {
   if (pays !== 'FR' || q.trim().length < 2) { liste = []; fermer(); return; }
   fetch('https://api-adresse.data.gouv.fr/search/?type=municipality&limit=7&q=' + encodeURIComponent(q))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (j) { avis.hidden = true; liste = j.features || []; dessiner(); })
    .catch(function () { avis.hidden = false; liste = []; fermer(); });
  }

  function choisir(f) {
   if (!f) return;
   const p = f.properties;
   saisie.value = p.city || p.name;
   fermer();
   if (opts.onChoix) opts.onChoix({ ville: p.city || p.name, cp: p.postcode || '', insee: p.citycode || '' });
  }

  saisie.addEventListener('input', function () {
   if (opts.onSaisie) opts.onSaisie(saisie.value);
   clearTimeout(minuteur);
   minuteur = setTimeout(function () { chercher(saisie.value); }, 260);
  });
  saisie.addEventListener('blur', function () { setTimeout(fermer, 160); });
  saisie.addEventListener('keydown', function (e) {
   if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!liste.length) return;
    e.preventDefault();
    actif = e.key === 'ArrowDown' ? Math.min(actif + 1, liste.length - 1) : Math.max(actif - 1, 0);
    dessiner();
   } else if (e.key === 'Enter' && !ul.hidden) { e.preventDefault(); choisir(liste[actif >= 0 ? actif : 0]); }
   else if (e.key === 'Escape') fermer();
  });
  ul.addEventListener('mousedown', function (e) {
   const li = e.target.closest('li'); if (!li) return;
   e.preventDefault(); choisir(liste[+li.dataset.i]);
  });

  return { changerPays: function (c) { pays = c; if (c !== 'FR') { liste = []; fermer(); } } };
 }

 /* --- Adresse ---------------------------------------------------------------
    Complétée par la Base Adresse Nationale, le service public d'adresses de
    l'État. Aucune clé, aucun compte, aucun traceur : la saisie part vers
    api-adresse.data.gouv.fr et rien d'autre n'en sort. Hors de France, le champ
    reste un champ texte : ce service ne couvre que le territoire français. */
 function adresse(hote, opts) {
  hote.innerHTML =
   '<div class="ch-combo">' +
    '<input type="text" class="ch-saisie ch-adr" id="' + hote.id + '_saisie" autocomplete="street-address"' +
     ' role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="' + hote.id + '_liste"' +
     ' placeholder="Numéro et nom de rue" />' +
    '<ul class="ch-liste" id="' + hote.id + '_liste" role="listbox" hidden></ul>' +
    '<p class="ch-aide-adr" hidden>Service d\'adresses indisponible, saisissez librement.</p>' +
   '</div>';

  const saisie = hote.querySelector('.ch-saisie');
  const ul = hote.querySelector('.ch-liste');
  const avis = hote.querySelector('.ch-aide-adr');
  let liste = [], actif = -1, minuteur = null, actif_pays = opts.pays || 'FR';
  let insee = opts.insee || '';

  if (opts.valeur) saisie.value = opts.valeur;

  function fermer() { ul.hidden = true; actif = -1; saisie.setAttribute('aria-expanded', 'false'); }

  function dessiner() {
   if (!liste.length) { fermer(); return; }
   ul.innerHTML = liste.map((f, i) => {
    const p = f.properties;
    return '<li role="option" data-i="' + i + '"' + (i === actif ? ' class="on" aria-selected="true"' : ' aria-selected="false"') + '>' +
     '<span class="ch-nom">' + echapper(p.name || p.label) + '</span>' +
     '<span class="ch-ville">' + echapper((p.postcode || '') + ' ' + (p.city || '')) + '</span></li>';
   }).join('');
   ul.hidden = false; saisie.setAttribute('aria-expanded', 'true');
  }

  function chercher(q) {
   if (actif_pays !== 'FR' || q.trim().length < 3) { liste = []; fermer(); return; }
   // citycode restreint la recherche a la commune deja choisie : c'est ce qui
   // evite de proposer la meme rue dans quatre villes.
   fetch('https://api-adresse.data.gouv.fr/search/?limit=6&autocomplete=1' +
         (insee ? '&citycode=' + encodeURIComponent(insee) : '') +
         '&q=' + encodeURIComponent(q))
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((j) => { avis.hidden = true; liste = j.features || []; dessiner(); })
    .catch(() => { avis.hidden = false; liste = []; fermer(); });
  }

  function choisir(f) {
   if (!f) return;
   const p = f.properties;
   saisie.value = p.name || p.label;
   fermer();
   if (opts.onChoix) opts.onChoix({ rue: p.name || p.label, cp: p.postcode || '', ville: p.city || '' });
  }

  saisie.addEventListener('input', () => {
   if (opts.onSaisie) opts.onSaisie(saisie.value);
   clearTimeout(minuteur);
   // 280 ms : on interroge le service quand la frappe s'arrête, pas à chaque touche.
   minuteur = setTimeout(() => chercher(saisie.value), 280);
  });
  saisie.addEventListener('blur', () => setTimeout(fermer, 160));
  saisie.addEventListener('keydown', (e) => {
   if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!liste.length) return;
    e.preventDefault();
    actif = e.key === 'ArrowDown' ? Math.min(actif + 1, liste.length - 1) : Math.max(actif - 1, 0);
    dessiner();
   } else if (e.key === 'Enter' && !ul.hidden) { e.preventDefault(); choisir(liste[actif >= 0 ? actif : 0]); }
   else if (e.key === 'Escape') fermer();
  });
  ul.addEventListener('mousedown', (e) => {
   const li = e.target.closest('li'); if (!li) return;
   e.preventDefault(); choisir(liste[+li.dataset.i]);
  });

  return {
   saisie: saisie,
   changerPays: function (c) { actif_pays = c; if (c !== 'FR') { liste = []; fermer(); } },
   changerCommune: function (code) { insee = code || ''; }
  };
 }

 window.CHAMPS = { combo: combo, telephone: telephone, adresse: adresse, ville: ville };
})();
