/* =========================================================
   RÉSULTATS EN DIRECT
   Lit le CSV publié par l'onglet AGREGAT du classeur et dessine l'infographie.
   Aucun serveur, aucune bibliothèque : les graphiques sont du SVG écrit ici.

   Le CSV ne contient que des comptages agrégés, jamais une réponse individuelle
   ni une coordonnée : ce qui est publié ne peut pas être ré-identifié.
   ========================================================= */
(function () {
 'use strict';

 const racine = document.getElementById('resultats');
 if (!racine) return;

 const URL_CSV = window.RESULTATS_CSV || '';
 const TITRES = {
  'transferts-athletes': 'Transferts et accompagnement · athlètes',
  'transferts-clubs': 'Transferts et accompagnement · clubs',
  'sponsoring-athletes': 'Sponsoring · athlètes',
  'sponsoring-clubs': 'Sponsoring · clubs'
 };

 if (!URL_CSV) { attente("Les résultats s'afficheront ici dès la première réponse."); return; }

 fetch(URL_CSV, { cache: 'no-store' })
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
  .then(dessiner)
  .catch(() => attente("Les résultats ne sont pas accessibles pour le moment. Réessayez dans quelques minutes."));

 function attente(txt) {
  racine.innerHTML = `<div class="rs-attente">
    <span class="rs-pastille">En attente de données</span>
    <p>${txt}</p>
    <a href="observatoire.html" class="btn btn-primary">Répondre à un questionnaire
     <span class="arrow"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.6"/></svg></span></a>
   </div>`;
 }

 /* Analyseur CSV minimal mais correct : gère les guillemets et les virgules
    à l'intérieur d'un champ, ce qu'un simple split(',') casserait. */
 function lireCSV(txt) {
  const lignes = [];
  let champ = '', ligne = [], guillemets = false;
  for (let i = 0; i < txt.length; i++) {
   const c = txt[i];
   if (guillemets) {
    if (c === '"') { if (txt[i + 1] === '"') { champ += '"'; i++; } else guillemets = false; }
    else champ += c;
   } else if (c === '"') guillemets = true;
   else if (c === ',') { ligne.push(champ); champ = ''; }
   else if (c === '\n') { ligne.push(champ); lignes.push(ligne); ligne = []; champ = ''; }
   else if (c !== '\r') champ += c;
  }
  if (champ || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes;
 }

 function dessiner(csv) {
  const lignes = lireCSV(csv).filter((l) => l.length >= 4 && l[0]);
  if (lignes.length < 2) { attente("Aucune réponse n'a encore été enregistrée."); return; }

  const donnees = {};
  const totaux = {};
  lignes.slice(1).forEach((l) => {
   const [q, question, valeur, nombre, total] = l;
   donnees[q] = donnees[q] || {};
   donnees[q][question] = donnees[q][question] || [];
   donnees[q][question].push({ valeur, n: parseInt(nombre, 10) || 0 });
   totaux[q] = parseInt(total, 10) || 0;
  });

  const total = Object.values(totaux).reduce((a, b) => a + b, 0);
  let html = `<div class="rs-compteur">
    <span class="rs-n">${total}</span>
    <p>réponse${total > 1 ? 's' : ''} enregistrée${total > 1 ? 's' : ''} à ce jour, tous questionnaires confondus.
    Chaque nouvelle réponse met cette page à jour.</p>
   </div>
   <div class="rs-repartition">${
    Object.keys(totaux).map((q) => `<div class="rs-part">
      <span class="n">${totaux[q]}</span>
      <span class="l">${TITRES[q] || q}</span>
     </div>`).join('')
   }</div>`;

  Object.keys(donnees).forEach((q) => {
   html += `<section class="rs-bloc">
     <h2 class="serif">${TITRES[q] || q}</h2>
     <p class="rs-sous">${totaux[q]} réponse${totaux[q] > 1 ? 's' : ''}</p>
     ${Object.keys(donnees[q]).map((question) => barres(question, donnees[q][question], totaux[q])).join('')}
    </section>`;
  });

  racine.innerHTML = html;
 }

 /* Barres horizontales : sur un téléphone, un camembert de huit parts est
    illisible, et une barre se lit à l'échelle sans légende. */
 function barres(question, valeurs, total) {
  const tri = valeurs.slice().sort((a, b) => b.n - a.n);
  const max = Math.max.apply(null, tri.map((v) => v.n)) || 1;
  return `<figure class="rs-graph">
    <figcaption>${question}</figcaption>
    <div class="rs-barres">${tri.map((v) => {
     const pct = total ? Math.round((v.n / total) * 100) : 0;
     return `<div class="rs-ligne">
       <span class="rs-lib">${echapper(v.valeur)}</span>
       <span class="rs-piste"><span class="rs-jauge" style="width: ${Math.round((v.n / max) * 100)}%"></span></span>
       <span class="rs-val">${v.n}<small>${pct}&nbsp;%</small></span>
      </div>`;
    }).join('')}</div>
   </figure>`;
 }

 function echapper(t) {
  return String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
 }
})();
