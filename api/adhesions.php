<?php
/* =========================================================
   DOSSIERS D'ADHÉSION — RÉSERVÉ À L'ADMINISTRATION
   Lit les dossiers reçus et tient leur statut.

   Le statut vit dans un fichier séparé du dossier lui-même. Le dossier est ce
   que la personne a déclaré et signé : il ne doit jamais être réécrit. Le
   statut est ce que l'association en fait, et il change. Deux natures, deux
   fichiers.
   ========================================================= */
require __DIR__ . '/_commun.php';
exigerAdmin();

const F_ADHESIONS = DOSSIER_DONNEES . '/adhesions.ndjson';
const F_STATUTS   = DOSSIER_DONNEES . '/adhesions-statuts.json';

const STATUTS = ['recue', 'validee', 'payee', 'refusee'];

function statuts(): array {
  if (!is_file(F_STATUTS)) return [];
  $d = json_decode((string)@file_get_contents(F_STATUTS), true);
  return is_array($d) ? $d : [];
}

$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($methode === 'GET') {
  $dossiers = lireLignes(F_ADHESIONS);
  $s = statuts();
  foreach ($dossiers as &$d) {
    $e = $s[$d['ref'] ?? ''] ?? null;
    $d['statut'] = $e['statut'] ?? 'recue';
    $d['statut_maj'] = $e['maj'] ?? ($d['recu_le'] ?? '');
    $d['note'] = $e['note'] ?? '';
  }
  unset($d);
  repondre(['ok' => true, 'genere_le' => gmdate('c'), 'total' => count($dossiers), 'dossiers' => $dossiers]);
}

if ($methode !== 'POST') repondre(['ok' => false, 'erreur' => 'méthode non permise'], 405);

$d = corpsJson(8192);
$ref = preg_replace('/[^A-Z0-9-]/', '', (string)($d['ref'] ?? ''));
$statut = (string)($d['statut'] ?? '');
if ($ref === '') repondre(['ok' => false, 'erreur' => 'référence manquante'], 400);
if (!in_array($statut, STATUTS, true)) repondre(['ok' => false, 'erreur' => 'statut inconnu'], 400);

// La référence doit exister : sinon on créerait un statut orphelin.
$connue = false;
foreach (lireLignes(F_ADHESIONS) as $x) { if (($x['ref'] ?? '') === $ref) { $connue = true; break; } }
if (!$connue) repondre(['ok' => false, 'erreur' => 'dossier introuvable'], 404);

dossierPret();
$fp = fopen(F_STATUTS, 'c+');
if ($fp === false) repondre(['ok' => false, 'erreur' => "écriture impossible dans donnees/"], 500);
flock($fp, LOCK_EX);
$brut = stream_get_contents($fp);
$s = json_decode((string)$brut, true);
if (!is_array($s)) $s = [];
$s[$ref] = [
  'statut' => $statut,
  'maj'    => gmdate('c'),
  'note'   => mb_substr(str_replace(["\r", "\0"], '', (string)($d['note'] ?? '')), 0, 1000),
];
ftruncate($fp, 0); rewind($fp);
fwrite($fp, json_encode($s, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
fflush($fp); flock($fp, LOCK_UN); fclose($fp);

repondre(['ok' => true, 'ref' => $ref, 'statut' => $statut, 'maj' => $s[$ref]['maj']]);
