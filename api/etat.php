<?php
/* =========================================================
   AUTO-DIAGNOSTIC
   Ouvrez /api/etat.php une fois après le dépôt : cette page vérifie elle-même
   que l'hébergement sait faire tourner le dispositif, et dit quoi corriger.
   Elle n'affiche aucun secret et aucune réponse.
   ========================================================= */
declare(strict_types=1);
header('X-Robots-Tag: noindex');

$v = [];
$v[] = ['PHP exécuté', true, 'version ' . PHP_VERSION];
$v[] = ['PHP 7.4 ou plus récent', version_compare(PHP_VERSION, '7.4', '>='), 'le code utilise des écritures récentes'];
$v[] = ['Extension json', function_exists('json_encode'), 'lecture et écriture des réponses'];
$v[] = ['Extension hash + PBKDF2', function_exists('hash_pbkdf2'), 'vérification du mot de passe'];
$v[] = ['Fonction str_starts_with', function_exists('str_starts_with'), 'PHP 8 requis pour le tri des coordonnées'];

$conf = is_file(__DIR__ . '/config.php');
$v[] = ['api/config.php présent', $conf, $conf ? 'secrets chargés' : "déposez config.php dans public_html/api/"];

$secretOk = false;
if ($conf) {
  $c = require __DIR__ . '/config.php';
  $secretOk = is_array($c) && !empty($c['secret_session']) && strlen((string)$c['secret_session']) >= 32
              && strpos((string)$c['secret_session'], 'REMPLACEZ') === false;
}
$v[] = ['Secret de session renseigné', $secretOk, $secretOk ? 'jetons signés' : 'la clé secret_session est vide ou laissée en exemple'];

$dos = __DIR__ . '/../donnees';
if (!is_dir($dos)) @mkdir($dos, 0750, true);
$ecrit = is_dir($dos) && is_writable($dos);
$v[] = ['Dossier donnees/ inscriptible', $ecrit, $ecrit ? realpath($dos) : "créez le dossier donnees/ et donnez-lui les droits d'écriture (755)"];

$protege = is_file($dos . '/.htaccess');
$v[] = ['donnees/.htaccess en place', $protege, $protege ? 'réponses non téléchargeables directement' : 'déposez donnees/.htaccess'];

/* Analyse syntaxique reelle de chaque fichier, sans l'executer : le tokeniseur
   leve une ParseError sur une erreur de syntaxe. C'est le seul moyen de verifier
   ici un code qui n'a pas pu tourner ailleurs avant d'arriver sur ce serveur. */
$fichiers = ['_commun.php', 'session.php', 'reponses.php', 'resultats.php', 'export.php',
             'adhesion.php', 'adhesions.php', 'email-adhesion.php', 'pdf.php', 'pdf-adhesion.php', 'pdf-fontes.php'];
$fautifs = [];
$analysable = function_exists('token_get_all') && defined('TOKEN_PARSE');
foreach ($fichiers as $f) {
  $chemin = __DIR__ . '/' . $f;
  if (!is_file($chemin)) { $fautifs[] = $f . ' (absent)'; continue; }
  if (!$analysable) continue;
  try { token_get_all((string)file_get_contents($chemin), TOKEN_PARSE); }
  catch (Throwable $e) { $fautifs[] = $f . ' (' . $e->getMessage() . ')'; }
}
$v[] = ['Fichiers du dossier api/ valides', count($fautifs) === 0,
        count($fautifs) ? implode(' · ', $fautifs)
        : ($analysable ? count($fichiers) . ' fichiers analysés, aucune erreur de syntaxe'
                       : count($fichiers) . ' fichiers présents (analyse indisponible sur cet hébergement)')];

/* Le PDF joint à l'email a besoin des fichiers TrueType : sans eux, la pièce
   jointe est simplement omise, mais autant le savoir avant qu'un adhérent le
   découvre. */
$fontes = ['LTMuseum-Black.ttf', 'Gilroy-Regular.ttf', 'Gilroy-SemiBold.ttf'];
$absentes = array_values(array_filter($fontes, fn($f) => !is_file(__DIR__ . '/../assets/fonts/' . $f)));
$v[] = ['Fontes du PDF présentes', count($absentes) === 0,
        $absentes ? 'manquantes : ' . implode(', ', $absentes)
                  : count($fontes) . ' fichiers TrueType trouvés dans assets/fonts/'];

$v[] = ['Compression zlib', function_exists('gzcompress'), 'flux du PDF et pièce jointe'];
$v[] = ['Conversion iconv', function_exists('iconv'), 'encodage WinAnsi du PDF'];

$tout = array_reduce($v, fn($a, $x) => $a && $x[1], true);
?><!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>État du dispositif · Duqque</title>
<style>
body{margin:0;min-height:100vh;background:#0a0a0a;color:#f5f3ef;font:16px/1.6 -apple-system,BlinkMacSystemFont,sans-serif;display:grid;place-items:center;padding:24px}
.b{width:min(100%,620px)}h1{font-size:24px;margin:0 0 6px}p.s{color:rgba(245,243,239,.78);margin:0 0 26px;font-size:14.5px}
ul{list-style:none;padding:0;margin:0}li{display:grid;grid-template-columns:26px 1fr;gap:12px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.12)}
.i{font-weight:700}.ok .i{color:#8ee36b}.ko .i{color:#ff9b9b}b{display:block;font-size:14.5px}small{color:rgba(245,243,239,.72);font-size:13px}
.bilan{margin-top:26px;padding:16px 18px;border-radius:12px;font-size:14.5px}
.bon{background:rgba(142,227,107,.12);border:1px solid rgba(142,227,107,.4)}
.mauvais{background:rgba(255,155,155,.10);border:1px solid rgba(255,155,155,.4)}
a{color:#c4b3ff}
</style></head><body><div class="b">
<h1>État du dispositif</h1><p class="s">Vérification de l'hébergement. Aucun secret ni aucune réponse n'est affiché ici.</p>
<ul><?php foreach ($v as $x): ?>
<li class="<?= $x[1] ? 'ok' : 'ko' ?>"><span class="i"><?= $x[1] ? '✓' : '✗' ?></span>
<span><b><?= htmlspecialchars($x[0]) ?></b><small><?= htmlspecialchars((string)$x[2]) ?></small></span></li>
<?php endforeach; ?></ul>
<div class="bilan <?= $tout ? 'bon' : 'mauvais' ?>">
<?= $tout
  ? "Tout est en place. Les questionnaires peuvent être envoyés, et <a href=\"/resultats.html\">la page résultats</a> s'ouvre avec le mot de passe administrateur."
  : "Corrigez les lignes marquées ✗ ci-dessus, puis rechargez cette page." ?>
</div></div></body></html>
