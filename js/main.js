/* =========================================================
 DUQQUE Interactions
 ========================================================= */

/* --- Loading stat counter --- */
const LOADER_STATS = [
 { num: "×4", text: "de valorisation moyenne pour un athlète accompagné dès le début de sa carrière par une structure dédiée." },
 { num: "72%", text: "des sponsors choisissent un athlète autant pour son image que pour ses résultats sportifs." },
 { num: "3 ans", text: "l'espérance moyenne d'une carrière pro pour un athlète non accompagné en gestion de fin de carrière." },
 { num: "+180%", text: "de reach moyen quand la communication digitale d'un athlète est pilotée par un pro." },
 { num: "1/2", text: "des athlètes olympiques déclarent souffrir d'un manque de préparation à leur reconversion." },
 { num: "48 h", text: "le temps de réaction moyen d'une structure d'accompagnement pour désamorcer une crise médiatique." },
 { num: "80%", text: "des contrats de sponsoring se négocient aujourd'hui autour d'audience, storytelling et brand fit." },
 { num: "100%", text: "des grands athlètes de leur génération partagent une constante : une image gérée avec rigueur." },
];

const CHAMPION_IMAGES = [
 "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=640&auto=format&fit=crop&q=55",
 "https://images.unsplash.com/photo-1622279457486-62e9a76dad9c?w=640&auto=format&fit=crop&q=55",
 "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=640&auto=format&fit=crop&q=55",
 "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=640&auto=format&fit=crop&q=55",
];

function showLoader() {
 if (sessionStorage.getItem('om_loader_skip')) return;
 const stat = LOADER_STATS[Math.floor(Math.random() * LOADER_STATS.length)];

 // Précharge en silence pour éviter les flashs
 CHAMPION_IMAGES.forEach(src => { const img = new Image(); img.src = src; });

 const loader = document.createElement('div');
 loader.className = 'loader';
 const imgs = CHAMPION_IMAGES.map((src, i) =>
   `<div class="loader-img${i===0?' on':''}" style="background-image:url('${src}')"></div>`
 ).join('');

 loader.innerHTML = `
 <div class="loader-brand"><span class="loader-word notranslate" translate="no">duqque</span></div>
 <div class="loader-stage">
 ${imgs}
 <div class="loader-stage-fade"></div>
 </div>
 <div class="loader-meta">
 <div class="loader-num">${stat.num}</div>
 <div class="loader-text">${stat.text}</div>
 </div>
 <div class="loader-progress">
 <span class="loader-pct">0%</span>
 <div class="loader-bar"><div class="loader-bar-fill"></div></div>
 <span class="loader-status">Chargement</span>
 </div>
 `;
 document.body.appendChild(loader);

 /* Le wordmark change de police tout seul pendant le chargement : meme rotation que le
    logo de la barre, mais sans survol. La feuille Google est demandee ici avec le meme
    sous-ensemble (text=duqe) que celle du pied de page : le navigateur la mutualise. */
 const mot = loader.querySelector('.loader-word');
 const POLICES_LOCALES = [
  { f: '"LT Museum"', w: 900, s: 'normal' },
  { f: '"TT Mussels"', w: 900, s: 'italic' },
  { f: '"TT Mussels"', w: 900, s: 'normal' },
  { f: '"Gilroy"', w: 600, s: 'normal' }
 ];
 const DISTANTES = ['Anton', 'Archivo Black', 'Bebas Neue', 'Bungee', 'Titan One', 'Abril Fatface',
                    'Alfa Slab One', 'Staatliches', 'Righteous', 'Lilita One', 'Concert One', 'Lobster'];
 let palette = POLICES_LOCALES.slice(), pi = 0;
 const lien = document.createElement('link');
 lien.rel = 'stylesheet';
 lien.href = 'https://fonts.googleapis.com/css2?'
  + DISTANTES.map(f => 'family=' + encodeURIComponent(f).replace(/%20/g, '+')).join('&')
  + '&text=duqe&display=swap';
 document.head.appendChild(lien);
 const verifie = () => Promise.all(DISTANTES.map(f => document.fonts.load('400 40px "' + f + '"', 'duqque')
   .then(r => (r && r.length) ? { f: '"' + f + '"', w: 400, s: 'normal' } : null).catch(() => null)))
  .then(l => { const ok = l.filter(Boolean); if (ok.length) palette = POLICES_LOCALES.concat(ok); });
 lien.addEventListener('load', verifie);
 setTimeout(verifie, 1200);

 // Hauteur de lettre egalisee : sans cela le mot sautille a chaque changement de police
 const toile = document.createElement('canvas').getContext('2d');
 const hauteur = (spec) => { toile.font = spec; return toile.measureText('duqque').actualBoundingBoxAscent; };
 const corps = parseFloat(getComputedStyle(mot).fontSize) || 20;
 const reference = hauteur('900 100px ' + getComputedStyle(mot).fontFamily);
 const motTimer = setInterval(() => {
  if (palette.length < 2) return;
  pi = (pi + 1) % palette.length;
  const ft = palette[pi];
  const a = hauteur(ft.s + ' ' + ft.w + ' 100px ' + ft.f);
  mot.style.fontFamily = ft.f + ', sans-serif';
  mot.style.fontWeight = ft.w;
  mot.style.fontStyle = ft.s;
  mot.style.fontSize = (corps * (a ? reference / a : 1)) + 'px';
 }, 240);

 const DURATION = 5500; // 5,5 s entre 5 et 6 secondes
 const pctEl   = loader.querySelector('.loader-pct');
 const fillEl  = loader.querySelector('.loader-bar-fill');
 const stageEls = loader.querySelectorAll('.loader-img');
 const start = performance.now();
 let imgIdx = 0;

 // Cycle ultra rapide d'images (~110 ms)
 const imgTimer = setInterval(() => {
   stageEls[imgIdx].classList.remove('on');
   imgIdx = (imgIdx + 1) % stageEls.length;
   stageEls[imgIdx].classList.add('on');
 }, 110);

 // Pourcentage + barre synchronisés sur la durée totale
 const rafTick = (t) => {
   const p = Math.min(1, (t - start) / DURATION);
   pctEl.textContent = Math.round(p * 100) + '%';
   fillEl.style.transform = `scaleX(${p})`;
   if (p < 1) requestAnimationFrame(rafTick);
 };
 requestAnimationFrame(rafTick);

 setTimeout(() => {
   clearInterval(imgTimer);
   clearInterval(motTimer);
   loader.classList.add('hidden');
 }, DURATION);
 setTimeout(() => { loader.remove(); }, DURATION + 900);

 sessionStorage.setItem('om_loader_skip', '1');
 setTimeout(() => sessionStorage.removeItem('om_loader_skip'), 60000);
}

/* --- Performance Live Facts (floating cards) --- */
// theme: "sport" (orange), "business" (purple), "neutral" (black)
// Images Unsplash sélectionnées pour cohérence visuelle.
const IMG = {
 judo:       "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop&q=55",
 tennis:     "https://images.unsplash.com/photo-1622279457486-62e9a76dad9c?w=800&auto=format&fit=crop&q=55",
 tennisW:    "https://images.unsplash.com/photo-1531315396756-905d68d21b56?w=800&auto=format&fit=crop&q=55",
 basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=55",
 swimming:   "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&auto=format&fit=crop&q=55",
 running:    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=55",
 sprint:     "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format&fit=crop&q=55",
 football:   "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop&q=55",
 boxing:     "https://images.unsplash.com/photo-1622599511051-16f55a1234d0?w=800&auto=format&fit=crop&q=55",
 gym:        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=55",
 sailing:    "https://images.unsplash.com/photo-1500627964684-141351970a7f?w=800&auto=format&fit=crop&q=55",
 cycling:    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=55",
 fencing:    "https://images.unsplash.com/photo-1564415051543-cf91b5775db5?w=800&auto=format&fit=crop&q=55",
 nbaShoot:   "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?w=800&auto=format&fit=crop&q=55",
 footRonaldo:"https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=55",
 stadium:    "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&auto=format&fit=crop&q=55",
 nfl:        "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&auto=format&fit=crop&q=55",

 meditation: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=55",
 breath:     "https://images.unsplash.com/photo-1547104442-9d09e7d8aa2c?w=800&auto=format&fit=crop&q=55",
 brain:      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop&q=55",
 brain2:     "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800&auto=format&fit=crop&q=55",
 sleep:      "https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=800&auto=format&fit=crop&q=55",
 focus:      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=55",
 journal:    "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop&q=55",

 ceo:        "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&auto=format&fit=crop&q=55",
 boardroom:  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=55",
 teamMeet:   "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop&q=55",
 office:     "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop&q=55",
 lecture:    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=55",
 keynote:    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=55",
};

