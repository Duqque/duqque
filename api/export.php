<?php
/* Export tableur. Une colonne par question, une ligne par réponse : le tableau
   s'ouvre directement dans Excel ou Numbers pour une analyse à part. */
require __DIR__ . '/_commun.php';
exigerAdmin();

$quoi = ($_GET['type'] ?? 'reponses') === 'contacts' ? 'contacts' : 'reponses';
$lignes = lireLignes($quoi === 'contacts' ? F_CONTACTS : F_REPONSES);

$filtre = preg_replace('/[^a-z-]/', '', (string)($_GET['q'] ?? ''));
if ($filtre !== '') {
  $lignes = array_values(array_filter($lignes, fn($l) => ($l['questionnaire'] ?? '') === $filtre));
}

// Colonnes : l'union des questions rencontrées, dans l'ordre d'apparition.
$cols = [];
foreach ($lignes as $l) {
  foreach (($l[$quoi === 'contacts' ? 'contact' : 'reponses'] ?? []) as $r) {
    if (!isset($cols[$r['id']])) $cols[$r['id']] = $r['libelle'] !== '' ? $r['libelle'] : $r['id'];
  }
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="observatoire-' . $quoi . '-' . gmdate('Y-m-d') . '.csv"');
header('Cache-Control: no-store');

$s = fopen('php://output', 'w');
fwrite($s, "\xEF\xBB\xBF"); // BOM : sans lui Excel massacre les accents
fputcsv($s, array_merge(['Référence', 'Questionnaire', 'Reçu le', 'Durée (s)'], array_values($cols)), ';');
foreach ($lignes as $l) {
  $par = [];
  foreach (($l[$quoi === 'contacts' ? 'contact' : 'reponses'] ?? []) as $r) {
    $par[$r['id']] = is_array($r['valeur']) ? implode(' | ', $r['valeur']) : $r['valeur'];
  }
  $ligne = [$l['ref'] ?? '', $l['questionnaire'] ?? '', $l['recu_le'] ?? '', $l['duree_s'] ?? ''];
  foreach (array_keys($cols) as $id) $ligne[] = $par[$id] ?? '';
  fputcsv($s, $ligne, ';');
}
fclose($s);
