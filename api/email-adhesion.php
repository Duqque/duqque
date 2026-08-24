<?php
/* =========================================================
   EMAIL DE CONFIRMATION D'ADHÉSION
   Deux versions dans le même envoi : une en texte brut, une en HTML. Les clients
   qui ne rendent pas le HTML, et les filtres anti-spam, lisent la première.

   Contraintes propres au courrier électronique, qui expliquent le balisage :
   des tableaux et non des grilles, des styles en ligne et non des classes, une
   largeur fixe de 600 px, aucune image indispensable au sens. Outlook ignore
   presque tout le reste.

   Les fontes de la maison sont déclarées en @font-face : Apple Mail et iOS les
   chargent, Gmail les ignore et retombe sur la pile de secours. Le dessin ne
   dépend donc jamais d'elles.
   ========================================================= */
declare(strict_types=1);

const MARQUE_NOIR   = '#0a0a0a';
const MARQUE_CREME  = '#f5f3ef';
const MARQUE_FOND   = '#f0f0f0';
const MARQUE_ENCRE  = '#1a1410';
const MARQUE_DOUX   = '#423d36';
const MARQUE_VIOLET = '#4a1fc7';
const MARQUE_LIME   = '#d9ff3d';
const MARQUE_LIGNE  = '#dcdad6';

const PILE_TITRE = "'LT Museum', 'Playfair Display', Georgia, 'Times New Roman', serif";
const PILE_TEXTE = "'Gilroy', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";

