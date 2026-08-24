<?php
/* =========================================================
   RÉCEPTION D'UNE RÉPONSE
   Écrit deux lignes dans deux fichiers distincts : la réponse d'un côté, les
   coordonnées de l'autre. C'est ce qui rend la promesse d'anonymat vérifiable
   plutôt que déclarative.
   ========================================================= */
require __DIR__ . '/_commun.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  repondre(['ok' => false, 'erreur' => 'méthode non permise'], 405);
}

$d = corpsJson();

$q = (string)($d['questionnaire'] ?? '');
if (!in_array($q, QUESTIONNAIRES, true)) repondre(['ok' => false, 'erreur' => 'questionnaire inconnu'], 400);

// Champ piège : invisible dans la page, un robot qui remplit tout se trahit.
if (trim((string)($d['piege'] ?? '')) !== '') repondre(['ok' => true, 'ref' => 'R-0000']);

$brut = $d['reponses'] ?? null;
if (!is_array($brut) || count($brut) === 0) repondre(['ok' => false, 'erreur' => 'aucune réponse'], 400);
if (count($brut) > 200) repondre(['ok' => false, 'erreur' => 'trop de champs'], 400);

/* Cadence : dix envois par heure et par poste suffisent largement à un club qui
   ferait répondre plusieurs personnes, et coupent court à un remplissage
   automatique. */
$cle = 'r' . empreinteClient();
$l = limites();
$e = $l[$cle] ?? ['n' => 0, 'debut' => time(), 'vu' => 0];
if (time() - (int)$e['debut'] > 3600) $e = ['n' => 0, 'debut' => time(), 'vu' => 0];
if ((int)$e['n'] >= 10) repondre(['ok' => false, 'erreur' => 'trop d’envois depuis ce poste, réessayez plus tard'], 429);
$l[$cle] = ['n' => (int)$e['n'] + 1, 'debut' => (int)$e['debut'], 'vu' => time()];
noterLimites($l);

$texte = static function ($v, int $max = 4000): string {
  if (is_array($v)) $v = implode(' | ', array_map('strval', $v));
  $v = str_replace(["\r"], '', (string)$v);
  return mb_substr($v, 0, $max);
};

$reponses = [];
$contact  = [];
foreach ($brut as $r) {
  if (!is_array($r)) continue;
  $id = preg_replace('/[^a-z0-9_]/i', '', (string)($r['id'] ?? ''));
  if ($id === '') continue;
  $enr = [
    'id'      => $id,
    'libelle' => $texte($r['libelle'] ?? '', 300),
    'type'    => preg_replace('/[^a-z]/', '', (string)($r['type'] ?? 'texte')),
    'valeur'  => is_array($r['valeur'] ?? null) ? array_map('strval', $r['valeur']) : $texte($r['valeur'] ?? ''),
  ];
  // Les identifiants ct_ sont les coordonnées facultatives : elles partent ailleurs.
  if (str_starts_with($id, 'ct_')) $contact[] = $enr; else $reponses[] = $enr;
}
if (count($reponses) === 0) repondre(['ok' => false, 'erreur' => 'aucune réponse exploitable'], 400);

dossierPret();
$ref = 'R-' . str_pad((string)(count(lireLignes(F_REPONSES)) + 1), 4, '0', STR_PAD_LEFT);
$recu = gmdate('c');

ajouterLigne(F_REPONSES, [
  'ref'           => $ref,
  'questionnaire' => $q,
  'titre'         => $texte($d['titre'] ?? '', 200),
  'cible'         => $texte($d['cible'] ?? '', 60),
  'recu_le'       => $recu,
  'duree_s'       => max(0, min(86400, (int)($d['duree_s'] ?? 0))),
  'reponses'      => $reponses,
]);

$aRempli = false;
foreach ($contact as $c) { if (trim(is_array($c['valeur']) ? implode('', $c['valeur']) : $c['valeur']) !== '') $aRempli = true; }
if ($aRempli) {
  ajouterLigne(F_CONTACTS, ['ref' => $ref, 'questionnaire' => $q, 'recu_le' => $recu, 'contact' => $contact]);
}

repondre(['ok' => true, 'ref' => $ref]);
