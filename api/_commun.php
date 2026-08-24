<?php
/* =========================================================
   OBSERVATOIRE — SOCLE COMMUN
   Volontairement minuscule. Tout ce qui peut être calculé dans le navigateur
   l'est : ce fichier ne fait qu'écrire des lignes, en relire, et vérifier une
   session. Moins de code ici, moins de surface à surveiller sur l'hébergement.
   ========================================================= */
declare(strict_types=1);

const DOSSIER_DONNEES = __DIR__ . '/../donnees';
const F_REPONSES = DOSSIER_DONNEES . '/reponses.ndjson';
const F_CONTACTS = DOSSIER_DONNEES . '/contacts.ndjson';
const F_LIMITES  = DOSSIER_DONNEES . '/limites.json';

const QUESTIONNAIRES = [
  'transferts-athletes', 'transferts-clubs',
  'sponsoring-athletes', 'sponsoring-clubs',
];

/* Le secret vit hors du dépôt, comme acces-cle.js. Sans lui, rien ne démarre :
   un service qui accepterait les réponses sans pouvoir les protéger serait pire
   qu'un service indisponible. */
function config(): array {
  static $c = null;
  if ($c === null) {
    $f = __DIR__ . '/config.php';
    if (!is_file($f)) {
      repondre(['ok' => false, 'erreur' => "config.php absent du dossier api/"], 500);
    }
    $c = require $f;
  }
  return $c;
}

function repondre($o, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header('X-Content-Type-Options: nosniff');
  echo json_encode($o, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function corpsJson(int $maxOctets = 262144): array {
  $brut = file_get_contents('php://input');
  if ($brut === false || strlen($brut) === 0) repondre(['ok' => false, 'erreur' => 'corps vide'], 400);
  if (strlen($brut) > $maxOctets)             repondre(['ok' => false, 'erreur' => 'corps trop volumineux'], 413);
  $d = json_decode($brut, true);
  if (!is_array($d)) repondre(['ok' => false, 'erreur' => 'json invalide'], 400);
  return $d;
}

function dossierPret(): void {
  if (!is_dir(DOSSIER_DONNEES)) @mkdir(DOSSIER_DONNEES, 0750, true);
  // Ceinture et bretelles : même si le .htaccess du dossier disparaissait,
  // le contenu ne doit pas être téléchargeable.
  $h = DOSSIER_DONNEES . '/.htaccess';
  if (!is_file($h)) @file_put_contents($h, "Require all denied\n<IfModule !mod_authz_core.c>\n Deny from all\n</IfModule>\n");
}

/** Ajoute une ligne, sous verrou : deux envois simultanés ne peuvent pas se mélanger. */
function ajouterLigne(string $fichier, array $enr): void {
  dossierPret();
  $fp = fopen($fichier, 'a');
  if ($fp === false) repondre(['ok' => false, 'erreur' => "écriture impossible dans donnees/"], 500);
  flock($fp, LOCK_EX);
  fwrite($fp, json_encode($enr, JSON_UNESCAPED_UNICODE) . "\n");
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
}

function lireLignes(string $fichier): array {
  if (!is_file($fichier)) return [];
  $out = [];
  $fp = fopen($fichier, 'r');
  if ($fp === false) return [];
  flock($fp, LOCK_SH);
  while (($l = fgets($fp)) !== false) {
    $l = trim($l);
    if ($l === '') continue;
    $d = json_decode($l, true);
    if (is_array($d)) $out[] = $d;
  }
  flock($fp, LOCK_UN);
  fclose($fp);
  return $out;
}

/* --- Session administrateur ------------------------------------------------
   Le jeton est signé, daté, et le cookie est HttpOnly : le JavaScript de la page
   ne peut pas le lire, donc une faille d'affichage ne peut pas l'exfiltrer. */

function signer(string $charge): string {
  return hash_hmac('sha256', $charge, config()['secret_session']);
}

function creerJeton(int $duree = 2592000): string {
  $exp = time() + $duree;
  $charge = 'admin.' . $exp;
  return $charge . '.' . signer($charge);
}

function jetonValide(?string $jeton): bool {
  if (!$jeton) return false;
  $p = explode('.', $jeton);
  if (count($p) !== 3 || $p[0] !== 'admin') return false;
  if (!ctype_digit($p[1]) || (int)$p[1] < time()) return false;
  return hash_equals(signer($p[0] . '.' . $p[1]), $p[2]);
}

function exigerAdmin(): void {
  if (!jetonValide($_COOKIE['duqque_admin'] ?? null)) {
    repondre(['ok' => false, 'erreur' => 'non autorisé'], 401);
  }
}

function poserCookie(string $valeur, int $duree): void {
  setcookie('duqque_admin', $valeur, [
    'expires'  => $duree > 0 ? time() + $duree : 1,
    'path'     => '/',
    'secure'   => (($_SERVER['HTTPS'] ?? '') !== '') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'),
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
}

/* --- Limitation de cadence -------------------------------------------------
   L'adresse IP n'est jamais stockée telle quelle : seule son empreinte sert,
   et elle ne figure sur aucune réponse. */
function empreinteClient(): string {
  $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0';
  return substr(hash_hmac('sha256', $ip, config()['secret_session']), 0, 16);
}

function limites(): array {
  if (!is_file(F_LIMITES)) return [];
  $d = json_decode((string)@file_get_contents(F_LIMITES), true);
  return is_array($d) ? $d : [];
}

function noterLimites(array $l): void {
  dossierPret();
  // Purge au passage : le fichier ne doit pas grossir indéfiniment.
  $maintenant = time();
  foreach ($l as $k => $v) {
    if (($v['vu'] ?? 0) < $maintenant - 86400) unset($l[$k]);
  }
  @file_put_contents(F_LIMITES, json_encode($l), LOCK_EX);
}