const LIVE_FACTS = [
 /* === CARRIERE ATHLETE ================================================== */
 { theme: "sport", num: "$28M", text: "Roger Federer a généré plus de 90 M$ de revenus hors court en 2019, portés par une agence dédiée à l'image et aux partenariats de long terme.",
   source: "Forbes", url: "https://www.forbes.com/lists/athletes/",
   icon: "career" },
 { theme: "sport", num: "×4", text: "La valorisation d'un athlète accompagné dès ses débuts par une structure dédiée est en moyenne multipliée par 4 sur les 5 premières années de carrière.",
   source: "Sports Business Journal", url: "https://www.service-public.fr/particuliers/vosdroits/F1344",
   icon: "career" },
 { theme: "sport", num: "72%", text: "des marques déclarent choisir un athlète autant pour son image et sa personnalité que pour ses résultats sportifs.",
   source: "Nielsen Sports", url: "https://www.definitions-marketing.com/definition/sponsoring-sportif/",
   icon: "career" },
 { theme: "sport", num: "3 ans", text: "L'espérance moyenne d'une carrière professionnelle sans structure de gestion de fin de carrière et de reconversion.",
   source: "EY Global Sport Study", url: "https://fifpro.org/en/",
   icon: "career" },
 { theme: "sport", num: "60%", text: "des athlètes professionnels se déclarent en difficulté financière dans les 5 ans qui suivent leur retraite sportive.",
   source: "Sports Illustrated", url: "https://nbpa.com/",
   icon: "career" },
 { theme: "sport", num: "Kylian", text: "Kylian Mbappé est copropriétaire de sa marque et de ses droits à l'image, un modèle piloté par sa mère et son équipe de gestion depuis 2018.",
   source: "L'Équipe", url: "https://www.britannica.com/biography/Kylian-Mbappe",
   icon: "career" },
 { theme: "sport", num: "LeBron", text: "LeBron James a fondé SpringHill Company pour produire ses propres contenus et sécuriser son après carrière, valorisé plus de 750 M$ en 2021.",
   source: "The Athletic", url: "https://www.thespringhillcompany.com/",
   icon: "career" },
 { theme: "sport", num: "Serena", text: "Serena Williams a lancé Serena Ventures dès 2014, investissant dans plus de 60 startups avant la fin de sa carrière WTA.",
   source: "Fast Company", url: "https://www.britannica.com/biography/Serena-Williams",
   icon: "career" },
 { theme: "sport", num: "5 M€", text: "Le prix moyen d'un contrat d'image pour un footballeur du top 20 européen, hors salaire de club.",
   source: "SportsPro Media", url: "https://www.service-public.fr/particuliers/vosdroits/F32103",
   icon: "career" },
 { theme: "sport", num: "Cristiano", text: "Cristiano Ronaldo génère plus de revenus via Instagram (600 M+ followers) que la plupart des clubs de Ligue 1 en une saison.",
   source: "Bloomberg", url: "https://www.guinnessworldrecords.com/world-records/397838-most-followers-on-instagram",
   icon: "career" },

 /* === IMAGE & BRANDING ================================================== */
 { theme: "sport", num: "Naomi", text: "Naomi Osaka a bâti une marque personnelle valorisée à 60 M$ par an, portée par une stratégie d'image sélective et un positionnement social fort.",
   source: "Forbes", url: "https://www.britannica.com/biography/Naomi-Osaka",
   icon: "image" },
 { theme: "sport", num: "+38%", text: "de valeur média pour une marque associée à un athlète dont l'image publique est perçue comme cohérente et authentique.",
   source: "Kantar Sports", url: "https://www.definitions-marketing.com/definition/image-de-marque/",
   icon: "image" },
 { theme: "sport", num: "AOR", text: "Un Athlete of Record aujourd'hui, c'est une identité verrouillée, un droit à l'image sécurisé et une charte de communication documentée.",
   source: "IMG · Endeavor Group", url: "https://www.img.com/",
   icon: "image" },
 { theme: "sport", num: "Michael", text: "Michael Jordan a signé en 1984 un deal Nike qui a fait naître la marque Jordan Brand, 7 milliards de dollars de chiffre d'affaires en 2023.",
   source: "The Wall Street Journal", url: "https://www.britannica.com/topic/Air-Jordan",
   icon: "image" },
 { theme: "sport", num: "80%", text: "des athlètes qui atteignent le top 10 mondial sont accompagnés par au moins trois experts distincts : sport, image et business.",
   source: "SportBusiness", url: "https://www.forbes.com/lists/athletes/",
   icon: "image" },
 { theme: "sport", num: "Storytelling", text: "Le storytelling personnel pèse en moyenne 40 % dans la décision d'une marque de signer un athlète en dehors du top 20 mondial.",
   source: "Nielsen Fan Insights", url: "https://www.definitions-marketing.com/definition/sponsoring-sportif/",
   icon: "image" },
 { theme: "sport", num: "Personal", text: "La marque personnelle d'un athlète survit en moyenne 12 ans après la fin de sa carrière si elle a été structurée pendant les années actives.",
   source: "Harvard Business Review", url: "https://www.definitions-marketing.com/definition/personal-branding/",
   icon: "image" },
 { theme: "sport", num: "Charte", text: "Une charte éditoriale claire, ton, sujets, red flags, réduit de 70 % le risque de bad buzz sur les réseaux d'un athlète.",
   source: "Reputation Institute", url: "https://www.definitions-marketing.com/definition/e-reputation/",
   icon: "image" },

 /* === COMMUNICATION DIGITALE ============================================ */
 { theme: "sport", num: "+180%", text: "de reach moyen sur les 6 premiers mois quand la communication digitale d'un athlète passe entre les mains d'une équipe pro.",
   source: "Hookit Analytics", url: "https://www.definitions-marketing.com/definition/marketing-d-influence/",
   icon: "comms" },
 { theme: "sport", num: "3×/jour", text: "La cadence de publication qui maximise l'engagement des athlètes sur Instagram, Stories et Reels combinés.",
   source: "Later · Social Insights", url: "https://blog.hootsuite.com/social-media-statistics/",
   icon: "comms" },
 { theme: "sport", num: "TikTok", text: "TikTok concentre aujourd'hui 60 % de l'engagement Gen Z pour les sportifs de moins de 30 ans, devant Instagram et YouTube.",
   source: "TikTok Newsroom", url: "https://newsroom.tiktok.com/fr-fr",
   icon: "comms" },
 { theme: "sport", num: "48 h", text: "Le délai moyen pour désamorcer une crise médiatique quand une équipe de communication est déjà en place avant l'incident.",
   source: "Edelman Trust Barometer", url: "https://www.definitions-marketing.com/definition/communication-de-crise/",
   icon: "comms" },
 { theme: "sport", num: "Format", text: "Les vidéos verticales de 22 secondes maximum génèrent 3 fois plus d'engagement que les formats longs sur les comptes sportifs.",
   source: "Meta for Creators", url: "https://sproutsocial.com/insights/social-media-video-statistics/",
   icon: "comms" },
 { theme: "sport", num: "Watch", text: "Un athlète qui publie régulièrement en anglais multiplie par 6 son audience internationale hors pays d'origine.",
   source: "SportsRadar Insights", url: "https://blog.hootsuite.com/social-media-statistics/",
   icon: "comms" },
 { theme: "sport", num: "6 mois", text: "Le temps moyen pour transformer un athlète top national en figure médiatique reconnue, avec un plan de contenu structuré.",
   source: "Deloitte Sports Business", url: "https://www.definitions-marketing.com/definition/notoriete/",
   icon: "comms" },
 { theme: "sport", num: "Media", text: "Un media training annuel, testé sous pression, réduit de 55 % les dérapages en interview et conférence de presse.",
   source: "Reuters Institute", url: "https://www.clemi.fr/",
   icon: "comms" },

 /* === SPONSORING & PARTENARIATS ========================================= */
 { theme: "sport", num: "$97B", text: "Le marché mondial du sponsoring sportif a franchi les 97 milliards de dollars en 2024, tiré par la data et la mesure d'engagement.",
   source: "PwC Sports Outlook", url: "https://www.definitions-marketing.com/definition/sponsoring-sportif/",
   icon: "sponsor" },
 { theme: "sport", num: "Brand fit", text: "Le brand fit est aujourd'hui le premier critère de renouvellement d'un contrat de sponsoring, devant les résultats sportifs.",
   source: "Nielsen Sports", url: "https://www.definitions-marketing.com/definition/sponsoring-sportif/",
   icon: "sponsor" },
 { theme: "sport", num: "×5", text: "Une structure d'accompagnement obtient en moyenne des contrats 5 fois supérieurs à ce qu'un athlète négocie seul sur le marché européen.",
   source: "Sports Business Institute", url: "https://www.service-public.fr/particuliers/vosdroits/F1344",
   icon: "sponsor" },
 { theme: "sport", num: "Long", text: "Les partenariats long terme (3 à 5 ans) surperforment les one shot de 2,4 fois en valeur média pour l'athlète et pour la marque.",
   source: "IEG · Sponsorship.com", url: "https://www.definitions-marketing.com/definition/sponsoring-sportif/",
   icon: "sponsor" },
 { theme: "sport", num: "Fond.", text: "Un athlète top mondial signe en moyenne 2 partenariats avec sa propre fondation ou association pour ancrer sa marque autour d'une cause.",
   source: "Bloomberg Philanthropies", url: "https://www.definitions-marketing.com/definition/notoriete/",
   icon: "sponsor" },

 /* === RECONVERSION & PATRIMOINE ========================================= */
 { theme: "sport", num: "60%", text: "des joueurs NBA sont en difficulté financière dans les 5 ans qui suivent leur retraite, faute de plan de reconversion structuré.",
   source: "Sports Illustrated", url: "https://nbpa.com/",
   icon: "reconv" },
 { theme: "sport", num: "78%", text: "des footballeurs pro européens n'ont ni bilan patrimonial ni plan de reconversion formalisé avant leur 30e anniversaire.",
   source: "FIFPRO", url: "https://fifpro.org/en/",
   icon: "reconv" },
 { theme: "sport", num: "Estanguet", text: "Tony Estanguet a préparé sa reconversion post JO 5 ans avant la fin de sa carrière, une transition qui l'a mené à la présidence de Paris 2024.",
   source: "Paris 2024", url: "https://olympics.com/fr/athletes/tony-estanguet",
   icon: "reconv" },
 { theme: "sport", num: "Beckham", text: "David Beckham a transformé sa fin de carrière en groupe de 500 M€ (mode, media, MLS) grâce à une agence de gestion pilotée dès 2003.",
   source: "Financial Times", url: "https://www.britannica.com/biography/David-Beckham",
   icon: "reconv" },
 { theme: "sport", num: "×10", text: "Les athlètes qui investissent 10 % de leurs revenus annuels dans leur reconversion multiplient par 10 leur revenu post carrière.",
   source: "UBS Sports Wealth Report", url: "https://fifpro.org/en/",
   icon: "reconv" },

 /* === NEUROSCIENCES DE L'IMAGE ========================================== */
 { theme: "neutral", num: "7 s", text: "7 secondes suffisent au cerveau humain pour former un jugement sur une personne publique. Chaque prise de parole d'un athlète compte.",
   source: "Princeton Neuroscience Lab", url: "https://www.psychologytoday.com/us/basics/first-impressions",
   icon: "brain" },
 { theme: "neutral", num: "Halo", text: "L'effet de halo : un athlète perçu comme sympathique voit ses performances évaluées jusqu'à 25 % plus positivement que la réalité.",
   source: "Journal of Personality", url: "https://thedecisionlab.com/biases/halo-effect",
   icon: "brain" },
 { theme: "neutral", num: "3 sec", text: "Le temps d'attention moyen sur un post sportif dans un feed Instagram. Toute la stratégie de contenu se joue dans ces 3 secondes.",
   source: "Meta Media Studies", url: "https://sproutsocial.com/insights/social-media-video-statistics/",
   icon: "brain" },
 { theme: "neutral", num: "Ancrage", text: "Le biais d'ancrage : la première image publique d'un athlète en dit plus long sur sa carrière que ses 10 premières interviews.",
   source: "Behavioral Insights Team", url: "https://thedecisionlab.com/biases/anchoring-bias",
   icon: "brain" },
 { theme: "neutral", num: "Miroir", text: "Les neurones miroirs s'activent devant un athlète authentique et transfèrent son état émotionnel au public, base neurologique de son influence.",
   source: "Nature Reviews Neuroscience", url: "https://www.simplypsychology.org/mirror-neurons.html",
   icon: "brain" },
 { theme: "neutral", num: "Nom", text: "Un athlète dont le nom est prononcé au moins 3 fois par semaine dans les médias voit sa notoriété augmenter de 40 % en 6 mois.",
   source: "Reputation Institute", url: "https://www.definitions-marketing.com/definition/e-reputation/",
   icon: "brain" },
 { theme: "neutral", num: "Voix", text: "La voix d'un athlète en interview compte pour 38 % dans la perception de crédibilité, devant le contenu même du message.",
   source: "Mehrabian Communication Model", url: "https://worldofwork.io/2019/07/mehrabians-7-38-55-communication-model/",
   icon: "brain" },

 /* === CITATIONS ATHLÈTES & AGENTS ======================================= */
 { theme: "sport", quote: true, num: "Michael Jordan",
   text: "« Le talent gagne des matchs. Mais l'esprit d'équipe et l'intelligence gagnent des championnats. Et la marque, elle, gagne des générations. »",
   source: "Michael Jordan · NBA", url: "https://www.britannica.com/biography/Michael-Jordan" },
 { theme: "sport", quote: true, num: "Serena Williams",
   text: "« Je ne suis pas juste une joueuse de tennis. Je suis une femme, une marque, une entrepreneure. Toutes ces facettes se pilotent. »",
   source: "Serena Williams · Vogue", url: "https://www.britannica.com/biography/Serena-Williams" },
 { theme: "sport", num: "Zion", text: "Zion Williamson signe avec Jordan Brand à 19 ans pour environ 75 M$. Les marques misent désormais sur les jeunes avant même leur premier match pro.",
   source: "Jordan Brand", url: "https://www.nba.com/player/1629627/zion-williamson", icon: "sponsor" },
 { theme: "sport", num: "IMG", text: "L'académie IMG en Floride forme les jeunes talents au sport ET au média dès 14 ans. Interviews simulées, réseaux encadrés, image travaillée en classe.",
   source: "IMG Academy", url: "https://www.imgacademy.com/", icon: "comms" },
 { theme: "sport", num: "Clause", text: "Les contrats des jeunes espoirs incluent de plus en plus une clause scolarité : si les notes baissent, les activités marketing sont suspendues. Les familles l'exigent.",
   source: "FIFPRO", url: "https://fifpro.org/en/", icon: "career" },
 { theme: "sport", num: "Mineur", text: "Un contrat signé par un mineur sans cadre légal adapté peut être annulé. La gestion d'un jeune talent commence par la protection juridique de sa famille.",
   source: "Cour de cassation", url: "https://www.service-public.fr/particuliers/vosdroits/F1344", icon: "image" },
 { theme: "sport", quote: true, num: "Kylian Mbappé",
   text: "« Je veux garder le contrôle sur mon image, mes droits, ma trajectoire. C'est ça, être un vrai athlète du XXIe siècle. »",
   source: "Kylian Mbappé · L'Équipe", url: "https://www.britannica.com/biography/Kylian-Mbappe" },
 { theme: "sport", quote: true, num: "LeBron James",
   text: "« Un athlète moderne, ce n'est plus juste un joueur. C'est un créateur, un producteur, un investisseur, et un défenseur d'idées. »",
   source: "LeBron James · The Shop", url: "https://www.britannica.com/biography/LeBron-James" },
 { theme: "sport", quote: true, num: "Mark McCormack",
   text: "« On ne vend pas un athlète, on construit une plateforme dont il est le cœur. Le reste est une question de temps et de rigueur. »",
   source: "Mark McCormack · fondateur IMG", url: "https://www.img.com/" },
 { theme: "sport", quote: true, num: "Roger Federer",
   text: "« Ma carrière sur le court, c'est 20 ans. Ma carrière avec mon nom, elle durera bien plus longtemps. Il faut la préparer très tôt. »",
   source: "Roger Federer · GQ", url: "https://www.britannica.com/biography/Roger-Federer" },
 { theme: "sport", quote: true, num: "David Beckham",
   text: "« Une marque personnelle, ça se construit chaque matin. Pas juste les jours de match, pas juste devant les caméras. »",
   source: "David Beckham · Vanity Fair", url: "https://www.britannica.com/biography/David-Beckham" },
 { theme: "sport", quote: true, num: "Naomi Osaka",
   text: "« J'ai compris tôt qu'accepter chaque interview, chaque contrat, chaque sollicitation, c'était perdre le contrôle de ma propre histoire. »",
   source: "Naomi Osaka · Netflix", url: "https://www.britannica.com/biography/Naomi-Osaka" },
 { theme: "sport", quote: true, num: "Tony Estanguet",
   text: "« La reconversion ne se prépare pas à 32 ans. Elle se prépare à 22, quand on écrit encore son palmarès. »",
   source: "Tony Estanguet · Le Figaro", url: "https://olympics.com/fr/athletes/tony-estanguet" },
 { theme: "sport", quote: true, num: "Rafael Nadal",
   text: "« Le tennis m'a appris à contrôler ce qui dépend de moi. C'est exactement ce qu'on doit faire avec son image et sa carrière. »",
   source: "Rafael Nadal · The New York Times", url: "https://www.britannica.com/biography/Rafael-Nadal" },
];

