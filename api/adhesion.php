<?php
/* =========================================================
   DEMANDE D'ADHÉSION
   Enregistre le dossier, previent l'association, et accuse reception aupres de
   la personne. Les deux envois partent ; si l'un echoue, la ligne est deja
   ecrite et le dossier n'est pas perdu.

   Les autorisations parentales sont conservees telles qu'elles ont ete cochees,
   une par une, avec l'horodatage et le nom du signataire : c'est ce qui rend le
   consentement prouvable, ce que le RGPD demande a l'article 7.
   ========================================================= */
require __DIR__ . '/_commun.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  repondre(['ok' => false, 'erreur' => 'méthode non permise'], 405);
}

const F_ADHESIONS = DOSSIER_DONNEES . '/adhesions.ndjson';
const DESTINATAIRE = 'contact@duqque.fr';

$d = corpsJson(131072);

// Champ piege : invisible dans la page, un robot qui remplit tout se trahit.
if (trim((string)($d['piege'] ?? '')) !== '') repondre(['ok' => true, 'ref' => 'A-0000']);

$champs = $d['champs'] ?? null;
if (!is_array($champs) || count($champs) === 0) repondre(['ok' => false, 'erreur' => 'dossier vide'], 400);
if (count($champs) > 120) repondre(['ok' => false, 'erreur' => 'trop de champs'], 400);

/* Nettoyage. Les retours chariot sont retires de tout ce qui pourrait finir dans
   un en-tete d'email : c'est par la qu'on injecte des destinataires caches. */
$net = static function ($v, int $max = 2000): string {
  if (is_array($v)) $v = implode(' | ', array_map('strval', $v));
  $v = str_replace(["\r", "\n", "\0"], ' ', (string)$v);
  return trim(mb_substr($v, 0, $max));
};
$netLong = static function ($v, int $max = 4000): string {
  if (is_array($v)) $v = implode(' | ', array_map('strval', $v));
  return trim(mb_substr(str_replace(["\r", "\0"], '', (string)$v), 0, $max));
};

$propres = [];
$par = [];
foreach ($champs as $c) {
  if (!is_array($c)) continue;
  $id = preg_replace('/[^a-z0-9_]/i', '', (string)($c['id'] ?? ''));
  if ($id === '') continue;
  $val = ($c['type'] ?? '') === 'long' ? $netLong($c['valeur'] ?? '') : $net($c['valeur'] ?? '');
  $e = [
    'id'      => $id,
    'libelle' => $net($c['libelle'] ?? '', 300),
    'section' => $net($c['section'] ?? '', 120),
    'type'    => preg_replace('/[^a-z]/', '', (string)($c['type'] ?? 'texte')),
    'valeur'  => $val,
  ];
  $propres[] = $e;
  $par[$id] = $val;
}

$email = filter_var($par['a_email'] ?? '', FILTER_VALIDATE_EMAIL);
if (!$email) repondre(['ok' => false, 'erreur' => 'adresse email invalide'], 400);
$nom = $net(trim(($par['a_prenom'] ?? '') . ' ' . ($par['a_nom'] ?? '')), 120);
if ($nom === '') repondre(['ok' => false, 'erreur' => 'nom manquant'], 400);

/* Cadence : cinq dossiers par heure et par poste. Une famille qui inscrit
   plusieurs enfants reste tranquille, un remplissage automatique s'arrete. */
$cle = 'h' . empreinteClient();
$l = limites();
$e = $l[$cle] ?? ['n' => 0, 'debut' => time(), 'vu' => 0];
if (time() - (int)$e['debut'] > 3600) $e = ['n' => 0, 'debut' => time(), 'vu' => 0];
if ((int)$e['n'] >= 5) repondre(['ok' => false, 'erreur' => 'trop de demandes depuis ce poste, réessayez plus tard'], 429);
$l[$cle] = ['n' => (int)$e['n'] + 1, 'debut' => (int)$e['debut'], 'vu' => time()];
noterLimites($l);

