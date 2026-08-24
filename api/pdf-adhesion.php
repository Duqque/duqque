<?php
/* =========================================================
   RÉCAPITULATIF D'ADHÉSION AU FORMAT PDF
   Le document joint à l'email de confirmation. Il reprend l'habillage du site :
   bandeau sombre, titre en LT Museum, pastille citron, numéros en violet.

   Il fait office de preuve : les autorisations y figurent une par une, avec leur
   état exact au moment de la signature.
   ========================================================= */
declare(strict_types=1);
require_once __DIR__ . '/pdf.php';

function pdfAdhesion(array $d, string $dossierFontes): string {
  $p = new PdfDuqque($dossierFontes);

  $LARG = PdfDuqque::A4_L; $HAUT = PdfDuqque::A4_H;
  $M = 48.0; $L = $LARG - 2 * $M;

  $NOIR   = [0x0a/255, 0x0a/255, 0x0a/255];
  $CREME  = [0xf5/255, 0xf3/255, 0xef/255];
  $ENCRE  = [0x1a/255, 0x14/255, 0x10/255];
  $DOUX   = [0x42/255, 0x3d/255, 0x36/255];
  $VIOLET = [0x4a/255, 0x1f/255, 0xc7/255];
  $LIME   = [0xd9/255, 0xff/255, 0x3d/255];
  $LIGNE  = [0xdc/255, 0xda/255, 0xd6/255];
  $VERT   = [0x1c/255, 0x5c/255, 0x30/255];
  $ROUGE  = [0x8a/255, 0x2b/255, 0x2b/255];
  $LIME_INK = [0x10/255, 0x14/255, 0];

  $ref    = (string)($d['ref'] ?? '');
  $mineur = !empty($d['mineur']);

  $pied = function () use ($p, $M, $L, $LARG, $LIGNE, $DOUX) {
    $p->trait($M, $M + 10, $L, $LIGNE);
    $p->texte($M, $M - 4, 'Duqque Sports · contact@duqque.fr · duqque.fr', 'GILR', 7.5, $DOUX);
    $t = 'Document généré automatiquement';
    $p->texte($LARG - $M - $p->largeur($t, 'GILR', 7.5), $M - 4, $t, 'GILR', 7.5, $DOUX);
  };

  // Première page : fond crème, puis bandeau sombre par-dessus.
  $p->rect(0, 0, $LARG, $HAUT, $CREME);
  $H = 196.0;
  $p->rect(0, $HAUT - $H, $LARG, $H, $NOIR);
  $p->texte($M, $HAUT - 46, 'duqque', 'GILS', 17, $CREME, -0.3);
  $lab = 'ADHÉSION';
  $p->texte($LARG - $M - $p->largeur($lab, 'GILS', 8) - 11, $HAUT - 46, $lab, 'GILS', 8, $LIME, 1.6);
  $p->texte($M, $HAUT - 104, 'Confirmation', 'LTMB', 30, $CREME, -0.5);
  $p->texte($M, $HAUT - 136, 'de votre demande.', 'LTMB', 30, $CREME, -0.5);
  $badge = 'Référence ' . $ref;
  $p->rectArrondi($M, $HAUT - 176, $p->largeur($badge, 'GILS', 10) + 26, 24, 12, $LIME);
  $p->texte($M + 13, $HAUT - 169, $badge, 'GILS', 10, $LIME_INK);
  $p->y = $HAUT - $H - 34;

  $place = function (float $besoin) use ($p, $M, $LARG, $HAUT, $CREME, $pied) {
    if ($p->y - $besoin < $M + 34) {
      $pied();
      $p->nouvellePage();
      $p->rect(0, 0, $LARG, $HAUT, $CREME);
      $p->y = $HAUT - $M - 6;
    }
  };

  $surtitre = function (string $t) use ($p, $M, $VIOLET, $place) {
    $place(52); $p->y -= 10;
    $p->texte($M, $p->y, mb_strtoupper($t, 'UTF-8'), 'GILS', 7.5, $VIOLET, 1.5);
    $p->y -= 18;
  };

  $para = function (string $t, float $taille, array $c, float $inter) use ($p, $M, $L, $place) {
    foreach ($p->couper($t, 'GILR', $taille, $L) as $ligne) {
      $place($inter);
      $p->texte($M, $p->y, $ligne, 'GILR', $taille, $c);
      $p->y -= $inter;
    }
    $p->y -= 4;
  };

  $etape = function (string $n, string $titre, string $texte) use ($p, $M, $L, $VIOLET, $ENCRE, $DOUX, $place) {
    $place(56);
    $p->texte($M, $p->y, $n, 'LTMB', 15, $VIOLET);
    $p->texte($M + 30, $p->y, $titre, 'GILS', 10.5, $ENCRE);
    $p->y -= 15;
    foreach ($p->couper($texte, 'GILR', 9, $L - 30) as $ligne) {
      $place(12);
      $p->texte($M + 30, $p->y, $ligne, 'GILR', 9, $DOUX);
      $p->y -= 12;
    }
    $p->y -= 10;
  };

  $paire = function (string $lib, string $val) use ($p, $M, $L, $DOUX, $ENCRE, $LIGNE, $place) {
    $col = $M + $L * 0.42;
    $lignes = $p->couper($val, 'GILS', 9.5, $L * 0.58 - 8);
    $place(max(14, 13 * count($lignes)) + 8);
    $p->texte($M, $p->y, $lib, 'GILR', 8.8, $DOUX);
    $yy = $p->y;
    foreach ($lignes as $lv) { $p->texte($col, $yy, $lv, 'GILS', 9.5, $ENCRE); $yy -= 13; }
    $p->y = min($p->y - 14, $yy) - 2;
    $p->trait($M, $p->y + 8, $L, $LIGNE);
    $p->y -= 4;
  };

  /* --- Contenu -------------------------------------------------------------- */
  $para("Ce document récapitule la demande d'adhésion enregistrée sous la référence " . $ref
      . ". Il fait foi des autorisations accordées ou refusées à la date de signature.", 9.5, $DOUX, 13.5);

  $surtitre('Ce qui se passe maintenant');
  $etape('01', 'Nous prenons le temps de lire',
    "Chaque dossier est lu en entier, sans tri automatique. Nous préférons répondre bien que répondre vite, et tout le monde reçoit une réponse.");
  $etape('02', 'Nous regardons si nos programmes vous servent',
    "Ils visent un niveau de pratique et un moment de parcours précis. S'ils ne vous apportaient rien encore, nous vous le dirions, en indiquant ce qui nous ferait dire oui plus tard.");
  $etape('03', 'Si le dossier est retenu, le paiement arrive par email',
    "Vous recevrez le lien de règlement de la cotisation. Rien n'est à payer avant cette étape, et aucune coordonnée bancaire ne vous sera jamais demandée par téléphone ou par message.");

  $groupes = []; $autos = [];
  foreach (($d['champs'] ?? []) as $c) {
    $v = is_array($c['valeur'] ?? '') ? implode(' · ', $c['valeur']) : (string)($c['valeur'] ?? '');
    if (trim($v) === '') continue;
    if (($c['section'] ?? '') === 'Les autorisations') $autos[] = [(string)$c['libelle'], $v];
    else $groupes[(string)($c['section'] ?? 'Informations')][] = [(string)$c['libelle'], $v];
  }

  if ($autos) {
    $surtitre('Vos autorisations');
    foreach ($autos as [$lib, $val]) {
      $ok = mb_strtoupper($val, 'UTF-8') === 'ACCORDÉE';
      $place(17);
      $p->coche($M + 0.5, $p->y + 0.6, $ok, $ok ? $VERT : $ROUGE);
      $p->texte($M + 16, $p->y, $lib, 'GILR', 9.5, $ok ? $ENCRE : $DOUX);
      $etat = $ok ? 'accordée' : 'refusée';
      $p->texte($LARG - $M - $p->largeur($etat, 'GILS', 8.5), $p->y, $etat, 'GILS', 8.5, $ok ? $VERT : $ROUGE);
      $p->y -= 16;
    }
    $p->y -= 6;
    $para("Chaque autorisation peut être retirée à tout moment par simple email à contact@duqque.fr, sans avoir à se justifier"
      . ($mineur ? ", et sans conséquence sur l'accompagnement sportif." : "."), 8.5, $DOUX, 12);
  }

  foreach ($groupes as $section => $lignes) {
    $surtitre($section);
    foreach ($lignes as [$lib, $val]) $paire($lib, $val);
    $p->y -= 8;
  }

  $pied();
  return $p->rendre();
}
