<?php
/* =========================================================
   GÉNÉRATEUR PDF
   Écrit un PDF à la main : le format est du texte, et embarquer une bibliothèque
   sur cet hébergement pour poser quinze lignes de texte serait disproportionné.

   Les fontes de la maison sont embarquées telles quelles, en TrueType. Leurs
   métriques viennent de pdf-fontes.php, extraites une fois pour toutes : les
   recalculer à chaque envoi obligerait à analyser les tables TrueType en PHP,
   pour un résultat qui ne change jamais.

   Encodage WinAnsi. Les caractères hors de ce jeu, guillemets courbes et tirets
   longs, sont remplacés avant écriture plutôt qu'affichés en points
   d'interrogation.
   ========================================================= */
declare(strict_types=1);

class PdfDuqque {
  const A4_L = 595.28;
  const A4_H = 841.89;

  public $y = 0.0;
  private $pages = [];
  private $flux = '';
  private $fontes;
  private $dossierFontes;

  public function __construct(string $dossierFontes) {
    $this->fontes = require __DIR__ . '/pdf-fontes.php';
    $this->dossierFontes = rtrim($dossierFontes, '/');
    $this->nouvellePage();
  }

  public function nouvellePage(): void {
    if ($this->flux !== '') $this->pages[] = $this->flux;
    $this->flux = '';
  }

  private function fin(): void { if ($this->flux !== '') { $this->pages[] = $this->flux; $this->flux = ''; } }

  /* --- Texte ---------------------------------------------------------------- */

  public static function winansi(string $t): string {
    $t = strtr($t, [
      '’' => "'", '‘' => "'", '“' => '"', '”' => '"',
      '–' => '-', '—' => '-', '…' => '...',
      "\xc2\xa0" => ' ', "\xe2\x80\xaf" => ' ',
    ]);
    $c = @iconv('UTF-8', 'CP1252//TRANSLIT', $t);
    return $c === false ? preg_replace('/[^\x20-\x7e]/', '?', $t) : $c;
  }