/* Icônes minimalistes (style footer services) par catégorie */
const FACT_ICONS = {
 career:  { bg: "#7747ff", ink: "#ffffff", svg: '<path d="M4 20L14 6l4 6 4-8"/>' },
 image:   { bg: "#050505", ink: "#ffffff", svg: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"/>' },
 comms:   { bg: "#b8a4f0", ink: "#1a1033", svg: '<path d="M3 11l18-7-7 18-2.5-7.5L3 11z"/>' },
 sponsor: { bg: "#f3d35e", ink: "#2a1402", svg: '<path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5L12 2z"/>' },
 reconv:  { bg: "#b7d2bf", ink: "#14241a", svg: '<path d="M3 12a9 9 0 1 1 3 6.7"/><path d="M3 22v-5h5"/>' },
 brain:   { bg: "#e3e3e3", ink: "#1a1410", svg: '<path d="M9 4a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4M15 4a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4"/><path d="M9 12h6"/>' },
 quote:   { bg: "#f4efe6", ink: "#1a1410", svg: '<path d="M6 15a4 4 0 0 1 4-4V7a8 8 0 0 0-8 8v2h4v-2zM16 15a4 4 0 0 1 4-4V7a8 8 0 0 0-8 8v2h4v-2z" fill="currentColor" stroke="none"/>' },
};

/* Facts dédiés aux jeunes talents, affichés sur la page Team Espoirs */
const YOUTH_FACTS = [
 { theme: "sport", num: "17 ans", text: "Neymar signe son premier contrat professionnel avec Santos et dispute son premier match pro à 17 ans, déjà entouré d'une équipe qui gère son image.",
   source: "Santos FC", url: "https://www.britannica.com/biography/Neymar", icon: "career" },
 { theme: "sport", num: "18 ans", text: "Teddy Riner devient le plus jeune champion du monde de judo de l'histoire en 2007, à 18 ans. La précocité existe aussi sur les tatamis.",
   source: "Fédération Internationale de Judo", url: "https://olympics.com/fr/athletes/teddy-riner", icon: "career" },
 { theme: "sport", num: "19 ans", text: "Kylian Mbappé est champion du monde à 19 ans. Sa famille avait structuré la gestion de son image dès ses années en centre de formation.",
   source: "FIFA", url: "https://www.britannica.com/biography/Kylian-Mbappe", icon: "image" },
 { theme: "sport", num: "13 ans", text: "Lionel Messi rejoint La Masia à 13 ans. Son premier engagement avec le Barça est signé sur une serviette en papier, une anecdote devenue légende.",
   source: "FC Barcelone", url: "https://www.britannica.com/biography/Lionel-Messi", icon: "career" },
 { theme: "sport", num: "15 ans", text: "Coco Gauff bat Venus Williams à Wimbledon à 15 ans. Ses parents et son équipe avaient préparé sa communication avant même son premier grand tournoi.",
   source: "WTA", url: "https://www.wtatennis.com/players/328560/cori-gauff", icon: "comms" },
 { theme: "sport", num: "16 ans", text: "Lamine Yamal devient titulaire au FC Barcelone à 16 ans. Son entourage limite volontairement ses prises de parole pour protéger sa progression.",
   source: "FC Barcelone", url: "https://www.britannica.com/biography/Lionel-Messi", icon: "image" },
 { theme: "sport", num: "18 ans", text: "LeBron James signe avec Nike à 18 ans, avant son premier match NBA. Un contrat préparé pendant toute sa dernière année de lycée.",
   source: "Nike", url: "https://www.britannica.com/biography/LeBron-James", icon: "sponsor" },
 { theme: "sport", num: "19 ans", text: "Rafael Nadal remporte Roland-Garros à 19 ans, dès sa première participation. Son oncle Toni verrouillait déjà son cadre de travail et son entourage.",
   source: "Roland-Garros", url: "https://www.britannica.com/biography/Rafael-Nadal", icon: "career" },
 { theme: "sport", num: "14 ans", text: "Coco Gauff signe son premier équipementier à 14 ans. Un contrat pensé pour accompagner sa croissance, pas pour l'exploiter.",
   source: "New Balance", url: "https://www.wtatennis.com/players/328560/cori-gauff", icon: "sponsor" },
 { theme: "sport", num: "16 ans", text: "Simone Biles devient championne du monde à 16 ans. Sa famille refusera longtemps les sollicitations pour préserver son équilibre scolaire.",
   source: "World Gymnastics", url: "https://www.britannica.com/biography/Simone-Biles", icon: "image" },
 { theme: "neutral", num: "14 ans", text: "Freddy Adu, star annoncée signée par un grand équipementier à 14 ans, n'a jamais confirmé. Un rappel : trop d'exposition trop tôt peut briser un talent.",
   source: "The Guardian", url: "https://www.britannica.com/biography/Freddy-Adu", icon: "brain" },
 { theme: "sport", num: "21 ans", text: "Les frères et sœurs Abe, Hifumi et Uta, dominent le judo mondial avant 21 ans. Le Japon structure l'accompagnement de ses espoirs dès le collège.",
   source: "All Japan Judo Federation", url: "https://olympics.com/fr/athletes/hifumi-abe", icon: "career" },
 { theme: "neutral", num: "70 %", text: "des jeunes talents identifiés à 15 ans ne deviennent jamais professionnels. Ce n'est pas le talent qui manque, c'est l'encadrement.",
   source: "FIFPRO", url: "https://fifpro.org/en/", icon: "brain" },
 { theme: "sport", num: "École", text: "Les académies qui imposent la poursuite des études produisent des carrières plus longues et des reconversions plus réussies. Le sport et l'école avancent ensemble.",
   source: "INSEP", url: "https://www.imgacademy.com/", icon: "reconv" },
 { theme: "sport", num: "1er post", text: "La première publication virale d'un jeune athlète définit souvent son image pour des années. Mieux vaut y avoir réfléchi avant de la poster.",
   source: "Reputation Institute", url: "https://www.definitions-marketing.com/definition/e-reputation/", icon: "comms" },
 { theme: "sport", num: "Zion", text: "Zion Williamson signe avec Jordan Brand à 19 ans pour environ 75 M$. Les marques misent désormais sur les jeunes avant même leur premier match pro.",
   source: "Jordan Brand", url: "https://www.nba.com/player/1629627/zion-williamson", icon: "sponsor" },
 { theme: "sport", num: "IMG", text: "L'académie IMG en Floride forme les jeunes talents au sport ET au média dès 14 ans. Interviews simulées, réseaux encadrés, image travaillée en classe.",
   source: "IMG Academy", url: "https://www.imgacademy.com/", icon: "comms" },
 { theme: "sport", num: "Clause", text: "Les contrats des jeunes espoirs incluent de plus en plus une clause scolarité : si les notes baissent, les activités marketing sont suspendues. Les familles l'exigent.",
   source: "FIFPRO", url: "https://fifpro.org/en/", icon: "career" },
 { theme: "sport", num: "Mineur", text: "Un contrat signé par un mineur sans cadre légal adapté peut être annulé. La gestion d'un jeune talent commence par la protection juridique de sa famille.",
   source: "Cour de cassation", url: "https://www.service-public.fr/particuliers/vosdroits/F1344", icon: "image" },
 { theme: "sport", quote: true, num: "Kylian Mbappé",
   text: "« On m'a appris très jeune que tout ce que je faisais en dehors du terrain comptait autant que ce que je faisais dessus. »",
   source: "Kylian Mbappé · L'Équipe", url: "https://www.britannica.com/biography/Kylian-Mbappe" },
 { theme: "sport", quote: true, num: "Teddy Riner",
   text: "« À 18 ans, on ne pense qu'à gagner. C'est l'entourage qui pense au reste. Et heureusement. »",
   source: "Teddy Riner · Judo", url: "https://olympics.com/fr/athletes/teddy-riner" },
 { theme: "sport", quote: true, num: "Coco Gauff",
   text: "« Mes parents ont toujours dit non à ma place. Aujourd'hui je comprends que chaque non m'a protégée. »",
   source: "Coco Gauff · WTA", url: "https://www.wtatennis.com/players/328560/cori-gauff" },
];

function initLiveFacts() {
 const FACTS = /team-espoirs|athletes/.test(location.pathname) ? YOUTH_FACTS : LIVE_FACTS;
 let idx = Math.floor(Math.random() * FACTS.length);
 let dismissed = false;
 let card = null;

 function buildCard() {
 card = document.createElement('div');
 card.className = 'live-fact theme-neutral';
 card.innerHTML = `
 <div class="live-fact-head">
 <div class="lf-dots">
 <button class="lf-dot lf-dot-close" aria-label="Fermer" title="Fermer"></button>
 <button class="lf-dot lf-dot-mini" aria-label="Réduire" title="Réduire"></button>
 </div>
 <span class="live-fact-label">Duqque Insights</span>
 <span class="live-fact-id">#<span class="live-fact-num">001</span></span>
 </div>
 <div class="live-fact-body">
 <div class="lf-nav">
 <button class="lf-prev" aria-label="Carte précédente" title="Précédente"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12L6 8l4-4"/></svg></button>
 <button class="lf-next" aria-label="Carte suivante" title="Suivante"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4"/></svg></button>
 </div>
 <div class="live-fact-stream"></div>
 </div>
 <a class="live-fact-foot" href="#" target="_blank" rel="noopener" title="Lire la source">
 <span class="live-fact-source">Source</span>
 <span class="live-fact-plus">Lire</span>
 </a>
 `;
 document.body.appendChild(card);

 requestAnimationFrame(() => card.classList.add('show'));

 card.querySelector('.lf-dot-close').addEventListener('click', () => {
 dismissed = true;
 card.classList.remove('show');
 setTimeout(() => { if (card) { card.remove(); card = null; } }, 600);
 });

 card.querySelector('.lf-dot-mini').addEventListener('click', () => {
 card.classList.toggle('mini');
 });

 card.querySelector('.lf-prev').addEventListener('click', () => {
 idx = (idx - 2 + FACTS.length) % FACTS.length;
 pushFact();
 start();
 });
 card.querySelector('.lf-next').addEventListener('click', () => {
 pushFact();
 start();
 });

 return card;
 }

 function now() {
 const d = new Date();
 return `[${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}]`;
 }

 function pushFact() {
 if (dismissed) return;
 if (!card) buildCard();
 const fact = FACTS[idx];
 const stream = card.querySelector('.live-fact-stream');
 const numEl = card.querySelector('.live-fact-num');
 const srcEl = card.querySelector('.live-fact-source');
 const footEl = card.querySelector('.live-fact-foot');

 numEl.textContent = String(idx + 1).padStart(3, '0');
 srcEl.textContent = fact.source;
 footEl.href = fact.url;

 card.classList.remove('theme-sport', 'theme-business', 'theme-neutral');
 card.classList.add(`theme-${fact.theme || 'neutral'}`);

 const previous = stream.querySelector('.live-fact-stream-item.in');
 if (previous) { previous.classList.remove('in'); previous.classList.add('out'); }

 const ic = FACT_ICONS[fact.icon] || (fact.quote ? FACT_ICONS.quote : FACT_ICONS.career);
 const icoHTML = `<span class="lf-ico" style="background:${ic.bg}; color:${ic.ink};"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic.svg}</svg></span>`;

 const next = document.createElement('div');
 next.className = 'live-fact-stream-item';
 next.innerHTML = `
 <div class="lf-top">${icoHTML}<span class="live-fact-time">${now()}</span></div>
 <div class="lf-num">${fact.num}</div>
 <div class="live-fact-text${fact.quote ? ' lf-quote' : ''}">${fact.text}</div>
 `;
 stream.appendChild(next);
 requestAnimationFrame(() => next.classList.add('in'));

 const keep = new Set([next, previous].filter(Boolean));
 stream.querySelectorAll('.live-fact-stream-item').forEach(el => {
 if (!keep.has(el)) el.remove();
 });
 if (previous) {
 setTimeout(() => { if (previous && previous.parentNode) previous.remove(); }, 700);
 }

 idx = (idx + 1) % FACTS.length;
 }

 let timer = null;
 function start() {
 if (timer) clearInterval(timer);
 timer = setInterval(pushFact, 20000);
 }
 function stop() { if (timer) { clearInterval(timer); timer = null; } }

 document.addEventListener('visibilitychange', () => {
 if (document.hidden) {
 stop();
 } else {
 if (card) {
 const stream = card.querySelector('.live-fact-stream');
 const items = stream.querySelectorAll('.live-fact-stream-item');
 items.forEach((el, i) => { if (i < items.length - 1) el.remove(); });
 const last = stream.querySelector('.live-fact-stream-item');
 if (last) { last.classList.remove('out'); last.classList.add('in'); }
 }
 start();
 }
 });

 setTimeout(pushFact, 3500);
 start();
}

/* --- Menu (modale flottante brutaliste premium) --- */
const MENU_LINKS = [
 { href: 'sport.html', label: 'Nos services', halo: 'sport', dots: true },
 { href: 'athletes.html', label: 'Athlètes & Team', halo: 'sport', dots: false },
 { href: 'team-espoirs.html', label: '<span class="notranslate">Programme Espoirs</span>', halo: 'sport', dots: false },
 { href: 'about.html', label: 'À propos', halo: 'sport', dots: false },
 { href: 'actualites.html', label: 'Blog', halo: 'sport', dots: false },
 { href: 'cotisations.html', label: 'Cotisations', halo: 'sport', dots: false },
 { href: 'contact.html', label: 'Contact', halo: 'sport', dots: false },
];

function buildMenu() {
 const menu = document.querySelector('.menu');
 if (!menu) return null;
 menu.innerHTML = `
 <div class="menu-backdrop"></div>
 <div class="menu-halo"></div>

 <aside class="menu-dock">
 <a href="contact.html" class="dock-card contact">
 <div class="dc-avatar"></div>
 <div class="dc-label">Contact</div>
 <div class="dc-title">Prendre rendez-vous</div>
 <div class="dc-cta"><span>Réserver</span><span>→</span></div>
 </a>
 <a href="athletes.html" class="dock-card dark"><span>Nos athlètes</span><span class="dc-plus">+</span></a>
 <a href="sport.html" class="dock-card dark"><span>Nos services</span><span class="dc-plus">+</span></a>
 <a href="team-espoirs.html" class="dock-card dark"><span class="notranslate">Programme Espoirs</span><span class="dc-plus">+</span></a>
 </aside>

 <div class="menu-modal">
 <ul class="menu-list">
 ${MENU_LINKS.map(l => `
 <li data-halo="${l.halo}">
 <a href="${l.href}">
 <span>${l.label}</span>
 ${l.dots ? '' : '<span class="ml-arrow">→</span>'}
 </a>
 ${l.href === 'sport.html' ? `
 <div class="ml-services">
 <a href="service-carriere.html" class="mls-card">
 <span class="mls-ico" style="background: var(--accent);color:#fff;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L14 6l4 6 4-8"/></svg></span>
 <span class="mls-body"><strong>Gestion de carrière</strong><small>Contrats, trajectoire, reconversion</small></span>
 <span class="mls-arr">↗</span>
 </a>
 <a href="service-image.html" class="mls-card">
 <span class="mls-ico" style="background:#f5f3ef;color:#050505;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></svg></span>
 <span class="mls-body"><strong>Gestion d'image</strong><small>Marque personnelle, droit à l'image</small></span>
 <span class="mls-arr">↗</span>
 </a>
 <a href="service-communication.html" class="mls-card">
 <span class="mls-ico" style="background:#b8a4f0;color:#1a1033;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-7-7 18-2.5-7.5L3 11z"/></svg></span>
 <span class="mls-body"><strong>Communication</strong><small>Réseaux, presse, media training</small></span>
 <span class="mls-arr">↗</span>
 </a>
 <a href="service-sponsoring.html" class="mls-card">
 <span class="mls-ico" style="background:#d9ff3d;color:#101400;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5L12 2z"/></svg></span>
 <span class="mls-body"><strong>Sponsoring</strong><small>Partenariats négociés et suivis</small></span>
 <span class="mls-arr">↗</span>
 </a>
 </div>` : ''}
  </li>
 `).join('')}
 </ul>

 <a href="team-espoirs.html" class="menu-espoirs">
 <span class="me-title">Jeune judoka en France ou au Portugal ? <em>Découvre le <span class="notranslate">Programme Espoirs</span>.</em></span>
 <span class="me-btn">Découvrir le programme <span class="me-arr">→</span></span>
 </a>

 </div>
 `;
 return menu;
}

/* Les derniers articles parus, du plus recent au plus ancien. ARTICLES est tenu par
   ordre chronologique, le dernier entre est donc le plus recent. Le pied de page
   affichait jusqu'ici les rubriques, qui pointaient toutes vers la meme page. */
function derniersArticles(n) {
 return [...ARTICLES].reverse().slice(0, n).map(a => `
 <li><a href="${a.url}" class="f2-art">
  <span class="f2-art-axe">${a.axe}</span>
  <span class="f2-art-titre">${a.titre}</span>
 </a></li>`).join('');
}

function buildFooter() {
 const footer = document.querySelector('.footer');
 if (!footer) return;
 footer.innerHTML = `
 <div class="f2">
 <div class="f2-cols">
 <div class="f2-col">
 <h5>Athlètes</h5>
 <ul>
 <li><a href="athletes.html">Le roster</a></li>
 <li><a href="athletes.html">Équipes & structures</a></li>
 <li><a href="team-espoirs.html"><span class="notranslate">Programme Espoirs</span></a></li>
 </ul>
 </div>
 <div class="f2-col">
 <h5>Services</h5>
 <ul>
 <li><a href="service-carriere.html"><span class="f2-ico" style="background: var(--accent);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M4 20L14 6l4 6 4-8"/></svg></span>Gestion de carrière</a></li>
 <li><a href="service-image.html"><span class="f2-ico" style="background:#f5f3ef;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#050505" stroke-width="2.4"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"/></svg></span>Gestion d'image</a></li>
 <li><a href="service-communication.html"><span class="f2-ico" style="background:#b8a4f0;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1033" stroke-width="2.4"><path d="M3 11l18-7-7 18-2.5-7.5L3 11z"/></svg></span>Communication</a></li>
 <li><a href="service-sponsoring.html"><span class="f2-ico" style="background:#d9ff3d;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#101400" stroke-width="2.4"><path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5L12 2z"/></svg></span>Sponsoring</a></li>
 <li><a href="methode.html" class="f2-more">Notre approche →</a></li>
 </ul>
 </div>
 <div class="f2-col">
 <h5>L'association</h5>
 <ul>
 <li><a href="about.html">À propos</a></li>
 <li><a href="cotisations.html">Cotisations</a></li>
 <li><a href="actualites.html">Blog</a></li>
 <li><a href="contact.html">Contact</a></li>
 <li><a href="https://www.instagram.com/duqque/" target="_blank" rel="noopener">Instagram</a></li>
 <li><a href="https://www.linkedin.com/company/duqque/" target="_blank" rel="noopener">LinkedIn</a></li>
 <li><a href="https://www.facebook.com/duqque" target="_blank" rel="noopener">Facebook</a></li>
 </ul>
 </div>
 <div class="f2-col">
 <h5>Blog</h5>
 <ul>
 ${derniersArticles(4)}
 <li><a href="actualites.html" class="f2-more">Tous les articles →</a></li>
 </ul>
 </div>
 </div>

 <div class="f2-word" aria-hidden="true">
 <div class="f2-word-crop"><span class="f2-word-txt notranslate" translate="no" id="f2WordTxt">duqque</span></div>
 </div>

 <div class="f2-info">
 <div class="f2-info-col">
 <h5>Contact</h5>
 <a href="mailto:contact@duqque.fr">contact@duqque.fr</a>
 <a href="mailto:contact@duqque.pt">contact@duqque.pt</a>
 <a href="tel:+351932011866">+351 932 011 866</a>
 </div>
 <div class="f2-info-col">
 <h5>Bureaux</h5>
 <span>Paris, France</span>
 <span>Lisbonne, Portugal</span>
 <span class="f2-muted">Athlètes représentés dans le monde entier</span>
 </div>
 <div class="f2-info-col">
 <h5>Informations</h5>
 <a href="mentions-legales.html">Mentions légales</a>
 <a href="confidentialite.html">Confidentialité</a>
 <a href="rdv.html">Prendre rendez-vous</a>
 </div>
 <div class="f2-info-col f2-info-cta">
 <h5>Parlons de votre carrière</h5>
 <span class="f2-muted">30 minutes en visio, sans engagement.</span>
 <a href="rdv.html" class="f2-book">Prendre RDV <span aria-hidden="true">→</span></a>
 </div>
 </div>

 <div class="f2-bottom">
 <span>© ${new Date().getFullYear()} Duqque Sports. Tous droits réservés.</span>
 <div class="links">
 <a href="mentions-legales.html">Mentions légales</a>
 <a href="confidentialite.html">Confidentialité</a>
 </div>
 <a href="https://rokudan.fr" target="_blank" rel="noopener" class="f2-credit" aria-label="Site web designé par Rokudan">
 <span>Designé par</span>
 <img src="assets/rokudan-logo.svg" alt="Rokudan" style="filter: invert(1);" />
 </a>
 </div>
 </div>
 `;
}

/* --- Flags SVG (réutilisables) --- */
function flagSvg(code) {
 const flags = {
 fr: `<svg viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="6" height="12" fill="#0055A4"/><rect x="6" width="6" height="12" fill="#fff"/><rect x="12" width="6" height="12" fill="#EF4135"/></svg>`,
 en: `<svg viewBox="0 0 18 12" width="18" height="12" aria-hidden="true">
 <rect width="18" height="12" fill="#012169"/>
 <path d="M0 0 L18 12 M18 0 L0 12" stroke="#fff" stroke-width="2.4"/>
 <path d="M0 0 L18 12 M18 0 L0 12" stroke="#C8102E" stroke-width="1.2"/>
 <path d="M9 0 V12 M0 6 H18" stroke="#fff" stroke-width="3.6"/>
 <path d="M9 0 V12 M0 6 H18" stroke="#C8102E" stroke-width="2"/>
 </svg>`,
 pt: `<svg viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="12" fill="#FF0000"/><rect width="7" height="12" fill="#006600"/><circle cx="7" cy="6" r="2.4" fill="#FFCC00"/></svg>`
 };
 return flags[code] || flags.fr;
}

// Position basse de la barre, publiee en variable CSS : le fil d'Ariane et les sections
// epinglees s'y accrochent, au lieu d'une valeur en dur qui se decale des que la barre change.
function publieHauteurNav() {
 const pill = document.querySelector('.nav-pill');
 if (!pill) return;
 document.documentElement.style.setProperty('--nav-bas', Math.round(pill.getBoundingClientRect().bottom) + 'px');
}

function buildNav() {
 const nav = document.querySelector('.nav');
 if (!nav) return;
 const file = (location.pathname.split('/').pop() || 'home.html').toLowerCase();
 const on = (f) => (file === f ? ' active' : '');
 nav.innerHTML = `
 <div class="nav-pill">
 <div class="nav-brand">
 <a href="index.html" class="nav-logo" aria-label="Duqque Accueil">
 <span class="nav-logo-txt notranslate" translate="no" id="navLogoTxt">duqque</span>
 </a>
 </div>
  <div class="nav-actions">
 <div class="lang-switch" data-lang-switch>
 <button class="lang-current" type="button" aria-label="Changer de langue" aria-expanded="false">
 <span class="lang-flag" data-lang-flag></span>
 <span class="lang-caret" aria-hidden="true">▾</span>
 </button>
 <ul class="lang-menu" role="menu">
 <li><button type="button" data-lang="fr">${flagSvg('fr')}<span class="notranslate" translate="no">Français</span></button></li>
 <li><button type="button" data-lang="en">${flagSvg('en')}<span class="notranslate" translate="no">English</span></button></li>
 <li><button type="button" data-lang="pt">${flagSvg('pt')}<span class="notranslate" translate="no">Português</span></button></li>
 </ul>
 </div>
 <button class="nav-toggle" aria-label="Ouvrir le menu">
 <span class="nav-toggle-bars"><span></span><span></span><span></span></span>
 <span class="label">Menu</span>
 </button>
 </div>
 </div>
 `;
 if (!document.querySelector('.nav-breadcrumb')) {
 const PAGE_TITLES = {
 'index.html': 'Accueil', 'home.html': 'Accueil',
 'sport.html': 'Nos services',
 'service-carriere.html': 'Gestion de carrière',
 'service-image.html': "Gestion d'image",
 'service-communication.html': 'Communication',
 'service-sponsoring.html': 'Sponsoring',
 'methode.html': 'Notre approche', 'team-espoirs.html': 'Programme Espoirs',
 'success-stories.html': 'Résultats', 'media.html': 'Blog',
 'actualites.html': 'Blog', 'cotisations.html': 'Cotisations',
 'art-carriere-14-15-16-ans.html': 'Gestion de carrière',
 'art-reseaux-sociaux-jeune-athlete.html': 'Communication',
 'art-changer-de-club.html': 'Gestion de carrière',
 'art-droit-a-l-image-athlete.html': 'Image de marque',
 'art-dossier-de-partenariat.html': 'Sponsoring',
 'art-premiere-interview.html': 'Communication',
 'art-blessure-longue-carriere.html': 'Gestion de carrière',
 'art-propriete-intellectuelle-sport.html': 'Image de marque',
 'art-sponsor-a-15-ans.html': 'Sponsoring', 'about.html': 'À propos',
 'contact.html': 'Contact', 'rdv.html': 'Prendre RDV', 'athletes.html': 'Athlètes & Team',
 'mentions-legales.html': 'Mentions légales',
 'confidentialite.html': 'Confidentialité',
 };
 const bfile = (location.pathname.split('/').pop() || 'home.html').toLowerCase();
 const bcur = PAGE_TITLES[bfile];
 if (bcur) {
 const crumb = document.createElement('nav');
 crumb.className = 'nav-breadcrumb';
 crumb.setAttribute('aria-label', "Fil d'Ariane");
 const isHome = bfile === 'index.html' || bfile === 'home.html';
 const isService = /^service-/.test(bfile);
 crumb.innerHTML = isHome
 ? `<span class="crumb-current">${bcur}</span>`
 : (isService
 ? `<a href="home.html" class="crumb-link">Accueil</a><span class="crumb-sep">›</span><a href="sport.html" class="crumb-link">Nos services</a><span class="crumb-sep">›</span><span class="crumb-current">${bcur}</span>`
 : `<a href="home.html" class="crumb-link">Accueil</a><span class="crumb-sep">›</span><span class="crumb-current">${bcur}</span>`);
 document.body.appendChild(crumb);
 }
 }
 if (!document.querySelector('.mobile-top-logo')) {
 const topLogo = document.createElement('a');
 topLogo.href = 'index.html';
 topLogo.className = 'mobile-top-logo';
 topLogo.setAttribute('aria-label', "Duqque Accueil");
 topLogo.translate = false;
 topLogo.setAttribute('translate', 'no');
 topLogo.classList.add('notranslate');
 topLogo.innerHTML = `<img src="assets/duqque-logo-white.svg" alt="Duqque Sports" class="notranslate" translate="no" />`;
 document.body.appendChild(topLogo);
 }
 if (!document.querySelector('.mobile-call')) {
 const callBtn = document.createElement('a');
 callBtn.href = 'tel:+351932011866';
 callBtn.className = 'mobile-call';
 callBtn.setAttribute('aria-label', "Appeler Duqque");
 callBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
 document.body.appendChild(callBtn);
 }
 if (!document.querySelector('.nav-cta')) {
 // WhatsApp et Prendre RDV dans un meme conteneur : la pastille WhatsApp prend
 // automatiquement la hauteur du bouton grace a align-items: stretch, quelle que soit
 // la longueur du libelle une fois traduit.
 const cta = document.createElement('div');
 cta.className = 'nav-cta';

 const wa = document.createElement('a');
 wa.href = 'https://wa.me/351932011866';
 wa.className = 'nav-wa';
 wa.target = '_blank';
 wa.rel = 'noopener';
 wa.setAttribute('aria-label', 'Nous écrire sur WhatsApp');
 wa.innerHTML = '<svg viewBox="0 0 360 362" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M307.546 52.5655C273.709 18.685 228.706 0.0171895 180.756 0C81.951 0 1.53846 80.404 1.50408 179.235C1.48689 210.829 9.74646 241.667 25.4319 268.844L0 361.736L95.0236 336.811C121.203 351.096 150.683 358.616 180.679 358.625H180.756C279.544 358.625 359.966 278.212 360 179.381C360.017 131.483 341.392 86.4547 307.546 52.5741V52.5655ZM180.756 328.354H180.696C153.966 328.346 127.744 321.16 104.865 307.589L99.4242 304.358L43.034 319.149L58.0834 264.168L54.5423 258.53C39.6304 234.809 31.749 207.391 31.7662 179.244C31.8006 97.1036 98.6334 30.2707 180.817 30.2707C220.61 30.2879 258.015 45.8015 286.145 73.9665C314.276 102.123 329.755 139.562 329.738 179.364C329.703 261.513 262.871 328.346 180.756 328.346V328.354ZM262.475 216.777C257.997 214.534 235.978 203.704 231.869 202.209C227.761 200.713 224.779 199.966 221.796 204.452C218.814 208.939 210.228 219.029 207.615 222.011C205.002 225.002 202.389 225.372 197.911 223.128C193.434 220.885 179.003 216.158 161.891 200.902C148.578 189.024 139.587 174.362 136.975 169.875C134.362 165.389 136.7 162.965 138.934 160.739C140.945 158.728 143.412 155.505 145.655 152.892C147.899 150.279 148.638 148.406 150.133 145.423C151.629 142.432 150.881 139.82 149.764 137.576C148.646 135.333 139.691 113.287 135.952 104.323C132.316 95.5909 128.621 96.777 125.879 96.6309C123.266 96.5019 120.284 96.4762 117.293 96.4762C114.302 96.4762 109.454 97.5935 105.346 102.08C101.238 106.566 89.6691 117.404 89.6691 139.441C89.6691 161.478 105.716 182.785 107.959 185.776C110.202 188.767 139.544 234.001 184.469 253.408C195.153 258.023 203.498 260.782 210.004 262.845C220.731 266.257 230.494 265.776 238.212 264.624C246.816 263.335 264.71 253.786 268.44 243.326C272.17 232.866 272.17 223.893 271.053 222.028C269.936 220.163 266.945 219.037 262.467 216.794L262.475 216.777Z"/></svg>';

 const contact = document.createElement('a');
 contact.href = 'rdv.html';
 contact.className = 'nav-contact';
 contact.innerHTML = `
 <span class="nav-contact-label">Prendre RDV</span>
 <span class="nav-contact-arrow"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.6"/></svg></span>
 `;

 cta.appendChild(wa);
 cta.appendChild(contact);
 document.body.appendChild(cta);
 }
}

function initMenu() {
 buildNav();
 const toggle = document.querySelector('.nav-toggle');
 const menu = buildMenu();
 if (!toggle || !menu) return;

 const syncModalToPill = () => {
 const pill = document.querySelector('.nav-pill');
 const modal = menu.querySelector('.menu-modal');
 if (!pill || !modal) return;
 const r = pill.getBoundingClientRect();
 if (r.width >= 360) {
 // La modale prend exactement la largeur de la barre de menu
 modal.style.width = Math.round(r.width) + 'px';
 modal.style.maxWidth = 'none';
 modal.style.left = Math.round(r.left) + 'px';
 modal.style.transform = 'none';
 } else {
 // Pill mobile compacte : pleine largeur moins marges égales (CSS)
 modal.style.width = '';
 modal.style.maxWidth = '';
 modal.style.left = '';
 modal.style.transform = '';
 }
 // Si la pill est dans la moitié basse de l'écran (mobile bottom-bar),
 // le menu s'ouvre vers le haut ; sinon il descend.
 const openUpward = r.top > window.innerHeight / 2;
 const GAP = 10, EDGE = 16;
 if (openUpward) {
 modal.classList.add('opens-up');
 modal.style.top = 'auto';
 modal.style.bottom = (window.innerHeight - r.top + GAP) + 'px';
 // Jamais au-dessus du bord haut de l'écran
 modal.style.maxHeight = Math.max(240, r.top - GAP - EDGE) + 'px';
 } else {
 modal.classList.remove('opens-up');
 modal.style.bottom = 'auto';
 modal.style.top = (r.bottom + GAP) + 'px';
 // Jamais en dessous du bord bas de l'écran
 modal.style.maxHeight = Math.max(240, window.innerHeight - r.bottom - GAP - EDGE) + 'px';
 }
 // Mode compact si la hauteur disponible est réduite
 modal.classList.toggle('compact', parseFloat(modal.style.maxHeight) < 720);
 fitModal();
 };
 // Escalade en deux temps selon la hauteur reellement disponible sur l'appareil :
 // 1) compact, 2) si ca deborde encore, on retire le CTA Espoirs plutot que de le tronquer.
 //
 // La decision est prise en UNE passe synchrone. Avant, elle etait etalee sur un
 // requestAnimationFrame puis un setTimeout de 520 ms : le panneau s'ouvrait complet, puis
 // une demi-seconde plus tard les liens retrecissaient et le bloc Espoirs disparaissait.
 // Le menu sautait donc sous les doigts, pile entre Contact et le CTA. Lire scrollHeight
 // apres chaque ajout de classe force le recalcul immediat : les trois etats s'enchainent
 // dans la meme tache, le navigateur ne peint que le dernier.
 function fitModal() {
 // `modal` est local a syncModalToPill : on le resout ici aussi.
 const modal = menu.querySelector('.menu-modal');
 if (!modal) return;
 modal.classList.remove('no-espoirs');
 // On compare a la hauteur disponible calculee juste avant, et non a clientHeight :
 // pendant l'animation d'ouverture la boite n'a pas encore sa taille finale.
 const avail = parseFloat(modal.style.maxHeight) || modal.clientHeight;
 if (modal.scrollHeight > avail + 4) modal.classList.add('compact');
 if (modal.scrollHeight > avail + 4) modal.classList.add('no-espoirs');
 }
 window.addEventListener('resize', () => { if (menu.classList.contains('open')) syncModalToPill(); });
 if (window.ResizeObserver) {
 const pillEl = document.querySelector('.nav-pill');
 if (pillEl) new ResizeObserver(() => { if (menu.classList.contains('open')) syncModalToPill(); }).observe(pillEl);
 }

 const open = () => {
 // L'etat ouvert est pose d'abord pour que la mesure porte sur la geometrie finale
 // (.menu.open change la taille des liens), puis syncModalToPill ajuste dans la meme
 // tache synchrone : aucun repaint intermediaire, donc aucun saut visible.
 menu.classList.add('open');
 document.body.classList.add('menu-open');
 document.body.style.overflow = 'hidden';
 syncModalToPill();
 toggle.querySelector('.label').textContent = 'Fermer';
 };
 const close = () => {
 menu.classList.remove('open');
 toggle.querySelector('.label').textContent = 'Menu';
 document.body.classList.remove('menu-open');
 document.body.style.overflow = '';
 };
 toggle.addEventListener('click', () => menu.classList.contains('open') ? close() : open());
 const closeBtn = menu.querySelector('.menu-close');
 if (closeBtn) closeBtn.addEventListener('click', close);
 menu.querySelector('.menu-backdrop').addEventListener('click', close);
 document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

 /* Halo dynamique au survol des items */
 menu.querySelectorAll('.menu-list li').forEach(li => {
 li.addEventListener('mouseenter', () => {
 menu.setAttribute('data-halo', li.dataset.halo);
 });
 });
 menu.addEventListener('mouseleave', () => menu.removeAttribute('data-halo'));
}

/* --- Nav scroll style --- */
function initNavScroll() {
 const nav = document.querySelector('.nav');
 if (!nav) return;
 const update = () => nav.classList.toggle('scrolled', window.scrollY > 60);
 update();
 window.addEventListener('scroll', update, { passive: true });
}

/* --- Reveal on scroll --- */
function initReveal() {
 const els = document.querySelectorAll('.reveal');
 // threshold: 0 + marge basse au lieu de threshold: 0.15. Le seuil en fraction porte sur la
 // SURFACE de l'element : un bloc plus haut que 6,7 ecrans ne peut jamais atteindre 15 %, il
 // restait donc a opacity: 0 indefiniment. C'est ce qui rendait le texte des articles invisible.
 const io = new IntersectionObserver((entries) => {
 entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
 }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
 els.forEach(el => io.observe(el));
 // Filet de securite : tout element encore masque au bout de 3 s est revele.
 setTimeout(() => els.forEach(el => el.classList.add('in')), 3000);
}

/* --- Contact form profile chips --- */
function initProfileChips() {
 const chips = document.querySelectorAll('.profile-chips button');
 if (!chips.length) return;
 const dynamic = document.querySelector('[data-dynamic-fields]');
 const fieldsByProfile = {
 sportif: ['Discipline', 'Niveau actuel', 'Objectif principal'],
 parent: ['Sport de l\'enfant', 'Âge', 'Objectif visé'],
 club: ['Nom du club', 'Discipline', 'Effectif concerné'],
 entreprise: ['Société', 'Fonction', 'Enjeu identifié'],
 media: ['Média', 'Type de sujet', 'Échéance'],
 };
 chips.forEach(chip => chip.addEventListener('click', () => {
 chips.forEach(c => c.classList.remove('active'));
 chip.classList.add('active');
 const profile = chip.dataset.profile;
 if (!dynamic) return;
 dynamic.innerHTML = fieldsByProfile[profile].map(label => `
 <div class="field">
 <label>${label}</label>
 <input type="text" />
 </div>
 `).join('');
 }));
 chips[0] && chips[0].click();
}

/* --- Year in footer --- */
/* --- Language switcher : cookie googtrans + reload, Google Translate s'occupe du reste --- */
function setGoogtransCookie(code) {
 const value = code && code !== 'fr' ? `/fr/${code}` : '';
 const domains = ['', '.' + location.hostname, location.hostname];
 const expire = value ? 'expires=Fri, 31 Dec 2027 23:59:59 GMT;' : 'expires=Thu, 01 Jan 1970 00:00:00 GMT;';
 domains.forEach(d => {
 document.cookie = `googtrans=${value}; ${expire} path=/; ${d ? 'domain=' + d + ';' : ''}`;
 });
}

function loadGoogleTranslate() {
 if (document.getElementById('google_translate_element')) return;
 const host = document.createElement('div');
 host.id = 'google_translate_element';
 host.setAttribute('aria-hidden', 'true');
 host.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;height:0;';
 document.body.appendChild(host);

 window.googleTranslateElementInit = function () {
 try {
 new window.google.translate.TranslateElement({
 pageLanguage: 'fr',
 includedLanguages: 'fr,en,pt',
 autoDisplay: false
 }, 'google_translate_element');
 } catch (e) { /* silent */ }
 // Fallback : si le cookie googtrans n'a pas déclenché la traduction,
 // on pilote directement le sélecteur du widget.
 const wanted = localStorage.getItem('om_lang') || 'fr';
 if (wanted === 'fr') return;
 let tries = 0;
 const force = () => {
 tries++;
 const combo = document.querySelector('.goog-te-combo');
 const translated = document.documentElement.classList.contains('translated-ltr') || document.documentElement.classList.contains('translated-rtl');
 if (translated) return;
 if (combo && combo.value !== wanted) {
 combo.value = wanted;
 combo.dispatchEvent(new Event('change', { bubbles: true }));
 }
 if (tries < 12) setTimeout(force, 500);
 };
 setTimeout(force, 600);
 };

 const s = document.createElement('script');
 s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
 s.async = true;
 document.head.appendChild(s);
}

function initLangSwitcher() {
 const wraps = document.querySelectorAll('[data-lang-switch]');
 if (!wraps.length) return;
 const KEY = 'om_lang';
 const saved = localStorage.getItem(KEY) || 'fr';

 // 1. S'assure que le cookie googtrans correspond TOUJOURS à la langue mémorisée.
 // Google Translate lit ce cookie au chargement de son script → traduction automatique
 // appliquée immédiatement à toutes les pages, sans intervention manuelle.
 setGoogtransCookie(saved);

 // 2. Charge le widget Google Translate (qui traduit la page selon le cookie).
 if (saved !== 'fr') loadGoogleTranslate();

 wraps.forEach(wrap => {
 const flagSlot = wrap.querySelector('[data-lang-flag]');
 const trigger = wrap.querySelector('.lang-current');
 const menu = wrap.querySelector('.lang-menu');
 if (!flagSlot || !trigger || !menu) return;

 flagSlot.innerHTML = flagSvg(saved);

 trigger.addEventListener('click', (e) => {
 e.stopPropagation();
 const open = wrap.classList.toggle('open');
 trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
 document.body.classList.toggle('lang-open', open);
 });
 document.addEventListener('click', (e) => {
 if (!wrap.contains(e.target)) {
 wrap.classList.remove('open');
 trigger.setAttribute('aria-expanded', 'false');
 document.body.classList.remove('lang-open');
 }
 });

 menu.querySelectorAll('button[data-lang]').forEach(btn => {
 btn.addEventListener('click', () => {
 const code = btn.dataset.lang;
 localStorage.setItem(KEY, code);
 setGoogtransCookie(code);
 location.reload();
 });
 });
 });
}

/* --- Pictogrammes : applique la tuile unifiée et la rotation de 4 couleurs --- */
function initIconTiles() {
 const GROUPS = [
  { sel: '.mental-block .icn, .step-illus > .step-icon, .timeline-bar .tl-icon, .svc-step .sic, .te-ico, .mls-ico, .pi-icon, .at-ico, .ab-ico, .ct-ico', size: '' },
  { sel: '.svc-others .oi, .svc-cell .chk, .f2-ico, .tj-col h4 i, .lf-ico', size: 'ico-sm' },
  { sel: '.mf-ico', size: 'ico-lg' }
 ];
 GROUPS.forEach(g => {
  let i = 0;
  document.querySelectorAll(g.sel).forEach(el => {
   if (!el.querySelector('svg')) return;
   el.classList.add('ico-tile');
   if (g.size) el.classList.add(g.size);
   const hasColor = /background/.test(el.getAttribute('style') || '') || [...el.classList].some(c => /^ico-c[1-4]$/.test(c));
   if (!hasColor) { el.classList.add('ico-c' + ((i % 4) + 1)); i++; }
  });
 });
}


/* --- Polices d'animation : hauteur de lettre identique -------------------------------
   Chaque police a ses propres proportions : a taille egale, la hauteur reelle des lettres
   varie de 60 a 94 % du corps selon la fonte, ce qui faisait sauter le mot verticalement a
   chaque changement. On mesure donc la police au canvas et on lui applique un facteur k qui
   egalise EXACTEMENT sa hauteur de lettre sur celle de la police de reference. Les fontes
   dont la largeur resultante sort de la bande admise sont ecartees, pour que le mot ne
   deborde pas non plus lateralement.                                                    */
function buildMetricPool(fonts, sample, minW, maxW) {
 if (!fonts.length) return { list: [], ref: null };
 const ctx = buildMetricPool._ctx || (buildMetricPool._ctx = document.createElement('canvas').getContext('2d'));
 const mesure = (ft) => {
  ctx.font = ft.s + ' ' + ft.w + ' 100px ' + ft.f;
  const m = ctx.measureText(sample);
  return { a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent, w: m.width };
 };
 const ref = mesure(fonts[0]);
 if (!ref.a || !ref.w) return { list: fonts.map(ft => Object.assign({ k: 1 }, ft)), ref: null };
 const list = [];
 fonts.forEach(ft => {
  const m = mesure(ft);
  if (!m.a || !m.w) return;
  const k = ref.a / m.a;
  const largeurNormalisee = (m.w * k) / ref.w;
  if (largeurNormalisee < minW || largeurNormalisee > maxW) return;
  list.push(Object.assign({ k: k }, ft));
 });
 return { list: list.length > 1 ? list : fonts.map(ft => Object.assign({ k: 1 }, ft)), ref: ref };
}

/* --- Wordmark du footer : rotation ultra rapide d'une vingtaine de polices grasses --- */
function initFooterWordmark() {
 const el = document.getElementById('f2WordTxt');
 if (!el) return;
 const GOOGLE = [
  'Anton', 'Archivo Black', 'Bebas Neue', 'Bowlby One', 'Bungee', 'Black Ops One', 'Lilita One', 'Righteous', 'Russo One', 'Rubik Mono One',
  'Titan One', 'Abril Fatface', 'DM Serif Display', 'Unbounded:wght@900', 'Syne:wght@800', 'Montserrat:wght@900', 'Poppins:wght@900', 'Oswald:wght@700', 'Orbitron:wght@900', 'Playfair Display:wght@900',
  'Alfa Slab One', 'Bangers', 'Changa One', 'Fugaz One', 'Luckiest Guy', 'Passion One', 'Permanent Marker', 'Racing Sans One', 'Sigmar One', 'Ultra',
  'Krona One', 'Monoton', 'Chango', 'Shrikhand', 'Squada One', 'Staatliches', 'Dela Gothic One', 'Climate Crisis', 'Rammetto One', 'Carter One',
  'Concert One', 'Pacifico', 'Lobster', 'Cinzel:wght@900', 'Bodoni Moda:wght@900', 'Big Shoulders Display:wght@900'
 ];
 const link = document.createElement('link');
 link.rel = 'stylesheet';
 // Sous-ensemble : seuls les glyphes d, u, q, e sont téléchargés (quelques Ko par police au lieu de 20 à 100 Ko)
 link.href = 'https://fonts.googleapis.com/css2?' + GOOGLE.map(f => 'family=' + encodeURIComponent(f.split(':')[0]).replace(/%20/g, '+') + (f.includes(':') ? ':' + f.split(':')[1] : '')).join('&') + '&text=duqe&display=swap';
 document.head.appendChild(link);

 const FONTS = [
  { f: '"LT Museum"', w: 900, s: 'normal' },
  { f: '"TT Mussels"', w: 900, s: 'italic' },
  { f: '"TT Mussels"', w: 900, s: 'normal' },
  { f: '"Gilroy"', w: 600, s: 'normal' },
  ...GOOGLE.map(g => ({ f: '"' + g.split(':')[0] + '"', w: g.includes('wght@') ? Number(g.split('wght@')[1]) : 400, s: 'normal' }))
 ];
 const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const crop = el.parentElement;
 let ready = [FONTS[0]];
 let i = 0, timer = null, visible = false;

 // Taille de reference : celle a laquelle la police de reference occupe ~96 % de la largeur.
 // Chaque autre police est ensuite multipliee par son facteur k, donc toutes les fontes de la
 // rotation ont la meme hauteur de lettre — le mot ne monte ni ne descend d'une image a l'autre.
 let refM = null, base = 40, courante = null;
 const fit = () => {
  const vw = document.documentElement.clientWidth || window.innerWidth;
  base = refM && refM.w
   ? Math.min(vw * 0.285, Math.max(40, (vw * 0.96) / (refM.w / 100)))
   : vw * 0.24;
  if (courante) el.style.fontSize = (base * (courante.k || 1)) + 'px';
 };
 const apply = (font) => {
  courante = font;
  el.style.fontFamily = font.f + ', sans-serif';
  el.style.fontWeight = font.w;
  el.style.fontStyle = font.s;
  el.style.fontSize = (base * (font.k || 1)) + 'px';
 };
 const COLORS = ['#5a2fe6', '#050505', '#d9ff3d', '#b8a4f0', '#f5f3ef'];
 const tick = () => {
  i = (i + 1) % ready.length; apply(ready[i]);
  const base = (document.documentElement.clientWidth || window.innerWidth) <= 640 ? '#0b0b0b' : '#fff';
  el.style.color = Math.random() < 1 / 8 ? COLORS.filter(c => c !== base)[Math.floor(Math.random() * 4)] : base;
 };
 const start = () => { if (timer || reduce || ready.length < 2 || !visible) return; timer = setInterval(tick, 260); };
 const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
 window.duqqueWordmark = { stop, start: () => { visible = true; start(); } };

 // Logo de la barre : exactement la meme liste de polices que le wordmark du pied de page.
 // La taille est reajustee a chaque police pour que le mot garde sa largeur : sans cela les
 // polices larges ou hautes etaient rognees par la pastille et la rotation paraissait plus courte.
 const logo = document.getElementById('navLogoTxt');
 if (logo && !reduce) {
  let lt = null, li = 0, lbase = 0;
  // Hauteur de lettre egalisee par k ; la largeur de la boite est figee pendant le survol
  // pour que duqque reste exactement au centre de la barre quelle que soit la police.
  const logoApply = (ft) => {
   logo.style.fontFamily = ft.f + ', sans-serif';
   logo.style.fontWeight = ft.w;
   logo.style.fontStyle = ft.s;
   logo.style.fontSize = (lbase * (ft.k || 1)) + 'px';
  };
  const logoStop = () => {
   if (lt) { clearInterval(lt); lt = null; }
   logo.style.fontFamily = ''; logo.style.fontWeight = ''; logo.style.fontStyle = '';
   logo.style.fontSize = ''; logo.style.width = '';
  };
  // Pas de sortie anticipee sur ready.length : si les polices arrivent pendant le survol, la rotation les prend.
  const logoStart = () => {
   if (lt) return;
   logo.style.width = Math.round(logo.getBoundingClientRect().width || 62) + 'px';
   lbase = parseFloat(getComputedStyle(logo).fontSize) || 16;
   lt = setInterval(() => { if (ready.length < 2) return; li = (li + 1) % ready.length; logoApply(ready[li]); }, 260);
  };
  logo.parentElement.addEventListener('mouseenter', logoStart);
  logo.parentElement.addEventListener('mouseleave', logoStop);
  logo.parentElement.addEventListener('focus', logoStart);
  logo.parentElement.addEventListener('blur', logoStop);
 }

 apply(FONTS[0]);
 window.addEventListener('resize', fit);

 // Ne garde que les polices réellement chargées (évite les flashs de police de secours).
 // On attend que la feuille Google Fonts soit chargée avant de tester, sinon les faces ne sont pas encore déclarées.
 // Le texte de test est obligatoire : les polices Google sont demandees avec &text=duqe,
 // leur unicode-range ne couvre donc pas la chaine temoin par defaut de document.fonts.load
 // et l'appel renvoyait zero face — toutes les polices distantes etaient ecartees de la rotation.
 const check = () => Promise.all(FONTS.map(ft => document.fonts.load(ft.s + ' ' + ft.w + ' 40px ' + ft.f, 'duqque').then(r => (r && r.length) ? ft : null).catch(() => null)))
  .then(list => {
   const ok = list.filter(Boolean);
   if (ok.length > 1) {
    // Bande resserree vers le haut : la hauteur de lettre etant desormais figee, c'est la
    // largeur qui varie, et le mot ne doit pas depasser la largeur de l'ecran.
    const pool = buildMetricPool(ok, 'duqque', 0.82, 1.04);
    refM = pool.ref;
    ready = pool.list.sort(() => Math.random() - 0.5);
    fit();
   }
   start();
  });
 let checked = false;
 const once = () => { if (checked) return; checked = true; check(); };
 link.addEventListener('load', once);
 link.addEventListener('error', once);
 setTimeout(once, 4000); // secours si l'évènement ne vient jamais (hors ligne)
 // Re-vérifie une fois les polices distantes arrivées
 document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', () => { checked = false; once(); });

 const io = new IntersectionObserver(en => { visible = en[0].isIntersecting; if (visible) start(); else stop(); }, { threshold: 0.05 });
 io.observe(crop);
 document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
}

/* --- Images d'arrière-plan paresseuses : rien n'est téléchargé avant d'approcher l'écran --- */
function initLazyBg() {
 const targets = [...document.querySelectorAll('[data-bg], [data-bgimg], .audience, .stat-photo, .step-illus, .card-img, .met-feature')];
 if (!targets.length) return;
 const reveal = (el) => {
  if (el.dataset.bg) { el.style.setProperty('--bg', el.dataset.bg); el.removeAttribute('data-bg'); }
  if (el.dataset.bgimg) { el.style.backgroundImage = 'url("' + el.dataset.bgimg + '")'; el.removeAttribute('data-bgimg'); }
  el.classList.add('bg-in');
 };
 if (!('IntersectionObserver' in window)) { targets.forEach(reveal); return; }
 const io = new IntersectionObserver((entries) => {
  entries.forEach(en => { if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); } });
 }, { rootMargin: '300px 0px' });
 targets.forEach(el => io.observe(el));
}

