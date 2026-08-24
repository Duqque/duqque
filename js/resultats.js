/* =========================================================
   RÉSULTATS DE L'OBSERVATOIRE — ESPACE ADMINISTRATION
   Toute la lecture se fait ici, dans le navigateur : le serveur se contente de
   rendre les lignes brutes. Cela garde le PHP minuscule et rend cette page
   testable sans hébergement.

   Rappel qui gouverne l'affichage : l'enquête est anonyme. « Réponse par
   réponse » ne veut pas dire « personne par personne » : chaque envoi porte une
   référence, jamais une identité. Les coordonnées volontaires vivent dans une
   vue séparée et ne sont jamais accolées aux réponses.
   ========================================================= */
(function () {
 'use strict';

 const D = document;
 const racine = D.getElementById('resultats');
 if (!racine) return;

 const API = '/api';
 const TITRES = {
  'transferts-athletes': 'Transferts · athlètes',
  'transferts-clubs': 'Transferts · clubs',
  'sponsoring-athletes': 'Sponsoring · athlètes',
  'sponsoring-clubs': 'Sponsoring · clubs'
 };

 let donnees = null;
 let vue = 'ensemble';
 let filtre = '';

 /* --- Utilitaires ---------------------------------------------------------- */
 /* Les libelles arrivent en texte pur depuis le moteur. Le repli sur &nbsp;
    couvre les reponses enregistrees avant que le moteur ne decode les entites :
    sans lui, ces anciennes lignes afficheraient « &nbsp; » en clair. */
 const esc = (t) => String(t == null ? '' : t)
  .replace(/&nbsp;/g, ' ')
  .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

 const nombre = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

 function duree(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  return m < 1 ? s + ' s' : m + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : '');
 }

 function dateFr(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
   ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
 }

 function mediane(t) {
  if (!t.length) return 0;
  const a = t.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
 }

 /* --- Connexion ------------------------------------------------------------ */
 function ecranConnexion(message) {
  racine.innerHTML = `
   <div class="rs-porte">
    <span class="rs-cadenas" aria-hidden="true">
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
    </span>
    <h2 class="serif">Espace réservé</h2>
    <p>Les réponses des participants ne sont pas publiques. Entrez le mot de passe administrateur.</p>
    <form id="rsCo" autocomplete="off">
     <label for="rsMdp">Mot de passe</label>
     <input id="rsMdp" type="password" autocomplete="current-password" required autofocus />
     <button type="submit">Ouvrir les résultats</button>
    </form>
    <p class="rs-msg ${message ? 'ko' : ''}" role="status" aria-live="polite">${esc(message || '')}</p>
   </div>`;

  D.getElementById('rsCo').addEventListener('submit', async function (e) {
   e.preventDefault();
   const b = this.querySelector('button');
   const p = racine.querySelector('.rs-msg');
   b.disabled = true; p.className = 'rs-msg'; p.textContent = 'Vérification…';
   try {
    const r = await fetch(API + '/session.php', {
     method: 'POST', credentials: 'same-origin',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ mdp: D.getElementById('rsMdp').value })
    });
    const j = await r.json();
    if (!j.ok) {
     ecranConnexion(j.attente
      ? 'Mot de passe incorrect. Nouvelle tentative dans ' + j.attente + ' secondes.'
      : (j.erreur === 'trop de tentatives' ? 'Trop de tentatives. Patientez.' : 'Mot de passe incorrect.'));
     return;
    }
    // Repère non secret, lisible par le JavaScript : il ne sert qu'à faire
    // apparaître l'onglet dans le menu. Le vrai jeton est HttpOnly.
    document.cookie = 'duqque_admin_ui=1; Max-Age=2592000; Path=/; SameSite=Lax';
    charger();
   } catch (err) {
    ecranConnexion("Le serveur n'a pas répondu. Vérifiez /api/etat.php.");
   } finally { b.disabled = false; }
  });
 }

 /* --- Chargement ----------------------------------------------------------- */
 async function charger() {
  racine.innerHTML = '<p class="rs-attente-txt">Chargement des réponses…</p>';
  let r;
  try {
   r = await fetch(API + '/resultats.php?contacts=1', { credentials: 'same-origin', cache: 'no-store' });
  } catch (e) {
   racine.innerHTML = panne("Le serveur n'a pas répondu.");
   return;
  }
  if (r.status === 401) { ecranConnexion(''); return; }
  let j;
  try { j = await r.json(); } catch (e) { racine.innerHTML = panne("Réponse illisible du serveur. Le PHP est-il actif ? Ouvrez /api/etat.php."); return; }
  if (!j.ok) { racine.innerHTML = panne(j.erreur || 'Erreur inconnue.'); return; }
  donnees = j;
  rendre();
 }

 function panne(txt) {
  return `<div class="rs-porte"><h2 class="serif">Résultats indisponibles</h2><p>${esc(txt)}</p>
   <p class="rs-msg"><a href="/api/etat.php">Vérifier l'état du dispositif</a></p></div>`;
 }

 /* --- Ossature ------------------------------------------------------------- */
 function rendre() {
  const lignes = filtrees();
  racine.innerHTML = `
   <div class="rs-tete">
    <div>
     <p class="rs-maj">Mise à jour ${esc(dateFr(donnees.genere_le))}</p>
     <h2 class="serif">${nombre(donnees.total)} réponse${donnees.total > 1 ? 's' : ''} collectée${donnees.total > 1 ? 's' : ''}</h2>
    </div>
    <div class="rs-actions">
     <a class="rs-bt" href="${API}/export.php?type=reponses${filtre ? '&q=' + filtre : ''}">Exporter en tableur</a>
     <button class="rs-bt rs-bt-nu" id="rsSortir">Se déconnecter</button>
    </div>
   </div>

   <div class="rs-filtres">
    <select id="rsFiltre" aria-label="Filtrer par questionnaire">
     <option value="">Tous les questionnaires</option>
     ${Object.keys(TITRES).map((k) => `<option value="${k}"${filtre === k ? ' selected' : ''}>${esc(TITRES[k])}</option>`).join('')}
    </select>
    <nav class="rs-onglets" role="tablist">
     ${[['ensemble', "Vue d'ensemble"], ['questions', 'Question par question'],
        ['reponses', 'Réponse par réponse'], ['contacts', 'Coordonnées']]
       .map(([k, l]) => `<button role="tab" aria-selected="${vue === k}" data-vue="${k}">${l}</button>`).join('')}
    </nav>
   </div>

   <div class="rs-corps">${
    lignes.length === 0 && vue !== 'contacts'
     ? `<div class="rs-vide"><h3>Aucune réponse pour l'instant</h3>
        <p>Dès qu'un participant valide un questionnaire, sa réponse apparaît ici, et les indicateurs se recalculent.</p>
        <a class="rs-bt" href="observatoire.html">Voir les questionnaires publiés</a></div>`
     : ({ ensemble: vueEnsemble, questions: vueQuestions, reponses: vueReponses, contacts: vueContacts }[vue])(lignes)
   }</div>`;

  racine.querySelectorAll('[data-vue]').forEach((b) =>
   b.addEventListener('click', () => { vue = b.dataset.vue; rendre(); }));
  D.getElementById('rsFiltre').addEventListener('change', function () { filtre = this.value; rendre(); });
  D.getElementById('rsSortir').addEventListener('click', async () => {
   await fetch(API + '/session.php?stop=1', { credentials: 'same-origin' });
   document.cookie = 'duqque_admin_ui=; Max-Age=0; Path=/';
   ecranConnexion('Vous êtes déconnecté.');
  });
  racine.querySelectorAll('[data-detail]').forEach((b) =>
   b.addEventListener('click', () => {
    const c = D.getElementById('d-' + b.dataset.detail);
    const ouvert = c.hasAttribute('hidden');
    if (ouvert) c.removeAttribute('hidden'); else c.setAttribute('hidden', '');
    b.setAttribute('aria-expanded', String(ouvert));
    b.querySelector('.rs-chev').style.transform = ouvert ? 'rotate(90deg)' : '';
   }));
 }

 const filtrees = () => donnees.reponses.filter((l) => !filtre || l.questionnaire === filtre);

 /* --- Vue d'ensemble : les indicateurs ------------------------------------- */
 function vueEnsemble(lignes) {
  const durees = lignes.map((l) => l.duree_s).filter((d) => d > 0);
  const refsAvecContact = new Set(donnees.contacts.map((c) => c.ref));
  const avecContact = lignes.filter((l) => refsAvecContact.has(l.ref)).length;
  const dernier = lignes.reduce((a, l) => (!a || l.recu_le > a ? l.recu_le : a), '');

  const parQ = {};
  Object.keys(TITRES).forEach((k) => { parQ[k] = 0; });
  lignes.forEach((l) => { parQ[l.questionnaire] = (parQ[l.questionnaire] || 0) + 1; });

  const parCible = {};
  lignes.forEach((l) => { parCible[l.cible || '—'] = (parCible[l.cible || '—'] || 0) + 1; });

  const kpi = [
   ['Réponses', nombre(lignes.length), filtre ? 'sur ce questionnaire' : 'tous questionnaires confondus'],
   ['Durée médiane', duree(mediane(durees)), 'temps de remplissage'],
   ['Coordonnées laissées', avecContact + (lignes.length ? ' · ' + Math.round((avecContact / lignes.length) * 100) + ' %' : ''), 'participants joignables'],
   ['Dernière réponse', dernier ? dateFr(dernier).split(' à ')[0] : '—', dernier ? dateFr(dernier).split(' à ')[1] : 'aucune']
  ];

  return `
   <div class="rs-kpis">${kpi.map(([t, v, s]) => `
    <div class="rs-kpi"><span class="l">${esc(t)}</span><span class="v">${v}</span><small>${esc(s)}</small></div>`).join('')}</div>

   <section class="rs-bloc">
    <h3>Répartition par questionnaire</h3>
    ${barres(Object.keys(parQ).map((k) => ({ valeur: TITRES[k], n: parQ[k] })), lignes.length)}
   </section>

   <section class="rs-bloc">
    <h3>Répartition par public</h3>
    ${barres(Object.keys(parCible).map((k) => ({ valeur: k, n: parCible[k] })), lignes.length)}
   </section>

   <section class="rs-bloc">
    <h3>Réponses reçues, jour par jour</h3>
    ${calendrier(lignes)}
   </section>`;
 }

 /* Trente derniers jours : une colonne par jour, la hauteur dit le volume.
    Un histogramme sur une période fixe se lit mieux qu'une courbe qui s'étire. */
 function calendrier(lignes) {
  const jours = [];
  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
   const d = new Date(auj); d.setDate(d.getDate() - i);
   jours.push({ cle: d.toISOString().slice(0, 10), d: d, n: 0 });
  }
  const index = {}; jours.forEach((j) => { index[j.cle] = j; });
  lignes.forEach((l) => { const k = String(l.recu_le).slice(0, 10); if (index[k]) index[k].n++; });
  const max = Math.max(1, ...jours.map((j) => j.n));

  return `<div class="rs-cal">${jours.map((j) => `
   <div class="rs-cal-j" title="${j.d.toLocaleDateString('fr-FR')} : ${j.n} réponse${j.n > 1 ? 's' : ''}">
    <span class="rs-cal-b" style="height:${Math.max(3, Math.round((j.n / max) * 100))}%"></span>
   </div>`).join('')}</div>
   <div class="rs-cal-leg"><span>il y a 30 jours</span><span>aujourd'hui</span></div>`;
 }

 /* --- Vue question par question --------------------------------------------
    Le regroupement se fait par questionnaire ET par identifiant. Les quatre
    questionnaires partagent des identifiants (a_cat, a_region…) pour les
    questions de profil : les fusionner additionnerait les réponses de deux
    populations differentes dans un meme graphique. */
 function vueQuestions(lignes) {
  const parQ = {}; const ordreQ = [];
  lignes.forEach((l) => {
   if (!parQ[l.questionnaire]) { parQ[l.questionnaire] = { n: 0, q: {}, ordre: [] }; ordreQ.push(l.questionnaire); }
   const g = parQ[l.questionnaire];
   g.n++;
   (l.reponses || []).forEach((r) => {
    if (!g.q[r.id]) { g.q[r.id] = { libelle: r.libelle, type: r.type, section: r.section, valeurs: [], repondants: 0 }; g.ordre.push(r.id); }
    const v = r.valeur;
    (Array.isArray(v) ? v : [v]).forEach((x) => g.q[r.id].valeurs.push(x));
    g.q[r.id].repondants++;
   });
  });

  if (!ordreQ.length) return `<div class="rs-vide"><h3>Rien à afficher</h3><p>Aucune réponse ne correspond à ce filtre.</p></div>`;

  return ordreQ.map((idq) => {
   const g = parQ[idq];
   let sectionCourante = null;
   const corps = g.ordre.map((id) => {
    const o = g.q[id];
    let entete = '';
    if (o.section && o.section !== sectionCourante) { sectionCourante = o.section; entete = `<p class="rs-section">${esc(o.section)}</p>`; }
    return entete + `<section class="rs-bloc rs-q">
      <h3>${esc(o.libelle)}</h3>
      <p class="rs-q-meta">${o.repondants} réponse${o.repondants > 1 ? 's' : ''} sur ${g.n} · ${etiquetteType(o.type)}</p>
      ${corpsQuestion(o)}
     </section>`;
   }).join('');
   // Un seul questionnaire affiche : l'intitule serait redondant avec le filtre.
   const titre = ordreQ.length > 1
    ? `<h3 class="rs-groupe">${esc(TITRES[idq] || idq)}<small>${g.n} réponse${g.n > 1 ? 's' : ''}</small></h3>` : '';
   return titre + corps;
  }).join('');
 }

 function etiquetteType(t) {
  return { choix: 'choix unique', multi: 'choix multiple', liste: 'liste déroulante',
   echelle: 'échelle de 1 à 5', nombre: 'valeur chiffrée', long: 'réponse libre',
   texte: 'texte court', email: 'adresse', tel: 'téléphone' }[t] || t;
 }

 function corpsQuestion(o) {
  if (o.type === 'echelle') return echelle(o);
  if (o.type === 'nombre') return chiffres(o);
  if (o.type === 'long' || o.type === 'texte') return verbatims(o);
  const c = {};
  o.valeurs.forEach((v) => { const k = String(v).trim(); if (k) c[k] = (c[k] || 0) + 1; });
  return barres(Object.keys(c).map((k) => ({ valeur: k, n: c[k] })), o.repondants);
 }

 /* Barres horizontales : sur un téléphone, un camembert de huit parts est
    illisible, une barre se lit à l'échelle sans légende. */
 function barres(vals, total) {
  const tri = vals.filter((v) => v.n > 0).sort((a, b) => b.n - a.n);
  if (!tri.length) return '<p class="rs-rien">Aucune donnée.</p>';
  const max = Math.max.apply(null, tri.map((v) => v.n)) || 1;
  return `<div class="rs-barres">${tri.map((v) => `
   <div class="rs-ligne">
    <span class="rs-lib">${esc(v.valeur)}</span>
    <span class="rs-piste"><span class="rs-jauge" style="width:${Math.round((v.n / max) * 100)}%"></span></span>
    <span class="rs-val">${v.n}<small>${total ? Math.round((v.n / total) * 100) : 0}&nbsp;%</small></span>
   </div>`).join('')}</div>`;
 }

 function echelle(o) {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let somme = 0, n = 0;
  o.valeurs.forEach((v) => { const x = parseInt(v, 10); if (x >= 1 && x <= 5) { c[x]++; somme += x; n++; } });
  const moy = n ? (somme / n) : 0;
  const max = Math.max(1, ...Object.values(c));
  return `<div class="rs-echelle">
    <div class="rs-moy"><span class="v">${moy.toFixed(1)}</span><small>moyenne sur 5</small>
     <span class="rs-jauge-moy"><span style="width:${(moy / 5) * 100}%"></span></span></div>
    <div class="rs-colonnes">${[1, 2, 3, 4, 5].map((k) => `
     <div class="rs-col" title="${c[k]} réponse${c[k] > 1 ? 's' : ''}">
      <span class="rs-col-n">${c[k]}</span>
      <span class="rs-col-b" style="height:${Math.max(4, Math.round((c[k] / max) * 100))}%"></span>
      <span class="rs-col-l">${k}</span>
     </div>`).join('')}</div>
   </div>`;
 }

 function chiffres(o) {
  const t = o.valeurs.map((v) => parseFloat(String(v).replace(',', '.'))).filter((x) => !isNaN(x));
  if (!t.length) return '<p class="rs-rien">Aucune valeur chiffrée.</p>';
  const somme = t.reduce((a, b) => a + b, 0);
  const st = [['Moyenne', (somme / t.length).toFixed(1)], ['Médiane', String(mediane(t))],
              ['Minimum', String(Math.min.apply(null, t))], ['Maximum', String(Math.max.apply(null, t))]];
  return `<div class="rs-stats">${st.map(([l, v]) => `<div><span class="l">${l}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>`;
 }

 function verbatims(o) {
  const t = o.valeurs.map((v) => String(v).trim()).filter(Boolean);
  if (!t.length) return '<p class="rs-rien">Aucune réponse rédigée.</p>';
  return `<ul class="rs-verbatims">${t.map((v) => `<li>${esc(v)}</li>`).join('')}</ul>`;
 }

 /* --- Vue réponse par réponse ---------------------------------------------- */
 function vueReponses(lignes) {
  const tri = lignes.slice().sort((a, b) => String(b.recu_le).localeCompare(String(a.recu_le)));
  return `<p class="rs-avis">Chaque ligne est un envoi, pas une personne&nbsp;: le questionnaire est anonyme et ne
   demande aucune information identifiante. Les coordonnées volontaires sont dans l'onglet suivant.</p>
   <div class="rs-table">${tri.map((l) => `
    <article class="rs-env">
     <button class="rs-env-tete" data-detail="${esc(l.ref)}" aria-expanded="false" aria-controls="d-${esc(l.ref)}">
      <span class="rs-chev" aria-hidden="true">›</span>
      <span class="rs-ref">${esc(l.ref)}</span>
      <span class="rs-env-q">${esc(TITRES[l.questionnaire] || l.questionnaire)}</span>
      <span class="rs-env-d">${esc(dateFr(l.recu_le))}</span>
      <span class="rs-env-x">${(l.reponses || []).length} rép. · ${esc(duree(l.duree_s))}</span>
     </button>
     <div class="rs-env-corps" id="d-${esc(l.ref)}" hidden>
      ${(l.reponses || []).map((r) => `<div class="rs-paire">
        <span class="q">${esc(r.libelle || r.id)}</span>
        <span class="r">${esc(Array.isArray(r.valeur) ? r.valeur.join(' · ') : r.valeur)}</span>
       </div>`).join('')}
     </div>
    </article>`).join('')}</div>`;
 }

 /* --- Vue coordonnées ------------------------------------------------------ */
 function vueContacts() {
  const c = donnees.contacts.filter((x) => !filtre || x.questionnaire === filtre);
  if (!c.length) return `<div class="rs-vide"><h3>Aucune coordonnée</h3>
   <p>Personne n'a encore souhaité être recontacté. C'est une case facultative, en fin de questionnaire.</p></div>`;
  return `<p class="rs-avis">Ces personnes ont explicitement demandé à être recontactées. Leurs coordonnées sont
   conservées à part de leurs réponses&nbsp;: la référence permet de retrouver l'envoi, elle ne le révèle pas ici.</p>
   <div class="rs-actions" style="margin-bottom:18px"><a class="rs-bt" href="${API}/export.php?type=contacts">Exporter les coordonnées</a></div>
   <div class="rs-table">${c.map((x) => `
    <article class="rs-env">
     <div class="rs-env-tete rs-env-tete--fixe">
      <span class="rs-ref">${esc(x.ref)}</span>
      <span class="rs-env-q">${esc(TITRES[x.questionnaire] || x.questionnaire)}</span>
      <span class="rs-env-d">${esc(dateFr(x.recu_le))}</span>
     </div>
     <div class="rs-env-corps">
      ${(x.contact || []).map((r) => `<div class="rs-paire">
        <span class="q">${esc(r.libelle || r.id)}</span>
        <span class="r">${esc(Array.isArray(r.valeur) ? r.valeur.join(' · ') : r.valeur)}</span>
       </div>`).join('')}
     </div>
    </article>`).join('')}</div>`;
 }

 /* --- Démarrage ------------------------------------------------------------ */
 fetch(API + '/session.php', { credentials: 'same-origin', cache: 'no-store' })
  .then((r) => r.json())
  .then((j) => { if (j.ok && j.connecte) charger(); else ecranConnexion(''); })
  .catch(() => ecranConnexion("Le serveur ne répond pas. Si le site vient d'être déposé, ouvrez /api/etat.php."));
})();
