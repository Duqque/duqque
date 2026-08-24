<?php
/* =========================================================
   LECTURE DES RÉSULTATS — RÉSERVÉE À L'ADMINISTRATION
   Renvoie les données brutes. Les indicateurs et les graphiques sont calculés
   dans le navigateur : le serveur n'a pas à savoir comment ils s'affichent.
   ========================================================= */
require __DIR__ . '/_commun.php';
exigerAdmin();

$reponses = lireLignes(F_REPONSES);
$contacts = isset($_GET['contacts']) ? lireLignes(F_CONTACTS) : [];

repondre([
  'ok'         => true,
  'genere_le'  => gmdate('c'),
  'total'      => count($reponses),
  'nb_contacts'=> count(lireLignes(F_CONTACTS)),
  'reponses'   => $reponses,
  'contacts'   => $contacts,
]);