function initYear() {
 document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
}

/* --- Vidéo : autoplay (muet) quand la section entre dans le viewport --- */
function initLazyVideo() {
 const holder = document.getElementById('terrainVideo');
 if (!holder) return;
 const iframe = holder.querySelector('iframe');
 // Préchargement immédiat, vidéo prête dès l'arrivée dans la section
 iframe.src = holder.dataset.src + '&enablejsapi=1';

 // Bouton son : pilote YouTube via postMessage
 const muteBtn = holder.querySelector('#fvMute');
 if (muteBtn) {
 muteBtn.addEventListener('click', () => {
 if (!iframe.contentWindow) return;
 const muted = !holder.classList.contains('is-unmuted');
 const fn = muted ? 'unMute' : 'mute';
 iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: fn, args: [] }), '*');
 holder.classList.toggle('is-unmuted', muted);
 muteBtn.setAttribute('aria-label', muted ? 'Couper le son' : 'Activer le son');
 });
 }
}

/* --- Barre de partage des articles ---------------------------------------------------
   Reprend l'aspect de la barre de menu. Sur desktop elle est fixee en bas de l'ecran ;
   des que la barre de menu passe en bas (768 px), elle redevient statique et se place a
   la fin de l'article, pour ne pas se superposer a la navigation. */