  private static function echapper(string $b): string {
    return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $b);
  }

  public function largeur(string $texte, string $fonte, float $taille): float {
    $b = self::winansi($texte);
    $w = $this->fontes[$fonte]['largeurs'];
    $t = 0;
    for ($i = 0, $n = strlen($b); $i < $n; $i++) {
      $c = ord($b[$i]);
      if ($c >= 32 && $c < 256) $t += $w[$c - 32];
    }
    return $t * $taille / 1000.0;
  }

  /** Découpe un texte en lignes qui tiennent dans la largeur donnée. */
  public function couper(string $texte, string $fonte, float $taille, float $maxi): array {
    $mots = preg_split('/\s+/', trim($texte));
    $lignes = []; $cur = '';
    foreach ($mots as $mot) {
      $essai = $cur === '' ? $mot : $cur . ' ' . $mot;
      if ($cur === '' || $this->largeur($essai, $fonte, $taille) <= $maxi) $cur = $essai;
      else { $lignes[] = $cur; $cur = $mot; }
    }
    if ($cur !== '') $lignes[] = $cur;
    return $lignes;
  }

  public function texte(float $x, float $y, string $t, string $fonte, float $taille, array $c, float $espacement = 0.0): void {
    $this->flux .= sprintf("BT /%s %.2F Tf %.3F %.3F %.3F rg %.2F Tc 1 0 0 1 %.2F %.2F Tm (%s) Tj ET\n",
      $fonte, $taille, $c[0], $c[1], $c[2], $espacement, $x, $y, self::echapper(self::winansi($t)));
  }

  /* --- Formes --------------------------------------------------------------- */

  public function rect(float $x, float $y, float $w, float $h, array $c): void {
    $this->flux .= sprintf("%.3F %.3F %.3F rg %.2F %.2F %.2F %.2F re f\n", $c[0], $c[1], $c[2], $x, $y, $w, $h);
  }

  public function rectArrondi(float $x, float $y, float $w, float $h, float $r, array $c): void {
    $k = 0.5523 * $r;
    $f = sprintf("%.3F %.3F %.3F rg\n", $c[0], $c[1], $c[2]);
    $f .= sprintf("%.2F %.2F m\n", $x + $r, $y);
    $f .= sprintf("%.2F %.2F l\n", $x + $w - $r, $y);
    $f .= sprintf("%.2F %.2F %.2F %.2F %.2F %.2F c\n", $x+$w-$r+$k, $y, $x+$w, $y+$r-$k, $x+$w, $y+$r);
    $f .= sprintf("%.2F %.2F l\n", $x + $w, $y + $h - $r);
    $f .= sprintf("%.2F %.2F %.2F %.2F %.2F %.2F c\n", $x+$w, $y+$h-$r+$k, $x+$w-$r+$k, $y+$h, $x+$w-$r, $y+$h);
    $f .= sprintf("%.2F %.2F l\n", $x + $r, $y + $h);
    $f .= sprintf("%.2F %.2F %.2F %.2F %.2F %.2F c\n", $x+$r-$k, $y+$h, $x, $y+$h-$r+$k, $x, $y+$h-$r);
    $f .= sprintf("%.2F %.2F l\n", $x, $y + $r);
    $f .= sprintf("%.2F %.2F %.2F %.2F %.2F %.2F c\n", $x, $y+$r-$k, $x+$r-$k, $y, $x+$r, $y);
    $this->flux .= $f . "f\n";
  }

  public function trait(float $x, float $y, float $w, array $c, float $ep = 0.6): void {
    $this->flux .= sprintf("%.3F %.3F %.3F RG %.2F w %.2F %.2F m %.2F %.2F l S\n", $c[0], $c[1], $c[2], $ep, $x, $y, $x + $w, $y);
  }

  /** Coche ou croix en vectoriel : ces signes n'existent pas dans WinAnsi. */
  public function coche(float $x, float $y, bool $ok, array $c): void {
    $f = sprintf("%.3F %.3F %.3F RG 1.3 w 1 J 1 j\n", $c[0], $c[1], $c[2]);
    if ($ok) {
      $f .= sprintf("%.2F %.2F m %.2F %.2F l %.2F %.2F l S\n", $x, $y + 2.6, $x + 2.4, $y + 0.2, $x + 7.0, $y + 6.4);
    } else {
      $f .= sprintf("%.2F %.2F m %.2F %.2F l S\n", $x, $y, $x + 6.4, $y + 6.4);
      $f .= sprintf("%.2F %.2F m %.2F %.2F l S\n", $x + 6.4, $y, $x, $y + 6.4);
    }
    $this->flux .= $f;
  }

  /* --- Assemblage ----------------------------------------------------------- */

  public function rendre(): string {
    $this->fin();
    $objets = [];
    $buf = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
    $ajouter = function (string $contenu) use (&$objets, &$buf): int {
      $objets[] = strlen($buf);
      $buf .= (count($objets)) . " 0 obj\n" . $contenu . "\nendobj\n";
      return count($objets);
    };

    $refs = [];
    foreach ($this->fontes as $cle => $d) {
      $brut = (string)@file_get_contents($this->dossierFontes . '/' . $d['fichier']);
      if ($brut === '') throw new RuntimeException('fonte introuvable : ' . $d['fichier']);
      $comp = gzcompress($brut, 9);
      $nFichier = $ajouter("<< /Length " . strlen($comp) . " /Filter /FlateDecode /Length1 " . strlen($brut) . " >>\nstream\n" . $comp . "\nendstream");
      $nDesc = $ajouter(sprintf(
        "<< /Type /FontDescriptor /FontName /%s /Flags %d /FontBBox [%d %d %d %d] /ItalicAngle %d /Ascent %d /Descent %d /CapHeight %d /StemV %d /FontFile2 %d 0 R >>",
        $d['nom'], $d['flags'], $d['bbox'][0], $d['bbox'][1], $d['bbox'][2], $d['bbox'][3],
        $d['italicAngle'], $d['ascent'], $d['descent'], $d['capHeight'], $d['stemV'], $nFichier));
      $refs[$cle] = $ajouter(sprintf(
        "<< /Type /Font /Subtype /TrueType /BaseFont /%s /FirstChar 32 /LastChar 255 /Widths [%s] /FontDescriptor %d 0 R /Encoding /WinAnsiEncoding >>",
        $d['nom'], implode(' ', $d['largeurs']), $nDesc));
    }

    $police = '<< ';
    foreach ($refs as $cle => $n) $police .= '/' . $cle . ' ' . $n . ' 0 R ';
    $police .= '>>';

    $nContenus = [];
    foreach ($this->pages as $data) {
      $comp = gzcompress($data, 9);
      $nContenus[] = $ajouter("<< /Length " . strlen($comp) . " /Filter /FlateDecode >>\nstream\n" . $comp . "\nendstream");
    }

    // Le noeud Pages est écrit après les pages, mais chacune doit le référencer :
    // son numéro est donc calculé d'avance, puis vérifié.
    $nPagesPrevu = count($objets) + count($nContenus) + 1;
    $nPageObjets = [];
    foreach ($nContenus as $n) {
      $nPageObjets[] = $ajouter(sprintf(
        "<< /Type /Page /Parent %d 0 R /MediaBox [0 0 %.2F %.2F] /Resources << /Font %s >> /Contents %d 0 R >>",
        $nPagesPrevu, self::A4_L, self::A4_H, $police, $n));
    }
    $nPages = $ajouter(sprintf("<< /Type /Pages /Count %d /Kids [%s] >>",
      count($nPageObjets), implode(' ', array_map(fn($k) => $k . ' 0 R', $nPageObjets))));
    if ($nPages !== $nPagesPrevu) throw new RuntimeException('numérotation des objets incohérente');

    $nInfos = $ajouter("<< /Title (Demande d'adhesion - Duqque Sports) /Producer (duqque.fr) /Creator (duqque.fr) >>");
    $nCat = $ajouter(sprintf("<< /Type /Catalog /Pages %d 0 R >>", $nPages));

    $pos = strlen($buf);
    $buf .= "xref\n0 " . (count($objets) + 1) . "\n0000000000 65535 f \n";
    foreach ($objets as $o) $buf .= sprintf("%010d 00000 n \n", $o);
    $buf .= sprintf("trailer\n<< /Size %d /Root %d 0 R /Info %d 0 R >>\nstartxref\n%d\n%%%%EOF\n",
      count($objets) + 1, $nCat, $nInfos, $pos);
    return $buf;
  }
}