dossierPret();
$recu = gmdate('c');
$fp = fopen(F_ADHESIONS, 'c+');
if ($fp === false) repondre(['ok' => false, 'erreur' => "écriture impossible dans donnees/"], 500);
flock($fp, LOCK_EX);
$n = 0; rewind($fp);
while (($ligne = fgets($fp)) !== false) { if (trim($ligne) !== '') $n++; }
$ref = 'A-' . str_pad((string)($n + 1), 4, '0', STR_PAD_LEFT);
$enr = [
  'ref' => $ref, 'recu_le' => $recu, 'nom' => $nom, 'email' => $email,
  'mineur' => !empty($d['mineur']), 'formule' => $net($d['formule'] ?? ''),
  'champs' => $propres,
];
fseek($fp, 0, SEEK_END);
fwrite($fp, json_encode($enr, JSON_UNESCAPED_UNICODE) . "\n");
fflush($fp); flock($fp, LOCK_UN); fclose($fp);

/* --- Les deux emails ------------------------------------------------------- */

function sujet(string $t): string { return '=?UTF-8?B?' . base64_encode($t) . '?='; }

function envoyer(string $a, string $sujet, string $corps, string $repondreA = ''): bool {
  $entetes = [
    'From: Duqque Sports <' . DESTINATAIRE . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: duqque.fr',
  ];
  if ($repondreA !== '') $entetes[] = 'Reply-To: ' . $repondreA;
  return @mail($a, sujet($sujet), $corps, implode("\r\n", $entetes));
}

// Récapitulatif lisible, section par section, dans l'ordre du formulaire.
$recap = '';
$sectionCourante = null;
foreach ($propres as $c) {
  if ($c['valeur'] === '') continue;
  if ($c['section'] !== $sectionCourante) {
    $sectionCourante = $c['section'];
    $recap .= "\n" . mb_strtoupper($sectionCourante) . "\n" . str_repeat('-', mb_strlen($sectionCourante)) . "\n";
  }
  $recap .= '  ' . $c['libelle'] . " : " . $c['valeur'] . "\n";
}

$vers_asso = "Nouvelle demande d'adhésion\n"
  . "Référence : $ref\n"
  . "Reçue le : " . gmdate('d/m/Y à H:i') . " (UTC)\n"
  . "Statut : " . (!empty($d['mineur']) ? "MINEUR — autorisations parentales requises" : "Majeur") . "\n"
  . $recap
  . "\nRépondre à cet email écrit directement à " . $email . ".\n";

$vers_personne = "Bonjour,\n\n"
  . "Nous avons bien reçu votre demande d'adhésion à Duqque Sports.\n\n"
  . "Référence de votre dossier : $ref\n"
  . "Conservez-la, elle nous permet de retrouver votre demande.\n\n"
  . "CE QUI SE PASSE MAINTENANT\n"
  . "Nous examinons votre dossier et vous répondons sous trois semaines, que la\n"
  . "réponse soit positive ou non. Si nous avons besoin d'une précision, nous\n"
  . "vous écrivons à cette adresse.\n\n"
  . (!empty($d['mineur'])
      ? "AUTORISATIONS PARENTALES\n"
        . "Votre dossier concerne une personne mineure. Les autorisations que vous\n"
        . "avez cochées figurent ci-dessous. Chacune peut être retirée à tout moment,\n"
        . "sans avoir à vous justifier, en écrivant à " . DESTINATAIRE . ".\n"
        . "Un retrait n'a aucune conséquence sur l'accompagnement sportif.\n\n"
      : "")
  . "RÉCAPITULATIF DE VOTRE DEMANDE\n"
  . $recap
  . "\nVOS DONNÉES\n"
  . "Elles sont conservées sur nos serveurs, en Europe, et ne sont transmises à\n"
  . "personne sans votre accord. Vous pouvez demander à les consulter, les\n"
  . "corriger ou les effacer à tout moment : " . DESTINATAIRE . "\n"
  . "Notre politique : https://duqque.fr/confidentialite.html\n\n"
  . "À bientôt,\n"
  . "Duqque Sports\n"
  . DESTINATAIRE . "\n";

$a1 = envoyer(DESTINATAIRE, "Adhésion $ref — $nom" . (!empty($d['mineur']) ? ' (mineur)' : ''), $vers_asso, $email);
$a2 = envoyer($email, "Votre demande d'adhésion à Duqque Sports ($ref)", $vers_personne);

/* Le dossier est enregistre quoi qu'il arrive : on le dit franchement plutot que
   d'annoncer un envoi qui n'a pas eu lieu. */
repondre([
  'ok'            => true,
  'ref'           => $ref,
  'mail_asso'     => $a1,
  'mail_personne' => $a2,
]);