function initPartage() {
 const article = document.querySelector('.art-body');
 if (!article || document.querySelector('.share')) return;

 const ICO = {
  insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 8.5V6.9c0-.7.2-1.1 1.2-1.1H17V3.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v1.7H8.6V11h2.5v8h3.4v-8h2.4l.4-2.5h-2.8z"/></svg>',
  li: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.9 8.6H4V19h2.9V8.6zM5.4 4A1.7 1.7 0 1 0 5.4 7.4 1.7 1.7 0 0 0 5.4 4zM20 13.2c0-3-1.6-4.4-3.8-4.4-1.7 0-2.5.9-2.9 1.6V8.6H10.4c0 .8 0 10.4 0 10.4h2.9v-5.8c0-.3 0-.6.1-.8.3-.6.8-1.3 1.7-1.3 1.2 0 1.7.9 1.7 2.3V19H20v-5.8z"/></svg>',
  lien: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.1 0l2.4-2.4a5 5 0 0 0-7.1-7.1L11 4.9"/><path d="M14 11a5 5 0 0 0-7.1 0L4.5 13.4a5 5 0 0 0 7.1 7.1L13 19.1"/></svg>'
 };

 const url = encodeURIComponent(location.href.split('?')[0]);
 const titre = encodeURIComponent(document.title.split(' · ')[0]);

 const barre = document.createElement('div');
 barre.className = 'share';
 barre.innerHTML =
  '<span class="share-lbl">Partager</span>' +
  '<a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=' + url + '" target="_blank" rel="noopener" aria-label="Partager sur Facebook">' + ICO.fb + '</a>' +
  '<a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=' + url + '" target="_blank" rel="noopener" aria-label="Partager sur LinkedIn">' + ICO.li + '</a>' +
  '<button type="button" class="share-btn share-insta" aria-label="Copier le lien pour Instagram">' + ICO.insta + '</button>' +
  '<span class="share-ok" role="status" aria-live="polite"></span>';

 article.appendChild(barre);

 // Instagram n'offre pas de partage par URL depuis le web : on passe par le partage natif
 // quand il existe, sinon on copie le lien, ce que l'utilisateur colle dans sa story.
 const insta = barre.querySelector('.share-insta');
 const ok = barre.querySelector('.share-ok');
 insta.addEventListener('click', async () => {
  const lien = location.href.split('?')[0];
  try {
   if (navigator.share) { await navigator.share({ title: document.title, url: lien }); return; }
   await navigator.clipboard.writeText(lien);
   ok.textContent = 'Lien copié';
   setTimeout(() => { ok.textContent = ''; }, 2600);
  } catch (e) { /* partage annule par l'utilisateur */ }
 });
}

