/* =========================================================
   MOTEUR D'ENQUÊTE
   Les quatre questionnaires de l'Observatoire partagent ce moteur : ils ne
   different que par leur specification, un simple tableau de sections.

   Ce que le moteur garantit :
   - anonymat par defaut, coordonnees strictement facultatives et isolees ;
   - une question a la fois sur telephone, une section par ecran ;
   - reprise automatique : les reponses sont gardees en local tant que le
     questionnaire n'est pas envoye, une session interrompue n'est pas perdue ;
   - envoi vers un point d'entree unique, defini par window.ENQUETE_ENDPOINT.

   Le site est statique : sans ce point d'entree, le moteur bascule sur un envoi
   par messagerie plutot que d'echouer en silence.
   ========================================================= */
(function () {
 'use strict';

 const D = document;
 const spec = window.ENQUETE;
 if (!spec) return;

 const racine = D.getElementById('enquete');
 if (!racine) return;

 const CLE = 'duqque_enq_' + spec.id;
 const DEPART = Date.now();
 let etape = 0;
 let reponses = lire();

 /* Les libelles portent du balisage et des entites (&nbsp; devant les points
    d'interrogation). Les envoyer tels quels afficherait « &nbsp; » en clair dans
    la page resultats : on les ramene a du texte une bonne fois. */
 function texteBrut(html) {
  const d = D.createElement('div');
  d.innerHTML = String(html == null ? '' : html);
  return (d.textContent || '').replace(/\u00a0/g, ' ').trim();
 }

 function lire() {
  try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; }
 }
 function ecrire() {
  try { localStorage.setItem(CLE, JSON.stringify(reponses)); } catch (e) {}
 }

 /* --- Rendu d'une question ------------------------------------------------- */
 function champ(q) {
  const v = reponses[q.id];
  const req = q.requis ? ' required' : '';
  const aide = q.aide ? `<p class="eq-aide">${q.aide}</p>` : '';
  let corps = '';

  if (q.type === 'texte' || q.type === 'email' || q.type === 'tel' || q.type === 'nombre') {
   const t = q.type === 'nombre' ? 'number' : (q.type === 'texte' ? 'text' : q.type);
   const attrs = q.type === 'nombre' ? ' min="0" inputmode="numeric"' : '';
   corps = `<input type="${t}" id="${q.id}" name="${q.id}"${attrs}${req}
     value="${v ? String(v).replace(/"/g, '&quot;') : ''}"
     ${q.exemple ? `placeholder="${q.exemple}"` : ''} />`;

  } else if (q.type === 'long') {
   corps = `<textarea id="${q.id}" name="${q.id}" rows="4"${req}
     ${q.exemple ? `placeholder="${q.exemple}"` : ''}>${v || ''}</textarea>`;

  } else if (q.type === 'choix') {
   corps = '<div class="eq-choix">' + q.options.map((o, i) => `
     <label class="eq-opt${v === o ? ' on' : ''}">
      <input type="radio" name="${q.id}" value="${o}"${v === o ? ' checked' : ''}${req && i === 0 ? ' required' : ''} />
      <span>${o}</span>
     </label>`).join('') + '</div>';

  } else if (q.type === 'multi') {
   const vals = Array.isArray(v) ? v : [];
   corps = '<div class="eq-choix">' + q.options.map((o) => `
     <label class="eq-opt${vals.indexOf(o) >= 0 ? ' on' : ''}">
      <input type="checkbox" name="${q.id}" value="${o}"${vals.indexOf(o) >= 0 ? ' checked' : ''} />
      <span>${o}</span>
     </label>`).join('') + '</div>';

  } else if (q.type === 'echelle') {
   const min = q.min || 1, max = q.max || 5;
   let b = '';
   for (let i = min; i <= max; i++) {
    b += `<label class="eq-note${String(v) === String(i) ? ' on' : ''}">
      <input type="radio" name="${q.id}" value="${i}"${String(v) === String(i) ? ' checked' : ''}${req && i === min ? ' required' : ''} />
      <span>${i}</span></label>`;
   }
   corps = `<div class="eq-echelle">${b}</div>
     <div class="eq-bornes"><span>${q.bas || ''}</span><span>${q.haut || ''}</span></div>`;

  } else if (q.type === 'liste') {
   corps = `<select id="${q.id}" name="${q.id}"${req}>
     <option value="">Choisir</option>
     ${q.options.map((o) => `<option${v === o ? ' selected' : ''}>${o}</option>`).join('')}
    </select>`;
  }

  return `<div class="eq-q" data-q="${q.id}">
    <label class="eq-lib" ${q.type === 'choix' || q.type === 'multi' || q.type === 'echelle' ? '' : `for="${q.id}"`}>
     ${q.libelle}${q.requis ? '' : ' <em>facultatif</em>'}
    </label>
    ${aide}
    ${corps}
   </div>`;
 }

 /* --- Rendu d'une section --------------------------------------------------- */
 function rendre() {
  const s = spec.sections[etape];
  const dernier = etape === spec.sections.length - 1;
  const pct = Math.round((etape / spec.sections.length) * 100);

  racine.innerHTML = `
   <div class="eq-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
        aria-label="Progression du questionnaire">
    <div class="eq-bar-piste"><div class="eq-bar-jauge" style="transform: scaleX(${pct / 100})"></div></div>
    <span class="eq-bar-pct">${pct}&nbsp;%</span>
   </div>

   <p class="eq-etape">Section ${etape + 1} sur ${spec.sections.length}</p>
   <h2 class="serif eq-titre">${s.titre}</h2>
   ${s.intro ? `<p class="eq-intro">${s.intro}</p>` : ''}

   <form class="eq-form" novalidate>
    ${s.questions.map(champ).join('')}
    <div class="eq-piege" aria-hidden="true">
     <label for="eqSociete">Ne remplissez pas ce champ</label>
     <input id="eqSociete" name="societe" type="text" tabindex="-1" autocomplete="off" />
    </div>
    <div class="eq-nav">
     ${etape > 0 ? '<button type="button" class="eq-retour" data-prec>Retour</button>' : '<span></span>'}
     <button type="submit" class="eq-suivant">${dernier ? 'Envoyer mes réponses' : 'Continuer'}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.8"/></svg>
     </button>
    </div>
    <p class="eq-msg" role="status" aria-live="polite"></p>
   </form>`;

  racine.querySelector('.eq-form').addEventListener('submit', suivant);
  const prec = racine.querySelector('[data-prec]');
  if (prec) prec.addEventListener('click', () => { collecte(); etape--; rendre(); });

  // Retour visuel immediat sur les options cochees.
  racine.querySelectorAll('.eq-opt input, .eq-note input').forEach((i) => {
   i.addEventListener('change', () => {
    const groupe = racine.querySelectorAll(`[name="${i.name}"]`);
    groupe.forEach((g) => g.closest('label').classList.toggle('on', g.checked));
   });
  });

  racine.scrollIntoView({ block: 'start', behavior: etape ? 'smooth' : 'auto' });
 }

 /* --- Collecte et validation ------------------------------------------------ */
 function collecte() {
  const f = racine.querySelector('.eq-form');
  if (!f) return;
  spec.sections[etape].questions.forEach((q) => {
   if (q.type === 'multi') {
    reponses[q.id] = [...f.querySelectorAll(`[name="${q.id}"]:checked`)].map((e) => e.value);
   } else {
    const e = f.querySelector(`[name="${q.id}"]:checked`) || f.querySelector(`[name="${q.id}"]`);
    if (e) reponses[q.id] = e.value;
   }
  });
  ecrire();
 }

 function manquantes() {
  const f = racine.querySelector('.eq-form');
  return spec.sections[etape].questions.filter((q) => {
   if (!q.requis) return false;
   if (q.type === 'multi') return f.querySelectorAll(`[name="${q.id}"]:checked`).length === 0;
   const e = f.querySelector(`[name="${q.id}"]:checked`) || f.querySelector(`[name="${q.id}"]`);
   return !e || !e.value.trim();
  });
 }

 function suivant(ev) {
  ev.preventDefault();
  const msg = racine.querySelector('.eq-msg');
  const trous = manquantes();
  if (trous.length) {
   msg.className = 'eq-msg ko';
   msg.textContent = trous.length === 1
    ? 'Une réponse manque avant de continuer.'
    : trous.length + ' réponses manquent avant de continuer.';
   const bloc = racine.querySelector(`[data-q="${trous[0].id}"]`);
   bloc.classList.add('vide');
   bloc.scrollIntoView({ block: 'center', behavior: 'smooth' });
   return;
  }
  collecte();
  if (etape < spec.sections.length - 1) { etape++; rendre(); return; }
  envoyer();
 }

 /* --- Envoi ------------------------------------------------------------------ */
 function envoyer() {
  const f = racine.querySelector('.eq-form');
  const msg = racine.querySelector('.eq-msg');
  const bouton = f.querySelector('.eq-suivant');
  bouton.disabled = true;
  msg.className = 'eq-msg';
  msg.textContent = 'Envoi en cours…';

  /* Les libelles voyagent avec les valeurs. La page resultats n'a ainsi aucune
     specification a connaitre : elle affiche ce qui lui arrive, et une question
     reformulee en cours d'etude reste lisible sur les reponses deja recues. */
  const plates = [];
  spec.sections.forEach(function (sec) {
   sec.questions.forEach(function (q) {
    const v = reponses[q.id];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return;
    plates.push({
     id: q.id,
     libelle: texteBrut(q.libelle),
     type: q.type,
     section: texteBrut(sec.titre),
     valeur: v
    });
   });
  });

  const piege = racine.querySelector('.eq-piege input');
  const charge = {
   questionnaire: spec.id,
   titre: spec.titre,
   cible: spec.cible,
   envoye_le: new Date().toISOString(),
   duree_s: Math.round((Date.now() - DEPART) / 1000),
   piege: piege ? piege.value : '',
   reponses: plates
  };

  if (!window.ENQUETE_ENDPOINT) { echec(); return; }

  fetch(window.ENQUETE_ENDPOINT, {
   method: 'POST',
   headers: { 'Content-Type': 'text/plain;charset=utf-8' },
   body: JSON.stringify(charge)
  })
   .then(function (r) { return r.text(); })
   .then(function (txt) {
    // fetch se resout aussi sur une erreur applicative. Sans lire la reponse,
    // on remercierait le participant pour une reponse jamais enregistree.
    var rep = null;
    try { rep = JSON.parse(txt); } catch (e) {}
    if (!rep || rep.ok !== true) throw new Error(rep && rep.erreur ? rep.erreur : 'reponse inattendue');
    fin(true);
   })
   .catch(echec);

  // Declaration remontee : elle est appelee plus haut, avant sa definition.
  function echec() {
   /* Aucune voie de secours par message : une reponse arrivee par email ne serait
      ni comptee ni comparable aux autres. Les reponses restent en memoire locale,
      la page rechargee les retrouve intactes, meme plusieurs jours plus tard. */
   bouton.disabled = false;
   msg.className = 'eq-msg ko';
   msg.textContent = "L'envoi n'a pas abouti. Vos réponses sont conservées sur cet appareil : " +
    "réessayez maintenant, ou revenez plus tard sur cette page, vous reprendrez où vous en êtes.";
  }
 }

 function fin() {
  try { localStorage.removeItem(CLE); } catch (e) {}
  racine.innerHTML = `
   <div class="eq-fin">
    <span class="eq-coche" aria-hidden="true">
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
    </span>
    <h2 class="serif">Merci. Vos réponses sont enregistrées.</h2>
    <p>Elles rejoignent celles des autres participants. L'étude complète sera publiée gratuitement, données brutes comprises, et vous pourrez la lire même si vous n'avez pas laissé vos coordonnées.</p>
    <div class="eq-fin-liens">
     <a href="observatoire.html" class="btn btn-primary">Revenir à l'Observatoire <span class="arrow"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.6"/></svg></span></a>
     <a href="resultats.html" class="eq-lien-sobre">Voir les résultats en direct</a>
    </div>
   </div>`;
  racine.scrollIntoView({ block: 'start', behavior: 'smooth' });
 }

 rendre();
})();
