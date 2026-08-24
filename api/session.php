<?php
/* =========================================================
   SESSION ADMINISTRATEUR
   La page acces.html vérifiait le mot de passe dans le navigateur. Cela suffit
   pour masquer un site en préparation, pas pour garder des réponses d'enquête :
   n'importe qui pouvait poser le cookie à la main. La vérification est donc
   refaite ici, où le visiteur n'a pas la main.
   ========================================================= */
require __DIR__ . '/_commun.php';

$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// État de la session, pour que l'interface sache quoi afficher.
if ($methode === 'GET') {
  if (isset($_GET['stop'])) {
    poserCookie('', -1);
    repondre(['ok' => true, 'connecte' => false]);
  }
  repondre(['ok' => true, 'connecte' => jetonValide($_COOKIE['duqque_admin'] ?? null)]);
}

if ($methode !== 'POST') repondre(['ok' => false, 'erreur' => 'méthode non permise'], 405);

$d = corpsJson(4096);
$mdp = (string)($d['mdp'] ?? '');

/* Blocage progressif, tenu côté serveur : au-delà de cinq échecs l'attente
   double à chaque tentative, jusqu'à un quart d'heure. Un parcours exhaustif
   devient impraticable même avec un script. */
$cle = 'a' . empreinteClient();
$l = limites();
$e = $l[$cle] ?? ['n' => 0, 'jusqua' => 0, 'vu' => 0];
$reste = (int)$e['jusqua'] - time();
if ($reste > 0) {
  repondre(['ok' => false, 'erreur' => 'trop de tentatives', 'attente' => $reste], 429);
}

$derive = hash_pbkdf2('sha256', $mdp, hex2bin(config()['sel']), (int)config()['iterations'], 0, false);

if (!hash_equals(config()['cle'], $derive)) {
  $n = (int)$e['n'] + 1;
  $attente = $n >= 5 ? min(30 * (2 ** ($n - 5)), 900) : 0;
  $l[$cle] = ['n' => $n, 'jusqua' => $attente ? time() + $attente : 0, 'vu' => time()];
  noterLimites($l);
  // Une seconde de délai : sans elle, mille essais par minute restent possibles
  // avant même que le compteur ne morde.
  usleep(600000);
  repondre(['ok' => false, 'erreur' => 'mot de passe incorrect', 'attente' => $attente], 401);
}

unset($l[$cle]);
noterLimites($l);
poserCookie(creerJeton(), 2592000);
repondre(['ok' => true, 'connecte' => true]);