/* --- Colonnes laterales des articles --------------------------------------------------
   A gauche : le service en rapport avec l'axe de l'article, le Programme Espoirs, le contact.
   A droite : les autres articles, en priorite ceux du meme axe. Les deux colonnes sont
   collantes : elles suivent la lecture sans bouger d'elles-memes. Tout est genere ici pour
   que les articles suivants n'aient rien a dupliquer. */
const ARTICLES = [
 { url: 'art-carriere-14-15-16-ans.html', axe: 'Gestion de carrière',
   titre: "Faut-il déjà penser à sa carrière à 14, 15 ou 16 ans ?" },
 { url: 'art-sponsor-a-15-ans.html', axe: 'Sponsoring',
   titre: "À 15 ans, peut-on déjà intéresser un sponsor ?" },
 { url: 'art-reseaux-sociaux-jeune-athlete.html', axe: 'Communication',
   titre: "Réseaux sociaux : que publier quand on est un jeune athlète ?" },
 { url: 'art-changer-de-club.html', axe: 'Gestion de carrière',
   titre: "Changer de club : les questions à se poser avant de signer" },
 { url: 'art-droit-a-l-image-athlete.html', axe: 'Image de marque',
   titre: "Droit à l'image : ce que vous signez sans le lire" },
 { url: 'art-dossier-de-partenariat.html', axe: 'Sponsoring',
   titre: "Construire un dossier de partenariat qui obtient une réponse" },
 { url: 'art-premiere-interview.html', axe: 'Communication',
   titre: "Première interview : ce qu'il faut savoir avant de répondre" },
 { url: 'art-blessure-longue-carriere.html', axe: 'Gestion de carrière',
   titre: "Blessure longue : ne pas perdre une saison de carrière" },
 { url: 'art-propriete-intellectuelle-sport.html', axe: 'Image de marque',
   titre: "Copier un club, copier un athlète : le livre blanc de la propriété intellectuelle" }
];
const SERVICES = {
 'Gestion de carrière': { url: 'service-carriere.html', txt: "Contrats, trajectoire, reconversion : nous pilotons la carrière au-delà des résultats." },
 'Sponsoring':          { url: 'service-sponsoring.html', txt: "Nous construisons le dossier, démarchons et négocions les partenariats à votre place." },
 'Communication':       { url: 'service-communication.html', txt: "Réseaux, presse, media training : une parole tenue à l'année, pas au coup par coup." },
 'Image de marque':     { url: 'service-image.html', txt: "Identité, réputation, droit à l'image : ce qui fait la valeur d'un nom." }
};