function e_(string $t): string { return htmlspecialchars($t, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

/** Regroupe les champs par section, dans l'ordre du formulaire. */
function grouperChamps(array $champs): array {
  $out = [];
  foreach ($champs as $c) {
    $v = is_array($c['valeur'] ?? '') ? implode(' · ', $c['valeur']) : (string)($c['valeur'] ?? '');
    if (trim($v) === '') continue;
    $s = (string)($c['section'] ?? 'Informations');
    $out[$s][] = ['libelle' => (string)($c['libelle'] ?? $c['id']), 'valeur' => $v];
  }
  return $out;
}

function ligneRecap(string $libelle, string $valeur): string {
  return '<tr>'
    . '<td style="padding:9px 0;border-bottom:1px solid ' . MARQUE_LIGNE . ';font-family:' . PILE_TEXTE
    . ';font-size:13px;line-height:1.45;color:' . MARQUE_DOUX . ';width:46%;vertical-align:top;">' . e_($libelle) . '</td>'
    . '<td style="padding:9px 0 9px 14px;border-bottom:1px solid ' . MARQUE_LIGNE . ';font-family:' . PILE_TEXTE
    . ';font-size:14px;line-height:1.45;color:' . MARQUE_ENCRE . ';font-weight:600;vertical-align:top;">' . e_($valeur) . '</td>'
    . '</tr>';
}

function etapeEmail(string $n, string $titre, string $texte): string {
  return '<tr>'
    . '<td style="width:44px;padding:0 0 22px;vertical-align:top;font-family:' . PILE_TITRE
    . ';font-size:22px;line-height:1;font-weight:900;color:' . MARQUE_VIOLET . ';">' . e_($n) . '</td>'
    . '<td style="padding:0 0 22px;vertical-align:top;">'
    . '<div style="font-family:' . PILE_TEXTE . ';font-size:15px;line-height:1.3;font-weight:600;color:'
    . MARQUE_ENCRE . ';margin:0 0 5px;">' . e_($titre) . '</div>'
    . '<div style="font-family:' . PILE_TEXTE . ';font-size:14px;line-height:1.6;color:' . MARQUE_DOUX . ';">' . $texte . '</div>'
    . '</td></tr>';
}

function emailAdhesionHtml(array $d): string {
  $ref     = (string)($d['ref'] ?? '');
  $nom     = (string)($d['nom'] ?? '');
  $mineur  = !empty($d['mineur']);
  $groupes = grouperChamps($d['champs'] ?? []);

  // Les autorisations sont sorties du récapitulatif : elles méritent leur bloc.
  $autos = $groupes['Les autorisations'] ?? [];
  unset($groupes['Les autorisations']);

  $prenom = trim(explode(' ', $nom)[0] ?? '');
  $bonjour = $prenom !== '' ? 'Bonjour ' . e_($prenom) . ',' : 'Bonjour,';

  $h = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">'
    . '<meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<meta name="x-apple-disable-message-reformatting">'
    . '<title>Votre demande d\'adhésion</title><style>'
    . "@font-face{font-family:'LT Museum';src:url('https://duqque.fr/assets/fonts/LTMuseum-Black.woff2') format('woff2');font-weight:900;font-style:normal;font-display:swap}"
    . "@font-face{font-family:'Gilroy';src:url('https://duqque.fr/assets/fonts/Gilroy-Regular.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}"
    . "@font-face{font-family:'Gilroy';src:url('https://duqque.fr/assets/fonts/Gilroy-SemiBold.woff2') format('woff2');font-weight:600;font-style:normal;font-display:swap}"
    . 'a{color:' . MARQUE_VIOLET . '}'
    . '@media (max-width:620px){.p{padding-left:22px!important;padding-right:22px!important}'
    . '.t{font-size:29px!important;line-height:1.08!important}}'
    . '</style></head>'
    . '<body style="margin:0;padding:0;background:' . MARQUE_FOND . ';">'
    // Aperçu affiché dans la liste des messages, invisible dans le corps.
    . '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">'
    . 'Demande enregistrée sous la référence ' . e_($ref) . '. Rien n\'est à payer pour le moment.'
    . str_repeat('&#847;&zwnj;&nbsp;', 40) . '</div>'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' . MARQUE_FOND . ';">'
    . '<tr><td align="center" style="padding:28px 12px;">'
    . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">';

  /* Bandeau sombre */
  $h .= '<tr><td style="background:' . MARQUE_NOIR . ';border-radius:16px 16px 0 0;padding:30px 40px 26px;" class="p">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
    . '<td style="font-family:' . PILE_TEXTE . ';font-size:21px;font-weight:600;letter-spacing:-0.02em;color:'
    . MARQUE_CREME . ';">duqque</td>'
    . '<td align="right" style="font-family:' . PILE_TEXTE . ';font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;color:'
    . MARQUE_LIME . ';">Adhésion</td>'
    . '</tr></table></td></tr>';

  /* Titre */
  $h .= '<tr><td style="background:' . MARQUE_NOIR . ';padding:6px 40px 34px;" class="p">'
    . '<div class="t" style="font-family:' . PILE_TITRE . ';font-size:38px;line-height:1.05;font-weight:900;letter-spacing:-0.02em;color:'
    . MARQUE_CREME . ';margin:0 0 18px;">Votre demande<br>est enregistrée.</div>'
    . '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
    . '<td style="background:' . MARQUE_LIME . ';border-radius:100px;padding:9px 18px;font-family:' . PILE_TEXTE
    . ';font-size:13px;font-weight:600;letter-spacing:0.06em;color:#101400;">Référence ' . e_($ref) . '</td>'
    . '</tr></table></td></tr>';

  /* Corps clair */
  $h .= '<tr><td style="background:' . MARQUE_CREME . ';padding:34px 40px 8px;" class="p">'
    . '<p style="margin:0 0 18px;font-family:' . PILE_TEXTE . ';font-size:16px;line-height:1.6;color:' . MARQUE_ENCRE . ';">' . $bonjour . '</p>'
    . '<p style="margin:0 0 30px;font-family:' . PILE_TEXTE . ';font-size:15px;line-height:1.65;color:' . MARQUE_DOUX . ';">'
    . 'Nous avons bien reçu votre demande d\'adhésion. Conservez la référence ci-dessus, elle nous permet de retrouver votre dossier. '
    . 'Vous en trouverez le récapitulatif complet en pièce jointe, au format PDF.</p>'
    . '<div style="font-family:' . PILE_TEXTE . ';font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;color:'
    . MARQUE_VIOLET . ';margin:0 0 18px;">Ce qui se passe maintenant</div>'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'
    . etapeEmail('01', 'Nous prenons le temps de lire',
        'Chaque dossier est lu en entier, sans tri automatique. Nous préférons répondre bien que répondre vite, et tout le monde reçoit une réponse.')
    . etapeEmail('02', 'Nous regardons si nos programmes vous servent',
        'Ils visent un niveau de pratique et un moment de parcours précis. S\'ils ne vous apportaient rien encore, nous vous le dirions, en indiquant ce qui nous ferait dire oui plus tard. L\'adhésion n\'est donc pas automatique.')
    . etapeEmail('03', 'Si le dossier est retenu, le paiement arrive par email',
        'Vous recevrez le lien de règlement de la cotisation à cette adresse.')
    . '</table></td></tr>';

  /* Avertissement paiement */
  $h .= '<tr><td style="background:' . MARQUE_CREME . ';padding:0 40px 30px;" class="p">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
    . '<td style="background:#ffffff;border-left:3px solid ' . MARQUE_VIOLET . ';border-radius:0 12px 12px 0;padding:18px 20px;">'
    . '<div style="font-family:' . PILE_TEXTE . ';font-size:14px;line-height:1.6;color:' . MARQUE_ENCRE . ';">'
    . '<strong>Rien n\'est à payer pour le moment.</strong> Nous ne vous demanderons jamais de coordonnées bancaires '
    . 'par téléphone ou par message, et nous ne vous enverrons jamais de RIB pour un virement urgent. '
    . 'Le seul canal est le lien envoyé depuis <span style="white-space:nowrap;">contact@duqque.fr</span> après validation.'
    . '</div></td></tr></table></td></tr>';

  /* Autorisations */
  if ($autos) {
    $h .= '<tr><td style="background:' . MARQUE_CREME . ';padding:0 40px 6px;" class="p">'
      . '<div style="font-family:' . PILE_TEXTE . ';font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;color:'
      . MARQUE_VIOLET . ';margin:0 0 14px;">Vos autorisations</div>'
      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';
    foreach ($autos as $a) {
      $ok = mb_strtoupper($a['valeur']) === 'ACCORDÉE';
      $h .= '<tr><td style="width:26px;padding:7px 0;vertical-align:top;font-family:' . PILE_TEXTE
        . ';font-size:15px;font-weight:700;color:' . ($ok ? '#1c5c30' : '#8a2b2b') . ';">' . ($ok ? '&#10003;' : '&#10005;') . '</td>'
        . '<td style="padding:7px 0;font-family:' . PILE_TEXTE . ';font-size:14px;line-height:1.45;color:'
        . ($ok ? MARQUE_ENCRE : MARQUE_DOUX) . ';">' . e_($a['libelle'])
        . ($ok ? '' : ' <span style="font-size:12px;color:' . MARQUE_DOUX . ';">— refusée</span>') . '</td></tr>';
    }
    $h .= '</table>'
      . '<p style="margin:14px 0 26px;font-family:' . PILE_TEXTE . ';font-size:13px;line-height:1.6;color:' . MARQUE_DOUX . ';">'
      . ($mineur
          ? 'Ce dossier concerne une personne mineure. Chaque autorisation peut être retirée à tout moment, sans avoir à vous justifier, et un retrait n\'a aucune conséquence sur l\'accompagnement sportif.'
          : 'Chaque autorisation peut être retirée à tout moment par simple email, sans avoir à vous justifier.')
      . '</p></td></tr>';
  }

  /* Récapitulatif */
  foreach ($groupes as $section => $lignes) {
    $h .= '<tr><td style="background:' . MARQUE_CREME . ';padding:0 40px 4px;" class="p">'
      . '<div style="font-family:' . PILE_TEXTE . ';font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;color:'
      . MARQUE_VIOLET . ';margin:14px 0 8px;">' . e_($section) . '</div>'
      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';
    foreach ($lignes as $l) $h .= ligneRecap($l['libelle'], $l['valeur']);
    $h .= '</table></td></tr>';
  }

  /* Pied */
  $h .= '<tr><td style="background:' . MARQUE_CREME . ';padding:30px 40px 34px;border-radius:0 0 16px 16px;" class="p">'
    . '<div style="border-top:1px solid ' . MARQUE_LIGNE . ';padding-top:22px;font-family:' . PILE_TEXTE
    . ';font-size:12.5px;line-height:1.7;color:' . MARQUE_DOUX . ';">'
    . 'Vos données sont conservées sur nos serveurs, en Europe, et ne sont transmises à personne sans votre accord. '
    . 'Vous pouvez demander à les consulter, les corriger ou les effacer à tout moment.<br><br>'
    . '<a href="mailto:contact@duqque.fr" style="color:' . MARQUE_VIOLET . ';text-decoration:none;font-weight:600;">contact@duqque.fr</a>'
    . ' &nbsp;·&nbsp; <a href="https://duqque.fr/confidentialite.html" style="color:' . MARQUE_VIOLET . ';text-decoration:none;">Confidentialité</a>'
    . ' &nbsp;·&nbsp; <a href="https://duqque.fr/mentions-legales.html" style="color:' . MARQUE_VIOLET . ';text-decoration:none;">Mentions légales</a>'
    . '</div></td></tr>'
    . '<tr><td align="center" style="padding:18px 12px 6px;font-family:' . PILE_TEXTE
    . ';font-size:11px;color:#7a746b;">Duqque Sports · Paris, France · Lisbonne, Portugal</td></tr>'
    . '</table></td></tr></table></body></html>';

  return $h;
}

function emailAdhesionTexte(array $d): string {
  $ref = (string)($d['ref'] ?? '');
  $groupes = grouperChamps($d['champs'] ?? []);
  $t = "Votre demande d'adhésion à Duqque Sports\n"
     . str_repeat('=', 40) . "\n\n"
     . "Référence de votre dossier : $ref\n"
     . "Conservez-la, elle nous permet de retrouver votre demande.\n"
     . "Le récapitulatif complet est joint à ce message, au format PDF.\n\n"
     . "CE QUI SE PASSE MAINTENANT\n"
     . "Nous prenons le temps de lire votre dossier en entier. Vous recevrez une\n"
     . "réponse dans tous les cas, positive ou non, et nous vous dirons pourquoi.\n\n"
     . "L'adhésion n'est pas automatique : nos programmes visent un niveau de\n"
     . "pratique et un moment de parcours précis. S'ils ne vous servaient pas\n"
     . "encore, nous vous le dirions, en indiquant ce qui nous ferait dire oui\n"
     . "plus tard.\n\n"
     . "SI VOTRE DOSSIER EST RETENU\n"
     . "Vous recevrez le lien de règlement de la cotisation à cette adresse.\n"
     . "Rien n'est à payer pour le moment. Nous ne vous demanderons jamais de\n"
     . "coordonnées bancaires par téléphone ou par message.\n\n";
  foreach ($groupes as $section => $lignes) {
    $t .= mb_strtoupper($section) . "\n";
    foreach ($lignes as $l) $t .= '  ' . $l['libelle'] . ' : ' . $l['valeur'] . "\n";
    $t .= "\n";
  }
  $t .= "VOS DONNÉES\n"
      . "Conservées en Europe, transmises à personne sans votre accord.\n"
      . "contact@duqque.fr · https://duqque.fr/confidentialite.html\n\n"
      . "Duqque Sports\n";
  return $t;
}
