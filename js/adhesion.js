/* =========================================================
   DEMANDE D'ADHÉSION
   Un formulaire en six étapes, une par écran. Deux raisons de ne pas tout
   afficher d'un coup : le dossier est long, et la section des représentants
   légaux n'a de sens que pour un mineur. La date de naissance décide.

   Sur les autorisations, le RGPD et le droit à l'image imposent la même chose :
   un consentement doit être libre, spécifique, éclairé et univoque. D'où une
   case par usage, jamais pré-cochée, chacune révocable, et une mention qui dit
   qu'un refus n'empêche pas l'accompagnement. Une case unique « j'accepte tout »
   serait plus courte et sans valeur.
   ========================================================= */
(function () {
 'use strict';

 const D = document;
 const racine = D.getElementById('adhesion');
 if (!racine) return;

 const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
               'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

 const CLE = 'duqque_adhesion';
 const DEPART = Date.now();
 let etape = 0;
 let rep = lire();

 function lire() { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; } }
 function ecrire() { try { localStorage.setItem(CLE, JSON.stringify(rep)); } catch (e) {} }

 /* --- Minorité ------------------------------------------------------------- */
 function age() {
  const v = rep.a_naissance;
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d)) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return a;
 }
 const estMineur = () => { const a = age(); return a !== null && a < 18; };
 /* Comparaison sur le debut du libelle : l'option porte aussi son tarif
    (« · sur devis »), une egalite stricte ne serait jamais vraie. */
 const estClub = () => String(rep.a_formule || '').indexOf('Convention') === 0;

 /* --- Judo : poids et grades ------------------------------------------------
    Les catégories de poids changent selon l'âge et le sexe. Elles sont donc
    présentées par catégorie d'âge, en deux groupes : proposer « -66 » à une
    cadette et « -63 » à un cadet sans les distinguer prêterait à confusion.
    Source : grille fédérale française et grille internationale. */
 const POIDS = {
  'U13 (benjamins)': {
   F: ['-32 kg', '-36 kg', '-40 kg', '-44 kg', '-48 kg', '-52 kg', '-57 kg', '+57 kg'],
   M: ['-30 kg', '-34 kg', '-38 kg', '-42 kg', '-46 kg', '-50 kg', '-55 kg', '-60 kg', '+60 kg'] },
  'U15 (minimes)': {
   F: ['-36 kg', '-40 kg', '-44 kg', '-48 kg', '-52 kg', '-57 kg', '-63 kg', '+63 kg'],
   M: ['-34 kg', '-38 kg', '-42 kg', '-46 kg', '-50 kg', '-55 kg', '-60 kg', '-66 kg', '+66 kg'] },
  'U18 (cadets)': {
   F: ['-40 kg', '-44 kg', '-48 kg', '-52 kg', '-57 kg', '-63 kg', '-70 kg', '+70 kg'],
   M: ['-46 kg', '-50 kg', '-55 kg', '-60 kg', '-66 kg', '-73 kg', '-81 kg', '+81 kg'] },
  'U21 (juniors)': {
   F: ['-44 kg', '-48 kg', '-52 kg', '-57 kg', '-63 kg', '-70 kg', '-78 kg', '+78 kg'],
   M: ['-55 kg', '-60 kg', '-66 kg', '-73 kg', '-81 kg', '-90 kg', '-100 kg', '+100 kg'] },
  'Senior': {
   F: ['-48 kg', '-52 kg', '-57 kg', '-63 kg', '-70 kg', '-78 kg', '+78 kg'],
   M: ['-60 kg', '-66 kg', '-73 kg', '-81 kg', '-90 kg', '-100 kg', '+100 kg'] },
  'Vétéran': {
   F: ['-48 kg', '-52 kg', '-57 kg', '-63 kg', '-70 kg', '-78 kg', '+78 kg'],
   M: ['-60 kg', '-66 kg', '-73 kg', '-81 kg', '-90 kg', '-100 kg', '+100 kg'] }
 };

 const GRADES = [
  'Blanche', 'Blanche-jaune', 'Jaune', 'Jaune-orange', 'Orange', 'Orange-verte',
  'Verte', 'Verte-bleue', 'Bleue', 'Bleue-marron', 'Marron',
  '1er dan', '2e dan', '3e dan', '4e dan', '5e dan',
  '6e dan', '7e dan', '8e dan', '9e dan', '10e dan'
 ];

 /* Le sexe est facultatif : quand il manque, les deux grilles sont proposées,
    chacune sous son intitulé, plutôt que d'en deviner une. */
 function poidsPour(cat, sexe) {
  const t = POIDS[cat];
  if (!t) return null;
  if (sexe === 'Féminine') return [{ groupe: 'Féminines', options: t.F }];
  if (sexe === 'Masculine') return [{ groupe: 'Masculines', options: t.M }];
  return [{ groupe: 'Féminines', options: t.F }, { groupe: 'Masculines', options: t.M }];
 }

 /* --- Autorisations -------------------------------------------------------- */
 const IMAGE_PORTEE = "Cette autorisation est consentie à titre gratuit, pour la France et le Portugal, " +
  "pour une durée de trois ans renouvelable, et peut être retirée à tout moment par simple email à contact@duqque.fr.";

 function autorisations() {
  const m = estMineur();
  const sujet = m ? "l'association à accompagner mon enfant" : "l'association à m'accompagner";
  return [
   { id: 'au_accompagnement', requis: true,
     titre: "Accompagnement par l'association",
     texte: "J'autorise " + sujet + " dans le cadre de ses activités : conseil de carrière, formation, relecture de contrats et suivi." },
   { id: 'au_statuts', requis: true,
     titre: "Statuts et règlement intérieur",
     texte: "Je déclare avoir pris connaissance des statuts et du règlement intérieur de l'association et les accepter." },
   { id: 'au_donnees', requis: true,
     titre: "Traitement des données",
     texte: "J'accepte que les informations de ce dossier soient conservées et utilisées pour la gestion de l'adhésion et de l'accompagnement, " +
            "dans les conditions décrites dans la politique de confidentialité." },
   { id: 'au_club', requis: false,
     titre: "Contact avec le club et l'entraîneur",
     texte: "J'autorise l'association à échanger avec le club et l'entraîneur " + (m ? "de mon enfant" : "qui me suit") +
            ", sur le seul projet sportif. Rien n'est engagé sans accord préalable." },
   { id: 'au_partenaires', requis: false,
     titre: "Démarchage de partenaires",
     texte: "J'autorise l'association à présenter " + (m ? "le dossier de mon enfant" : "mon dossier") +
            " à des partenaires potentiels. Aucun contrat n'est signé sans " + (m ? "notre" : "mon") + " accord écrit préalable." },
   { id: 'au_image_asso', requis: false,
     titre: "Image · supports de l'association",
     texte: "J'autorise la captation et la diffusion de photographies et de vidéos sur le site et les supports de l'association. " + IMAGE_PORTEE },
   { id: 'au_image_reseaux', requis: false,
     titre: "Image · réseaux sociaux",
     texte: "J'autorise la diffusion de ces images sur les comptes de l'association sur les réseaux sociaux. " + IMAGE_PORTEE },
   { id: 'au_image_presse', requis: false,
     titre: "Image · presse et partenaires",
     texte: "J'autorise la transmission de ces images à la presse et aux partenaires de l'association, dans le cadre de la promotion du projet sportif. " + IMAGE_PORTEE },
   { id: 'au_urgence', requis: false,
     titre: "Mesures d'urgence",
     texte: "Lors d'un déplacement ou d'un événement organisé par l'association, j'autorise ses représentants à faire pratiquer " +
            (m ? "sur mon enfant" : "sur moi") + " les soins ou l'hospitalisation rendus nécessaires par une urgence." }
  ];
 }

 /* --- Spécification du dossier --------------------------------------------- */
 function sections() {
  const m = estMineur();
  const club = estClub();
  const s = [];

  s.push({ titre: 'La formule', intro: "Elle détermine la suite du dossier.", questions: [
   { id: 'a_formule', type: 'choix', requis: true, libelle: "Quelle formule vous concerne ?", options: [
     'Programme Espoirs · moins de 18 ans · gratuit',
     'Cotisation Athlète · 18 ans et plus · 60 € par an',
     'Cotisation Athlète sélectionné · 120 € par an',
     'Convention club ou structure · sur devis'
   ], aide: "En cas de doute, choisissez la plus proche : nous corrigerons avec vous." },
   { id: 'a_naissance', type: 'naissance', requis: !club, libelle: "Date de naissance de la personne accompagnée",
     aide: "Elle détermine si des autorisations parentales sont nécessaires." }
  ]});

  s.push({ titre: club ? 'La structure' : 'La personne accompagnée', questions: [].concat(
   club ? [
    { id: 'a_structure', type: 'texte', requis: true, libelle: 'Nom de la structure' },
    { id: 'a_forme', type: 'liste', requis: true, libelle: 'Type de structure',
      options: ['Club associatif', 'Comité départemental', 'Ligue régionale', 'Fédération', 'Section sportive scolaire', 'Autre'] },
    { id: 'a_rna', type: 'texte', requis: false, libelle: 'Numéro RNA ou SIRET' },
    { id: 'a_nb', type: 'nombre', requis: false, libelle: "Nombre d'athlètes concernés" }
   ] : [
    { id: 'a_prenom', type: 'texte', requis: true, libelle: 'Prénom' },
    { id: 'a_nom', type: 'texte', requis: true, libelle: 'Nom' },
    { id: 'a_sexe', type: 'choix', requis: false, libelle: 'Catégorie de compétition',
      options: ['Féminine', 'Masculine', 'Je préfère ne pas répondre'] },
    { id: 'a_nationalite', type: 'nationalite', requis: false, libelle: 'Nationalité' }
   ],
   club ? [
    { id: 'a_prenom_c', type: 'texte', requis: true, libelle: 'Prénom du référent' },
    { id: 'a_nom_c', type: 'texte', requis: true, libelle: 'Nom du référent' },
    { id: 'a_fonction', type: 'texte', requis: true, libelle: 'Fonction dans la structure' }
   ] : [],
   [
    { id: 'a_adresse', type: 'adresse', requis: true, libelle: 'Adresse' },
    { id: 'a_cp', type: 'texte', requis: true, libelle: 'Code postal' },
    { id: 'a_ville', type: 'texte', requis: true, libelle: 'Ville' },
    { id: 'a_pays', type: 'pays', requis: true, libelle: 'Pays' },
    { id: 'a_email', type: 'email', requis: true, libelle: 'Adresse email',
      aide: "La confirmation d'inscription y sera envoyée." + (m ? " Pour un mineur, indiquez celle d'un représentant légal." : "") },
    { id: 'a_tel', type: 'telephone', requis: true, libelle: 'Téléphone' }
   ]
  )});

  if (!club) {
   const grille = poidsPour(rep.p_categorie, rep.a_sexe);
   const enStructure = rep.p_structure && rep.p_structure !== 'Aucune';
   s.push({ titre: 'La pratique sportive', questions: [].concat([
    { id: 'p_discipline', type: 'liste', requis: true, libelle: 'Discipline',
      options: ['Judo', 'Jujitsu', 'Autre sport de combat', 'Autre discipline'] },

    // Le club et son encadrement se tiennent : l'entraîneur demandé ici est
    // celui du club, pas celui d'une structure fédérale, qui vient plus bas.
    { id: 'p_club', type: 'texte', requis: true, libelle: 'Nom complet du club',
      aide: "Le nom entier tel qu'il est déclaré, sans abréviation." },
    { id: 'p_club_ville', type: 'texte', requis: true, libelle: 'Ville du club' },
    { id: 'p_entraineur', type: 'texte', requis: true, libelle: "Nom de l'entraîneur au club" },
    { id: 'p_entraineur_tel', type: 'telephone', requis: false, libelle: "Téléphone de l'entraîneur au club" },

    { id: 'p_licence', type: 'texte', requis: false, libelle: 'Numéro de licence fédérale' },
    { id: 'p_categorie', type: 'liste', requis: true, refaire: true, libelle: "Catégorie d'âge cette saison",
      options: ['U13 (benjamins)', 'U15 (minimes)', 'U18 (cadets)', 'U21 (juniors)', 'Senior', 'Vétéran'] }
   ],
   grille
    ? [{ id: 'p_poids', type: 'liste', requis: false, libelle: 'Catégorie de poids', groupes: grille }]
    : [{ id: 'p_poids', type: 'liste', requis: false, libelle: 'Catégorie de poids',
         options: [], aide: "Choisissez d'abord une catégorie d'âge." }],
   [
    { id: 'p_grade', type: 'liste', requis: false, libelle: 'Grade', options: GRADES },
    { id: 'p_niveau', type: 'liste', requis: true, libelle: 'Meilleur niveau de compétition atteint',
      options: ['Départemental', 'Régional', 'National', 'International jeunes', 'International senior', 'Aucun pour le moment'] },
    { id: 'p_structure', type: 'liste', requis: false, refaire: true, libelle: 'Structure fédérale',
      options: ['Aucune', 'Section sportive scolaire', 'Pôle Espoirs', 'Pôle France', 'Centre national', 'Structure étrangère'] }
   ],
   enStructure ? [
    { id: 'p_structure_nom', type: 'texte', requis: true, libelle: 'Nom complet de la structure',
      aide: "Par exemple : Pôle Espoirs Judo Île-de-France." },
    { id: 'p_structure_ville', type: 'texte', requis: true, libelle: 'Ville de la structure' }
   ] : [],
   [
    { id: 'p_projet', type: 'long', requis: false, libelle: "En deux ou trois phrases, votre projet sportif",
      aide: "Ce que vous visez, et à quelle échéance." }
   ])});
  }

  if (m && !club) s.push({ titre: 'Les représentants légaux',
   intro: "La personne accompagnée est mineure. Le dossier ne peut être validé sans l'accord de ses représentants légaux.",
   questions: [
    { id: 'r1_prenom', type: 'texte', requis: true, libelle: 'Prénom du premier représentant légal' },
    { id: 'r1_nom', type: 'texte', requis: true, libelle: 'Nom' },
    { id: 'r1_lien', type: 'liste', requis: true, libelle: 'Lien avec la personne accompagnée',
      options: ['Mère', 'Père', 'Tuteur ou tutrice', 'Autre représentant légal'] },
    { id: 'r1_email', type: 'email', requis: true, libelle: 'Adresse email' },
    { id: 'r1_tel', type: 'telephone', requis: true, libelle: 'Téléphone' },
    { id: 'r2_prenom', type: 'texte', requis: false, libelle: 'Prénom du second représentant légal' },
    { id: 'r2_nom', type: 'texte', requis: false, libelle: 'Nom' },
    { id: 'r2_lien', type: 'liste', requis: false, libelle: 'Lien avec la personne accompagnée',
      options: ['Mère', 'Père', 'Tuteur ou tutrice', 'Autre représentant légal'] },
    { id: 'r2_email', type: 'email', requis: false, libelle: 'Adresse email' },
    { id: 'r2_tel', type: 'telephone', requis: false, libelle: 'Téléphone' },
    { id: 'u_nom', type: 'texte', requis: true, libelle: "Personne à prévenir en cas d'urgence",
      aide: "Si elle est différente des représentants légaux ci-dessus." },
    { id: 'u_tel', type: 'telephone', requis: true, libelle: 'Son téléphone' }
   ]});

  s.push({ titre: 'Les autorisations', consentements: true,
   intro: m
    ? "Chaque autorisation est distincte et se donne séparément. Trois sont nécessaires pour adhérer, les autres sont libres. Un refus n'a aucune conséquence sur l'accompagnement sportif, et chacune peut être retirée à tout moment."
    : "Chaque autorisation est distincte. Trois sont nécessaires pour adhérer, les autres sont libres et peuvent être retirées à tout moment.",
   questions: [] });

  s.push({ titre: 'Signature', questions: [
   { id: 's_nom', type: 'texte', requis: true, libelle: 'Nom et prénom du signataire' },
   { id: 's_qualite', type: 'choix', requis: true, libelle: 'En qualité de',
     options: m ? ['Représentant légal', 'Second représentant légal'] : (club ? ['Représentant de la structure'] : ["L'adhérent lui-même"]) },
   { id: 's_lieu', type: 'texte', requis: true, libelle: 'Fait à' },
   { id: 's_certifie', type: 'case', requis: true,
     libelle: "Je certifie l'exactitude des informations de ce dossier." }
  ]});

  return s;
 }

 /* --- Rendu d'un champ ------------------------------------------------------ */
 function champ(q) {
  const v = rep[q.id];
  const req = q.requis ? ' required' : '';
  const aide = q.aide ? '<p class="eq-aide">' + q.aide + '</p>' : '';
  let corps = '';

  if (q.type === 'pays' || q.type === 'nationalite') {
   corps = '<div class="ch-hote" id="' + q.id + '"></div>';

  } else if (q.type === 'telephone') {
   corps = '<div class="ch-hote" id="' + q.id + '"></div>';

  } else if (q.type === 'adresse') {
   corps = '<div class="ch-hote" id="' + q.id + '"></div>';

  } else if (q.type === 'naissance') {
   /* Trois listes, pas un calendrier. Un selecteur de date s'ouvre sur le mois
      courant : pour une naissance, il faut alors remonter vingt-cinq ans ecran
      par ecran. Trois listes se remplissent en trois gestes, ne peuvent pas
      produire une saisie invalide, et gardent l'habillage du reste du dossier. */
   const p = String(v || '').split('-');
   const an = p[0] || '', mo = p[1] || '', jo = p[2] || '';
   const opt = (val, txt, sel) => '<option value="' + val + '"' + (sel === val ? ' selected' : '') + '>' + txt + '</option>';
   let jours = '<option value="">Jour</option>';
   for (let i = 1; i <= 31; i++) jours += opt(String(i).padStart(2, '0'), i, jo);
   let mois = '<option value="">Mois</option>';
   MOIS.forEach((m2, i) => { mois += opt(String(i + 1).padStart(2, '0'), m2, mo); });
   let annees = '<option value="">Année</option>';
   const ici = new Date().getFullYear();
   for (let i = ici - 5; i >= ici - 85; i--) annees += opt(String(i), i, an);
   corps = '<div class="ad-date" id="' + q.id + '">' +
    '<select data-part="j" aria-label="Jour de naissance">' + jours + '</select>' +
    '<select data-part="m" aria-label="Mois de naissance">' + mois + '</select>' +
    '<select data-part="a" aria-label="Année de naissance">' + annees + '</select></div>';

  } else if (q.type === 'texte' || q.type === 'email' || q.type === 'tel' || q.type === 'nombre' || q.type === 'date') {
   const t = q.type === 'nombre' ? 'number' : (q.type === 'texte' ? 'text' : q.type);
   const attrs = q.type === 'nombre' ? ' min="0" inputmode="numeric"' : '';
   corps = '<input type="' + t + '" id="' + q.id + '" name="' + q.id + '"' + attrs + req +
    ' value="' + (v ? String(v).replace(/"/g, '&quot;') : '') + '" />';
  } else if (q.type === 'long') {
   corps = '<textarea id="' + q.id + '" name="' + q.id + '" rows="4"' + req + '>' + (v || '') + '</textarea>';
  } else if (q.type === 'liste') {
   const opt = function (o) { return '<option' + (v === o ? ' selected' : '') + '>' + o + '</option>'; };
   const dedans = q.groupes
    ? q.groupes.map(function (g) {
       return '<optgroup label="' + g.groupe + '">' + g.options.map(opt).join('') + '</optgroup>';
      }).join('')
    : (q.options || []).map(opt).join('');
   corps = '<select id="' + q.id + '" name="' + q.id + '"' + req + '><option value="">Choisir</option>' + dedans + '</select>';
  } else if (q.type === 'choix') {
   corps = '<div class="eq-choix">' + q.options.map(function (o, i) {
    return '<label class="eq-opt' + (v === o ? ' on' : '') + '"><input type="radio" name="' + q.id + '" value="' + o + '"' +
     (v === o ? ' checked' : '') + (req && i === 0 ? ' required' : '') + ' /><span>' + o + '</span></label>';
   }).join('') + '</div>';
  } else if (q.type === 'case') {
   corps = '<label class="ad-case' + (v ? ' on' : '') + '"><input type="checkbox" id="' + q.id + '" name="' + q.id + '"' +
    (v ? ' checked' : '') + req + ' /><span>' + q.libelle + '</span></label>';
   return '<div class="eq-q" data-q="' + q.id + '">' + corps + aide + '</div>';
  }

  return '<div class="eq-q" data-q="' + q.id + '"><label class="eq-lib"' +
   (q.type === 'choix' ? '' : ' for="' + q.id + '"') + '>' + q.libelle +
   (q.requis ? '' : ' <em>facultatif</em>') + '</label>' + aide + corps + '</div>';
 }

 function carteAutorisation(a) {
  const v = rep[a.id];
  return '<label class="ad-auto' + (v ? ' on' : '') + '" data-q="' + a.id + '">' +
   '<input type="checkbox" name="' + a.id + '"' + (v ? ' checked' : '') + (a.requis ? ' required' : '') + ' />' +
   '<span class="ad-auto-txt"><b>' + a.titre + (a.requis ? ' <em class="ad-obl">nécessaire</em>' : ' <em class="ad-fac">facultatif</em>') + '</b>' +
   '<small>' + a.texte + '</small></span></label>';
 }

 /* --- Rendu d'une étape ----------------------------------------------------- */
 function rendre() {
  const S = sections();
  if (etape >= S.length) etape = S.length - 1;
  const s = S[etape];
  const dernier = etape === S.length - 1;
  const pct = Math.round((etape / S.length) * 100);

  racine.innerHTML =
   '<div class="eq-bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Progression du dossier">' +
    '<div class="eq-bar-piste"><div class="eq-bar-jauge" style="transform: scaleX(' + (pct / 100) + ')"></div></div>' +
    '<span class="eq-bar-pct">' + pct + '&nbsp;%</span></div>' +
   '<p class="eq-etape">Étape ' + (etape + 1) + ' sur ' + S.length + '</p>' +
   '<h2 class="serif eq-titre">' + s.titre + '</h2>' +
   (s.intro ? '<p class="eq-intro">' + s.intro + '</p>' : '') +
   '<form class="eq-form" novalidate>' +
    (s.consentements ? autorisations().map(carteAutorisation).join('') : s.questions.map(champ).join('')) +
    '<div class="eq-piege" aria-hidden="true"><label for="adSociete">Ne remplissez pas ce champ</label>' +
     '<input id="adSociete" name="societe" type="text" tabindex="-1" autocomplete="off" /></div>' +
    '<div class="eq-nav">' +
     (etape > 0 ? '<button type="button" class="eq-retour" data-prec>Retour</button>' : '<span></span>') +
     '<button type="submit" class="eq-suivant">' + (dernier ? 'Envoyer ma demande' : 'Continuer') +
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.8"/></svg>' +
     '</button></div>' +
    '<p class="eq-msg" role="status" aria-live="polite"></p>' +
   '</form>';

  racine.querySelector('.eq-form').addEventListener('submit', suivant);
  const prec = racine.querySelector('[data-prec]');
  if (prec) prec.addEventListener('click', function () { collecte(); etape--; rendre(); });

  monterChampsRiches();

  /* Deux réponses commandent l'affichage d'autres champs : la catégorie d'âge,
     qui décide de la grille de poids, et la structure fédérale, qui fait
     apparaître son nom et sa ville. Elles seules relancent le rendu, pour ne pas
     faire perdre le focus à chaque frappe ailleurs. */
  sections()[etape].questions.filter(function (q) { return q.refaire; }).forEach(function (q) {
   const el = racine.querySelector('#' + q.id);
   if (el) el.addEventListener('change', function () { collecte(); rendre(); });
  });

  racine.querySelectorAll('.ad-date select').forEach(function (sel) {
   sel.addEventListener('change', function () { collecte(); });
  });

  racine.querySelectorAll('.eq-opt input, .ad-auto input, .ad-case input').forEach(function (i) {
   i.addEventListener('change', function () {
    const p = i.closest('.eq-choix, .eq-form');
    if (i.type === 'radio') p.querySelectorAll('.eq-opt').forEach(function (l) { l.classList.remove('on'); });
    const l = i.closest('label');
    if (i.type === 'radio') l.classList.add('on'); else l.classList.toggle('on', i.checked);
   });
  });
 }

 /* Les champs assistés se montent après le rendu : ils remplacent un conteneur
    vide par leur propre balisage. Les téléphones s'abonnent au pays du dossier,
    et l'adresse remplit code postal et ville quand on choisit une proposition. */
 let telephones = [];
 let champAdresse = null;

 function monterChampsRiches() {
  if (!window.CHAMPS || !window.PAYS) return;   // sans ces fichiers, champs texte ordinaires
  telephones = [];
  champAdresse = null;

  racine.querySelectorAll('.eq-q[data-q]').forEach(function (bloc) {
   const hote = bloc.querySelector('.ch-hote');
   if (!hote) return;
   const id = hote.id;

   if (id === 'a_pays' || id === 'a_nationalite') {
    const codeInitial = rep[id + '_code'] || (id === 'a_pays' ? 'FR' : '');
    window.CHAMPS.combo(hote, {
     valeur: codeInitial,
     placeholder: id === 'a_pays' ? 'France, Portugal…' : 'Pays dont vous avez la nationalité',
     onChoix: function (pays) {
      rep[id] = pays.nom;
      rep[id + '_code'] = pays.code;
      ecrire();
      if (id === 'a_pays') {
       telephones.forEach(function (t) { t.suivrePays(pays.code); });
       if (champAdresse) champAdresse.changerPays(pays.code);
      }
     }
    });
    if (codeInitial) { rep[id] = window.PAYS.parCode[codeInitial].nom; rep[id + '_code'] = codeInitial; }

   } else if (id === 'a_adresse') {
    champAdresse = window.CHAMPS.adresse(hote, {
     valeur: rep[id] || '', pays: rep.a_pays_code || 'FR',
     onSaisie: function (v) { rep[id] = v; ecrire(); },
     onChoix: function (a) {
      rep[id] = a.rue;
      if (a.cp) rep.a_cp = a.cp;
      if (a.ville) rep.a_ville = a.ville;
      ecrire();
      // Les deux champs suivants sont déjà à l'écran : on les remplit sur place.
      const cp = D.getElementById('a_cp'), v = D.getElementById('a_ville');
      if (cp && a.cp) cp.value = a.cp;
      if (v && a.ville) v.value = a.ville;
     }
    });

   } else {
    const t = window.CHAMPS.telephone(hote, {
     valeur: rep[id] || '', pays: rep[id + '_code'] || rep.a_pays_code || 'FR',
     onChange: function (val, code) { rep[id] = val; rep[id + '_code'] = code; ecrire(); }
    });
    telephones.push(t);
   }
  });
 }

 function collecte() {
  const f = racine.querySelector('.eq-form');
  if (!f) return;

  // La date de naissance se recompose depuis ses trois listes.
  f.querySelectorAll('.ad-date').forEach(function (d) {
   const j = d.querySelector('[data-part="j"]').value;
   const m = d.querySelector('[data-part="m"]').value;
   const a = d.querySelector('[data-part="a"]').value;
   if (j && m && a) {
    // Le 31 février existe dans les listes mais pas dans le calendrier : on le
    // detecte en verifiant que la date construite retombe bien sur le meme jour.
    const t = new Date(a + '-' + m + '-' + j + 'T12:00:00');
    const valide = !isNaN(t) && t.getDate() === parseInt(j, 10) && (t.getMonth() + 1) === parseInt(m, 10);
    if (valide) { rep[d.id] = a + '-' + m + '-' + j; d.classList.remove('ad-date-ko'); }
    else { delete rep[d.id]; d.classList.add('ad-date-ko'); }
   } else { delete rep[d.id]; }
  });

  f.querySelectorAll('input, select, textarea').forEach(function (c) {
   if (c.closest('.eq-piege')) return;
   if (c.closest('.ad-date')) return;
   // Les champs assistés tiennent eux-mêmes leur valeur dans rep : leurs champs
   // internes portent des identifiants de travail qu'il ne faut pas enregistrer.
   if (c.closest('.ch-hote')) return;
   if (c.type === 'radio') { if (c.checked) rep[c.name] = c.value; }
   else if (c.type === 'checkbox') rep[c.name] = c.checked;
   else if (c.value !== '') rep[c.name] = c.value; else delete rep[c.name];
  });
  ecrire();
 }

 function suivant(e) {
  e.preventDefault();
  collecte();
  const S = sections();
  const s = S[etape];
  const msg = racine.querySelector('.eq-msg');

  const requis = s.consentements
   ? autorisations().filter(function (a) { return a.requis; }).map(function (a) { return { id: a.id, libelle: a.titre }; })
   : s.questions.filter(function (q) { return q.requis; });
  const manque = requis.filter(function (q) {
   const v = rep[q.id];
   return v === undefined || v === '' || v === false;
  });

  if (manque.length) {
   msg.className = 'eq-msg ko';
   msg.textContent = manque.length === 1
    ? 'Il manque : ' + manque[0].libelle.replace(/<[^>]+>/g, '') + '.'
    : manque.length + ' réponses manquent avant de continuer.';
   const el = racine.querySelector('[data-q="' + manque[0].id + '"]');
   if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('eq-manque'); }
   return;
  }

  if (etape < S.length - 1) { etape++; rendre(); window.scrollTo({ top: racine.offsetTop - 90, behavior: 'smooth' }); return; }
  envoyer();
 }

 /* --- Envoi ----------------------------------------------------------------- */
 function envoyer() {
  const f = racine.querySelector('.eq-form');
  const msg = racine.querySelector('.eq-msg');
  const bouton = f.querySelector('.eq-suivant');
  bouton.disabled = true;
  msg.className = 'eq-msg';
  msg.textContent = 'Envoi en cours…';

  const plats = [];
  sections().forEach(function (s) {
   if (s.consentements) {
    autorisations().forEach(function (a) {
     plats.push({ id: a.id, libelle: a.titre, section: s.titre, type: 'case',
                  valeur: rep[a.id] ? 'ACCORDÉE' : 'refusée' });
    });
    return;
   }
   s.questions.forEach(function (q) {
    const v = rep[q.id];
    if (v === undefined || v === '' || v === false) return;
    plats.push({ id: q.id, libelle: q.libelle.replace(/<[^>]+>/g, ''), section: s.titre, type: q.type,
                 valeur: v === true ? 'oui' : v });
   });
  });
  plats.push({ id: 's_date', libelle: 'Date de signature', section: 'Signature', type: 'texte',
               valeur: new Date().toLocaleString('fr-FR') });

  const piege = racine.querySelector('.eq-piege input');
  fetch('/api/adhesion.php', {
   method: 'POST',
   headers: { 'Content-Type': 'text/plain;charset=utf-8' },
   body: JSON.stringify({
    mineur: estMineur(),
    formule: rep.a_formule || '',
    duree_s: Math.round((Date.now() - DEPART) / 1000),
    piege: piege ? piege.value : '',
    champs: plats
   })
  })
   .then(function (r) { return r.text(); })
   .then(function (t) {
    let j = null;
    try { j = JSON.parse(t); } catch (e) {}
    if (!j || j.ok !== true) throw new Error(j && j.erreur ? j.erreur : 'réponse inattendue');
    fin(j);
   })
   .catch(function (err) {
    bouton.disabled = false;
    msg.className = 'eq-msg ko';
    msg.textContent = "L'envoi n'a pas abouti (" + err.message + "). Votre dossier est conservé sur cet appareil : " +
     "réessayez, ou revenez plus tard sur cette page.";
   });
 }

 function fin(j) {
  try { localStorage.removeItem(CLE); } catch (e) {}
  // Le sort des deux emails est dit tel quel : annoncer un envoi qui n'a pas eu
  // lieu ferait attendre une confirmation qui n'arrivera jamais.
  const courriers = j.mail_personne
   ? "<p>Une confirmation vient de partir vers <b>" + (rep.a_email || 'votre adresse') + "</b>. " +
     "Si vous ne la voyez pas, regardez dans les indésirables.</p>"
   : "<p>La confirmation par email n'a pas pu partir, mais <b>votre dossier est bien enregistré</b>. " +
     "Nous vous répondrons à " + (rep.a_email || 'votre adresse') + ".</p>";

  racine.innerHTML =
   '<div class="eq-fin"><span class="eq-coche" aria-hidden="true">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></span>' +
    '<h2 class="serif">Votre demande est enregistrée.</h2>' +
    '<p class="ad-ref">Référence <b>' + j.ref + '</b></p>' +
    courriers +
    '<p>Nous examinons chaque dossier et répondons sous trois semaines, même quand la réponse est non.</p>' +
    '<div class="eq-fin-liens">' +
     '<a href="home.html" class="btn btn-primary">Retour à l\'accueil <span class="arrow">' +
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.6"/></svg></span></a>' +
     '<a href="confidentialite.html" class="eq-lien-sobre">Ce que nous faisons de vos données</a>' +
    '</div></div>';
  racine.scrollIntoView({ block: 'start', behavior: 'smooth' });
 }

 rendre();
})();