function initColonnesArticle() {
 const corps = document.querySelector('.art-body');
 if (!corps || document.querySelector('.art-layout')) return;

 // Axe de l'article, lu dans les donnees structurees
 let axe = '';
 document.querySelectorAll('script[type="application/ld+json"]').forEach(sc => {
  try { const d = JSON.parse(sc.textContent); if (d.articleSection) axe = d.articleSection; } catch (e) {}
 });
 const service = SERVICES[axe] || SERVICES['Gestion de carrière'];
 const ici = location.pathname.split('/').pop();

 const fleche = '<span class="arrow"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.6"/></svg></span>';

 // Autres articles : meme axe d'abord, puis le reste
 const autres = ARTICLES.filter(a => a.url !== ici);
 autres.sort((a, b) => (b.axe === axe) - (a.axe === axe));

 const layout = document.createElement('div');
 layout.className = 'art-layout';

 const gauche = document.createElement('aside');
 gauche.className = 'art-rail art-rail-l';
 gauche.innerHTML =
  '<div class="rail-card rail-service">' +
   '<p class="rail-k">Le service associé</p>' +
   '<h3>' + axe + '</h3>' +
   '<p class="rail-txt">' + service.txt + '</p>' +
   '<a class="rail-cta" href="' + service.url + '">Voir le service' + fleche + '</a>' +
  '</div>' +
  '<div class="rail-card rail-espoirs">' +
   '<p class="rail-k">Moins de 18 ans</p>' +
   '<h3>Programme Espoirs</h3>' +
   '<p class="rail-txt">Accompagnement gratuit, aucune commission sur ce qui est négocié.</p>' +
   '<a class="rail-cta" href="team-espoirs.html">Découvrir' + fleche + '</a>' +
  '</div>' +
  '<a class="rail-contact" href="contact.html">Nous contacter' + fleche + '</a>';

 const droite = document.createElement('aside');
 droite.className = 'art-rail art-rail-r';
 droite.innerHTML =
  '<p class="rail-k">À lire ensuite</p>' +
  (autres.length
   ? '<ul class="rail-list">' + autres.map(a =>
      '<li><a href="' + a.url + '"><span class="rail-axe">' + a.axe + '</span><span class="rail-titre">' + a.titre + '</span></a></li>'
     ).join('') + '</ul>'
   : '<p class="rail-txt">Les prochains articles arrivent.</p>') +
  '<a class="rail-tous" href="actualites.html">Tous les articles' + fleche + '</a>';

 corps.parentNode.insertBefore(layout, corps);
 layout.appendChild(gauche);
 layout.appendChild(corps);
 layout.appendChild(droite);
}

/* --- Init --- */
document.addEventListener('DOMContentLoaded', () => {
 showLoader();
 initMenu();
 buildFooter();
 initNavScroll();
 initReveal();
 initProfileChips();
 initLiveFacts();
 initLazyVideo();
 initLangSwitcher();
 initIconTiles();
 initLazyBg();
 initFooterWordmark();
 initYear();
 initColonnesArticle();
 initPartage();
 publieHauteurNav();
 window.addEventListener('resize', publieHauteurNav);
 if (window.ResizeObserver) {
  const pill = document.querySelector('.nav-pill');
  if (pill) new ResizeObserver(publieHauteurNav).observe(pill);
 }
});
