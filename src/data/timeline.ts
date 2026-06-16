export type MediaType = 'film' | 'series' | 'game' | 'lore' | 'comic' | 'book';

export type Era =
  | 'dawn'
  | 'old-republic'
  | 'high-republic'
  | 'fall-republic'
  | 'empire'
  | 'rebellion'
  | 'new-republic'
  | 'first-order'
  | 'legends';

export interface TimelineEvent {
  id: string;
  title: string;
  year: number; // negative = BBY, positive = ABY
  type: MediaType;
  era: Era;
  /** Vertical lane offset for visual grouping */
  lane: number;
  color: string;
  tagline: string;
  description: string;
  lore: string;
  connections?: string[];
  releaseYear?: number;
  canon?: 'canon' | 'legends' | 'both';
}

export const ERA_CONFIG: Record<
  Era,
  { label: string; color: string; start: number; end: number }
> = {
  dawn: { label: 'Dawn of the Jedi', color: '#6b4c9a', start: -36000, end: -25000 },
  'old-republic': { label: 'Old Republic', color: '#c9a227', start: -25000, end: -1000 },
  'high-republic': { label: 'High Republic', color: '#4ecdc4', start: -500, end: -100 },
  'fall-republic': { label: 'Fall of the Republic', color: '#e74c3c', start: -32, end: -19 },
  empire: { label: 'Imperial Era', color: '#95a5a6', start: -19, end: 0 },
  rebellion: { label: 'Galactic Civil War', color: '#3498db', start: 0, end: 5 },
  'new-republic': { label: 'New Republic', color: '#2ecc71', start: 5, end: 28 },
  'first-order': { label: 'First Order', color: '#e67e22', start: 28, end: 35 },
  legends: { label: 'Legends Deep Time', color: '#8e44ad', start: -5000, end: -1000 },
};

export const TYPE_LABELS: Record<MediaType, string> = {
  film: 'Film',
  series: 'Series',
  game: 'Video Game',
  lore: 'Lore Event',
  comic: 'Comic',
  book: 'Novel',
};

export const TYPE_COLORS: Record<MediaType, string> = {
  film: '#ffd700',
  series: '#00d4ff',
  game: '#ff6b35',
  lore: '#b388ff',
  comic: '#ff4081',
  book: '#69f0ae',
};

/** Format a galactic year for display */
export function formatYear(year: number): string {
  if (year === 0) return '0 ABY (Battle of Yavin)';
  if (year > 0) return `${year} ABY`;
  return `${Math.abs(year).toLocaleString()} BBY`;
}

/** Convert galactic year to timeline X position (log-scaled for deep time) */
export function yearToX(year: number): number {
  const MIN = -36000;
  const MAX = 40;
  const SPAN = 120;

  if (year >= -1000) {
    // Linear for "modern" history (-1000 BBY to 40 ABY)
    const modernMin = -1000;
    const modernMax = MAX;
    const t = (year - modernMin) / (modernMax - modernMin);
    return -SPAN * 0.3 + t * SPAN * 1.05;
  }

  // Logarithmic compression for ancient history
  const ancientMin = MIN;
  const ancientMax = -1000;
  const logMin = Math.log10(Math.abs(ancientMin));
  const logMax = Math.log10(Math.abs(ancientMax));
  const logYear = Math.log10(Math.abs(year));
  const t = (logYear - logMin) / (logMax - logMin);
  return -SPAN * 0.3 - (1 - t) * SPAN * 0.7;
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  // ─── DAWN / DEEP LORE ───
  {
    id: 'formation-galactic-republic',
    title: 'Formation of the Galactic Republic',
    year: -25000,
    type: 'lore',
    era: 'dawn',
    lane: 0,
    color: '#b388ff',
    tagline: 'The Core Worlds unite',
    description:
      'The Galactic Republic is founded around Coruscant after the unification of the Core Worlds, establishing the Great Holocron and the Jedi Order as guardians of peace.',
    lore: 'Ancient texts in the Jedi Archives reference a "Tho Yor" pilgrimage predating even this era. The Rakata Infinite Empire had already risen and fallen by this point, leaving behind Star Maps and the scars of Force-powered hyperdrive technology across the galaxy.',
    canon: 'both',
  },
  {
    id: 'great-hyperspace-war',
    title: 'Great Hyperspace War',
    year: -5000,
    type: 'lore',
    era: 'old-republic',
    lane: 1,
    color: '#b388ff',
    tagline: 'The Sith Empire strikes from Korriban',
    description:
      'Naga Sadow leads the Sith Empire in a devastating invasion of the Republic. The war ends with the Sith in retreat and Korriban abandoned — but the Sith endure in the shadows.',
    lore: 'This conflict established the cyclical pattern of Sith return that would haunt the Republic for millennia. Sadow\'s tomb on Yavin 4 would later become a nexus of dark side energy studied by Exar Kun.',
    connections: ['great-sith-war'],
    canon: 'legends',
  },
  {
    id: 'great-sith-war',
    title: 'Great Sith War',
    year: -3996,
    type: 'lore',
    era: 'old-republic',
    lane: 1,
    color: '#b388ff',
    tagline: 'Exar Kun & Ulic Qel-Droma',
    description:
      'Jedi Knight Ulic Qel-Droma falls to the dark side alongside Exar Kun. Together they wage war against the Republic, corrupting Jedi and unleashing the Krath.',
    lore: 'The war culminates in the destruction of Ossus and the loss of countless Jedi artifacts. Ulic\'s redemption — struck down by his own brother — became a parable Jedi Masters would cite for generations.',
    connections: ['kotor'],
    canon: 'legends',
  },
  {
    id: 'kotor',
    title: 'Knights of the Old Republic',
    year: -3956,
    type: 'game',
    era: 'old-republic',
    lane: 2,
    color: '#ff6b35',
    tagline: 'Revan\'s true identity revealed',
    description:
      'The amnesiac Republic soldier known as Revan discovers they are the former Dark Lord of the Sith — and must choose the fate of the galaxy aboard the Star Forge.',
    lore: 'Malak, Revan\'s apprentice, betrayed their master during a Jedi strike team mission to capture Revan. Bastila Shan\'s Battle Meditation was the key to the Republic\'s survival. The destruction of the Star Forge marked a temporary end to the Sith threat — but Revan would vanish into the Unknown Regions seeking answers about the True Sith.',
    releaseYear: 2003,
    connections: ['kotor2', 'great-sith-war'],
    canon: 'legends',
  },
  {
    id: 'kotor2',
    title: 'Knights of the Old Republic II',
    year: -3951,
    type: 'game',
    era: 'old-republic',
    lane: 2,
    color: '#ff6b35',
    tagline: 'The exile of Malachor V',
    description:
      'The Jedi Exile, cast out after ordering the Mass Shadow Generator at Malachor V, is drawn back into galactic affairs as the Sith Triumvirate hunts the last Jedi.',
    lore: 'Darth Traya\'s philosophy — that the Force itself is a wound — remains one of the most debated texts in Jedi scholarship. The destruction of Malachor V and the death of the Triumvirate left the Jedi Order in ruins, setting the stage for the Mandalorian Wars\' aftermath.',
    releaseYear: 2004,
    connections: ['kotor', 'swtor'],
    canon: 'legends',
  },
  {
    id: 'swtor',
    title: 'The Old Republic (MMO)',
    year: -3643,
    type: 'game',
    era: 'old-republic',
    lane: 2,
    color: '#ff6b35',
    tagline: 'Return of the Sith Empire',
    description:
      'A hidden Sith Empire emerges from the Unknown Regions, reigniting full-scale war with the Republic. The Treaty of Coruscant temporarily halts the conflict.',
    lore: 'The Eternal Empire of Zakuul would later shatter both Republic and Sith, revealing that the galaxy\'s greatest threats often come from beyond known space. Players experience everything from the fall of Coruscant to the rise of the Eternal Throne.',
    releaseYear: 2011,
    connections: ['kotor2'],
    canon: 'legends',
  },

  // ─── HIGH REPUBLIC ───
  {
    id: 'high-republic-launch',
    title: 'High Republic Era Begins',
    year: -500,
    type: 'lore',
    era: 'high-republic',
    lane: 0,
    color: '#4ecdc4',
    tagline: 'The golden age of the Jedi',
    description:
      'The Republic expands into the Outer Rim under the Great Hyperspace Rush. The Jedi Order is at its zenith, operating from the Starlight Beacon space station.',
    lore: 'Chancellor Lina Soh\'s "Great Works" initiative aimed to bring prosperity to the galactic frontier. The Nihil — marauders who reject all authority — and the Drengir (sentient plant horrors) would test whether the Republic\'s golden age was built on sand.',
    connections: ['light-of-jedi'],
    canon: 'canon',
  },
  {
    id: 'light-of-jedi',
    title: 'Light of the Jedi',
    year: -232,
    type: 'book',
    era: 'high-republic',
    lane: 3,
    color: '#69f0ae',
    tagline: 'The Great Disaster',
    description:
      'The Legacy Run is destroyed in hyperspace, sending Emergences of debris across the Outer Rim. Jedi Master Avar Kriss coordinates a galaxy-wide rescue: the "Great Disaster."',
    lore: 'Marchion Ro, the Eye of the Nihil, orchestrated the disaster from the shadows. His family\'s connection to the Ro family of Eriadu and ancient Force artifacts called the Nameless would unravel the High Republic from within over the coming decades.',
    releaseYear: 2021,
    connections: ['high-republic-launch'],
    canon: 'canon',
  },
  {
    id: 'fallen-star',
    title: 'The Fallen Star',
    year: -230,
    type: 'book',
    era: 'high-republic',
    lane: 3,
    color: '#69f0ae',
    tagline: 'Destruction of Starlight Beacon',
    description:
      'The Nihil destroy Starlight Beacon in a coordinated attack. Multiple Jedi fall, and the High Republic\'s confidence shatters.',
    lore: 'The Nameless — creatures that feed on the Force and induce paralyzing fear in Force-sensitives — represent one of the Jedi\'s most existential threats. Their connection to the Ro family\'s ancient pact remains partially classified in modern Jedi records.',
    releaseYear: 2022,
    canon: 'canon',
  },

  // ─── FALL OF THE REPUBLIC ───
  {
    id: 'phantom-menace',
    title: 'The Phantom Menace',
    year: -32,
    type: 'film',
    era: 'fall-republic',
    lane: 0,
    color: '#ffd700',
    tagline: 'The Chosen One is discovered',
    description:
      'Trade Federation blockades Naboo. Qui-Gon Jinn discovers Anakin Skywalker on Tatooine and believes him to be the prophesied Chosen One. Darth Maul kills Qui-Gon before being defeated by Obi-Wan Kenobi.',
    lore: 'Darth Sidious orchestrated the entire crisis from both sides — as Senator Palpatine advocating for Naboo, and as the Sith Lord commanding the Federation. The discovery of Anakin, conceived by the midi-chlorians according to Qui-Gon, fulfilled a prophecy the Jedi Council was reluctant to accept.',
    releaseYear: 1999,
    connections: ['attack-clones'],
    canon: 'canon',
  },
  {
    id: 'bounty-hunter',
    title: 'Star Wars: Bounty Hunter',
    year: -32,
    type: 'game',
    era: 'fall-republic',
    lane: 3,
    color: '#ff6b35',
    tagline: 'Jango\'s last hunt',
    description:
      'Jango Fett hunts a rogue Dark Jedi on Coruscant while competing with rival bounty hunters. The game ends with Jango\'s recruitment by Count Dooku.',
    lore: 'The game fleshes out Jango\'s reputation before Kamino — his rivalry with Montross, partnership with Zam Wesell, and the Komari Vosa contract that led directly to him becoming the clone template. A hidden cameo from a young Boba foreshadows the legacy.',
    releaseYear: 2002,
    connections: ['phantom-menace', 'attack-clones'],
    canon: 'legends',
  },
  {
    id: 'episode-1-racer',
    title: 'Episode I: Racer',
    year: -32,
    type: 'game',
    era: 'fall-republic',
    lane: 3,
    color: '#ff6b35',
    tagline: 'Boonta Eve Classic',
    description:
      'Anakin Skywalker pilots his custom Podracer in the Boonta Eve Classic on Tatooine — the race that won his freedom.',
    lore: 'Sebulba\'s dirty tactics, Teemto Pagalies\'s mystique, and Anakin\'s impossible comeback are legend on Tatooine. The podracing circuits of Malastare, Sullust, and Ando Prime became fan-favorite tracks. "Now THIS is podracing!"',
    releaseYear: 1999,
    connections: ['phantom-menace'],
    canon: 'canon',
  },
  {
    id: 'attack-clones',
    title: 'Attack of the Clones',
    year: -22,
    type: 'film',
    era: 'fall-republic',
    lane: 0,
    color: '#ffd700',
    tagline: 'The Clone Wars begin',
    description:
      'Separatist crisis erupts across the galaxy. Anakin and Padmé fall in love on Naboo. The Republic authorizes a clone army — secretly ordered by Sifo-Dyas and modified by Tyranus.',
    lore: 'Count Dooku, aka Darth Tyranus, was once Yoda\'s apprentice and Qui-Gon\'s master. The clone army\'s inhibitor chips, planted by Tyranus per Sidious\'s orders, would become the key to Order 66. Jango Fett\'s DNA templates every clone trooper in the Grand Army.',
    releaseYear: 2002,
    connections: ['phantom-menace', 'clone-wars', 'revenge-sith'],
    canon: 'canon',
  },
  {
    id: 'clone-wars',
    title: 'The Clone Wars',
    year: -22,
    type: 'series',
    era: 'fall-republic',
    lane: 1,
    color: '#00d4ff',
    tagline: '3 years of galactic war',
    description:
      'The animated series spans the entire Clone Wars: from Christophsis to the Siege of Mandalore. Ahsoka Tano, Rex, and countless clones define the war\'s human cost.',
    lore: 'Maul\'s Shadow Collective, the Mortis gods, the Zillo Beast, and the tragedy of Fives discovering Order 66 — this era is the Republic\'s crucible. Ahsoka\'s departure from the Jedi Order and the 332nd\'s siege of Mandalore run parallel to Revenge of the Sith\'s events.',
    releaseYear: 2008,
    connections: ['attack-clones', 'revenge-sith'],
    canon: 'canon',
  },
  {
    id: 'republic-commando',
    title: 'Republic Commando',
    year: -22,
    type: 'game',
    era: 'fall-republic',
    lane: 3,
    color: '#ff6b35',
    tagline: 'Delta Squad\'s finest hour',
    description:
      'Clone commandos Boss, Fixer, Scorch, and Sev fight through Geonosis, the Prosecutor, and Kashyyyk as the Clone Wars escalate.',
    lore: 'The game pioneered squad-based tactical shooters and gave clones distinct personalities beyond the batch numbers. Sev\'s disappearance on Kashyyyk and the betrayal of Order 66 landing mid-mission remain one of the saga\'s most brutal tonal whiplashes. "Vode an."',
    releaseYear: 2005,
    connections: ['clone-wars', 'revenge-sith'],
    canon: 'canon',
  },
  {
    id: 'revenge-sith',
    title: 'Revenge of the Sith',
    year: -19,
    type: 'film',
    era: 'fall-republic',
    lane: 0,
    color: '#ffd700',
    tagline: 'The fall of Anakin Skywalker',
    description:
      'Palpatine is revealed as Darth Sidious. Anakin becomes Darth Vader. Order 66 exterminates the Jedi. Padmé dies giving birth to Luke and Leia. The Empire is born.',
    lore: '"I am the Senate." Palpatine\'s decades-long plan culminates in a single night of betrayal. Vader\'s duel with Obi-Wan on Mustafar leaves him more machine than man. Yoda and Obi-Wan go into exile, trusting that the children of Anakin represent the galaxy\'s last hope.',
    releaseYear: 2005,
    connections: ['clone-wars', 'rogue-one'],
    canon: 'canon',
  },

  // ─── IMPERIAL ERA ───
  {
    id: 'jedi-fallen-order',
    title: 'Jedi: Fallen Order',
    year: -14,
    type: 'game',
    era: 'empire',
    lane: 2,
    color: '#ff6b35',
    tagline: 'Cal Kestis rebuilds hope',
    description:
      'Padawan Cal Kestis, hiding from the Empire after Order 66, rediscovers his connection to the Force and seeks a holocron listing Force-sensitive children.',
    lore: 'The Mantis crew — Cere, Greez, BD-1, and later Merrin — represents scattered Jedi resistance. Ilum, Dathomir, and the ancient Zeffo civilization expand our understanding of Force traditions beyond the Jedi. Cal ultimately destroys the holocron to protect the children.',
    releaseYear: 2019,
    connections: ['jedi-survivor', 'revenge-sith'],
    canon: 'canon',
  },
  {
    id: 'solo',
    title: 'Solo: A Star Wars Story',
    year: -13,
    type: 'film',
    era: 'empire',
    lane: 1,
    color: '#ffd700',
    tagline: 'How Han met Chewie',
    description:
      'Young Han Solo escapes Corellia, joins the Imperial Navy, betrays the Empire, and completes the Kessel Run in twelve parsecs.',
    lore: 'The coaxium heist on Kessel, the betrayal by Beckett, and L3-37\'s sacrifice aboard the Millennium Falcon weave into the underworld economy that would later fund the Rebellion. Qi\'ra\'s ascension in Crimson Dawn connects to Maul\'s criminal empire.',
    releaseYear: 2018,
    connections: ['rebels'],
    canon: 'canon',
  },
  {
    id: 'rebels',
    title: 'Star Wars Rebels',
    year: -5,
    type: 'series',
    era: 'empire',
    lane: 1,
    color: '#00d4ff',
    tagline: 'The Ghost crew ignites rebellion',
    description:
      'Ezra Bridger and the crew of the Ghost fight the Empire on Lothal, join the growing Rebellion, and encounter both Darth Vader and Grand Admiral Thrawn.',
    lore: 'Kanan Jarrus\'s death, Ahsoka\'s duel with Vader, the World Between Worlds, and Ezra\'s sacrifice pulling Thrawn\'s fleet into hyperspace — Rebels bridges the prequel and original eras. The Loth-wolf connection to the Force runs deeper than any Imperial scientist understood.',
    releaseYear: 2014,
    connections: ['jedi-fallen-order', 'rogue-one'],
    canon: 'canon',
  },
  {
    id: 'andor-s1',
    title: 'Andor (Season 1)',
    year: -5,
    type: 'series',
    era: 'empire',
    lane: 2,
    color: '#00d4ff',
    tagline: 'One man\'s path to rebellion',
    description:
      'Cassian Andor transforms from a cynical thief into a committed rebel operative. The Aldhani heist and Narkina prison break are turning points.',
    lore: 'Andor strips away the mythic and shows rebellion as grinding, moral compromise. Luthen Rael\'s "I burn my life to make a sunrise" speech encapsulates the cost. Mon Mothma\'s quiet fundraising and Krennic\'s Death Star funding exist in the same galaxy, unseen to each other.',
    releaseYear: 2022,
    connections: ['rogue-one'],
    canon: 'canon',
  },
  {
    id: 'jedi-survivor',
    title: 'Jedi: Survivor',
    year: -9,
    type: 'game',
    era: 'empire',
    lane: 2,
    color: '#ff6b35',
    tagline: 'Cal faces the dark side',
    description:
      'Cal Kestis confronts Dagan Gera and the hidden world of Tanalorr while the Empire closes in. Bode Akuna\'s betrayal shatters the Mantis family.',
    lore: 'Tanalorr — a hidden planet accessible only through the Abyss — represents the Jedi dream of a sanctuary. Gera\'s madness after centuries in bacta tanks shows the cost of obsession. Cal\'s choice to fight rather than hide defines the scattered Jedi of this era.',
    releaseYear: 2023,
    connections: ['jedi-fallen-order'],
    canon: 'canon',
  },
  {
    id: 'force-unleashed',
    title: 'The Force Unleashed',
    year: -1,
    type: 'game',
    era: 'empire',
    lane: 3,
    color: '#ff6b35',
    tagline: 'Vader\'s secret apprentice',
    description:
      'Starkiller, Darth Vader\'s hidden apprentice, is sent to eliminate remaining Jedi and sow the seeds of the Rebel Alliance — then betrayed by his master.',
    lore: 'The game\'s iconic moment — bringing down a Star Destroyer with the Force — defined a generation of power fantasy. Starkiller\'s sacrifice and the formation of the Rebel crest from his family crest were decanonized but remain culturally embedded. Rahm Kota, Juno Eclipse, and PROXY are fan-favorite Legends characters.',
    releaseYear: 2008,
    connections: ['revenge-sith', 'rogue-one'],
    canon: 'legends',
  },
  {
    id: 'rogue-one',
    title: 'Rogue One',
    year: 0,
    type: 'film',
    era: 'rebellion',
    lane: 0,
    color: '#ffd700',
    tagline: 'Hope begins with sacrifice',
    description:
      'Jyn Erso and Cassian Andor steal the Death Star plans from Scarif. The entire Rogue One team dies transmitting the data to Princess Leia.',
    lore: '"I am one with the Force, and the Force is with me." Chirrut Îmwe\'s mantra echoes the spiritual heart of the Rebellion. Vader\'s hallway scene aboard the Profundity remains the most terrifying display of his power. The plans lead directly to the Battle of Yavin.',
    releaseYear: 2016,
    connections: ['andor-s1', 'new-hope'],
    canon: 'canon',
  },

  // ─── GALACTIC CIVIL WAR ───
  {
    id: 'new-hope',
    title: 'A New Hope',
    year: 0,
    type: 'film',
    era: 'rebellion',
    lane: 0,
    color: '#ffd700',
    tagline: 'The Battle of Yavin',
    description:
      'Luke Skywalker destroys the Death Star with guidance from Obi-Wan\'s spirit. The galaxy\'s calendar resets: Year Zero, After Battle of Yavin.',
    lore: 'From a farm boy on Tatooine to the Rebellion\'s greatest hero in days — Luke\'s journey begins with Leia\'s message, old Ben\'s lightsaber, and a trench run trusting in the Force. Tarkin\'s arrogance and Vader\'s underestimated farmboy cost the Empire their ultimate weapon.',
    releaseYear: 1977,
    connections: ['rogue-one', 'empire-strikes-back'],
    canon: 'canon',
  },
  {
    id: 'dark-forces',
    title: 'Dark Forces',
    year: 1,
    type: 'game',
    era: 'rebellion',
    lane: 3,
    color: '#ff6b35',
    tagline: 'Kyle Katarn joins the fight',
    description:
      'Former Imperial officer Kyle Katarn defects and infiltrates an Imperial facility to recover the Death Star plans — a parallel thread to the Rebellion\'s growing intelligence war.',
    lore: 'LucasArts\' first true 3D FPS in the galaxy introduced Kyle Katarn, the Moldy Crow, and the fusion of Imperial espionage with Jedi destiny. The game\'s Dark Trooper program — phased exoskeleton stormtroopers — was among the Empire\'s most terrifying weapons research projects.',
    releaseYear: 1995,
    connections: ['new-hope', 'jedi-knight'],
    canon: 'legends',
  },
  {
    id: 'x-wing',
    title: 'Star Wars: X-Wing',
    year: 1,
    type: 'game',
    era: 'rebellion',
    lane: 3,
    color: '#ff6b35',
    tagline: 'Fight as a Rebel pilot',
    description:
      'Players fly iconic starfighters through campaigns from the Battle of Yavin through the destruction of the Death Star II, experiencing the Galactic Civil War from the cockpit.',
    lore: 'The gold-standard space sim of the early \'90s. Tour 1: A New Hope. Tour 2: The Bacta War. The tactical briefing room, energy management, and shield allocation mechanics taught a generation what it felt like to be a Rebel pilot. "Red Leader, standing by."',
    releaseYear: 1993,
    connections: ['new-hope', 'tie-fighter'],
    canon: 'legends',
  },
  {
    id: 'battlefront-2004',
    title: 'Battlefront (2004)',
    year: 1,
    type: 'game',
    era: 'rebellion',
    lane: 3,
    color: '#ff6b35',
    tagline: 'Fight on the front lines',
    description:
      'Large-scale battles across the Clone Wars and Galactic Civil War — Hoth, Endor, Kamino, Geonosis — from trooper-level ground combat to hero units.',
    lore: 'The game that let fans live the trailer fantasies: AT-AT assaults on Hoth, Ewok guerrilla warfare, Jedi heroes cutting through armies. Its instant-action mode became the definitive Star Wars multiplayer sandbox before EA\'s reboot.',
    releaseYear: 2004,
    connections: ['new-hope', 'return-jedi'],
    canon: 'legends',
  },
  {
    id: 'empire-strikes-back',
    title: 'The Empire Strikes Back',
    year: 3,
    type: 'film',
    era: 'rebellion',
    lane: 0,
    color: '#ffd700',
    tagline: 'I am your father',
    description:
      'The Rebels flee Hoth. Luke trains with Yoda on Dagobah. Han is frozen in carbonite. Vader reveals his parentage on Cloud City.',
    lore: 'The darkest chapter of the original trilogy. Yoda\'s warnings about the dark side, the cave vision, and Luke leaving prematurely all foreshadow his failure. Lando\'s redemption arc begins. The galaxy learns that the Empire strikes back harder than the Rebels can withstand — for now.',
    releaseYear: 1980,
    connections: ['new-hope', 'return-jedi'],
    canon: 'canon',
  },
  {
    id: 'tie-fighter',
    title: 'Star Wars: TIE Fighter',
    year: 2,
    type: 'game',
    era: 'rebellion',
    lane: 3,
    color: '#ff6b35',
    tagline: 'Serve the Empire',
    description:
      'Fly the Empire\'s finest — TIE Interceptors, Bombers, and Assault Gunboats — hunting Rebels, pirates, and treacherous Imperial officers.',
    lore: 'The rare game that made serving the Empire feel noble. Grand Admiral Thrawn\'s secret campaigns, the Zaarin insurrection, and the internal power struggles of the Imperial Navy gave depth to the "bad guys." Often ranked among the greatest space combat sims ever made.',
    releaseYear: 1994,
    connections: ['x-wing', 'empire-at-war'],
    canon: 'legends',
  },
  {
    id: 'outlaws',
    title: 'Star Wars Outlaws',
    year: 3,
    type: 'game',
    era: 'rebellion',
    lane: 3,
    color: '#ff6b35',
    tagline: 'Kay Vess\'s scoundrel saga',
    description:
      'Scoundrel Kay Vess and her companion Nix navigate the criminal underworld between the Empire and syndicates, pulling heists while the Galactic Civil War rages overhead.',
    lore: 'Set in the shadow of the Empire Strikes Back, Outlaws explores the galaxy\'s underworld — Pyke Syndicate, Hutts, and the Ashiga Clan — during the Rebellion\'s darkest hour. Kay\'s speeder chases, stealth infiltrations, and reputation system capture the scoundrel fantasy the films only hint at.',
    releaseYear: 2024,
    connections: ['empire-strikes-back', 'return-jedi'],
    canon: 'canon',
  },
  {
    id: 'empire-at-war',
    title: 'Empire at War',
    year: 2,
    type: 'game',
    era: 'rebellion',
    lane: 3,
    color: '#ff6b35',
    tagline: 'Conquer the galaxy',
    description:
      'Real-time strategy spanning the Galactic Civil War — build fleets, conquer planets, and deploy heroes like Luke, Vader, and Chewbacca on the galactic map.',
    lore: 'Petroglyph\'s RTS let players experience the GCW at fleet scale. Corruption mechanics, hero unit abilities, and space-to-ground transitions captured the scope of the war. The Forces of Corruption expansion added Tyber Zann\'s criminal empire and the Zann Consortium\'s superweapon ambitions.',
    releaseYear: 2006,
    connections: ['new-hope', 'return-jedi'],
    canon: 'legends',
  },
  {
    id: 'return-jedi',
    title: 'Return of the Jedi',
    year: 4,
    type: 'film',
    era: 'rebellion',
    lane: 0,
    color: '#ffd700',
    tagline: 'The Emperor falls',
    description:
      'Luke confronts Vader and Palpatine aboard the second Death Star. Anakin Skywalker destroys the Emperor, fulfilling the prophecy. The Empire begins to crumble.',
    lore: 'The Ewok victory on Endor, while controversial among military historians, diverted the shield generator\'s protection. Anakin\'s final choice — saving his son rather than serving his master — brings balance to the Force. The galaxy celebrates, but Imperial remnants persist in the Unknown Regions.',
    releaseYear: 1983,
    connections: ['empire-strikes-back', 'mandalorian'],
    canon: 'canon',
  },
  {
    id: 'battlefront-2-classic',
    title: 'Battlefront II (Campaign)',
    year: 0,
    type: 'game',
    era: 'rebellion',
    lane: 2,
    color: '#ff6b35',
    tagline: 'Inferno Squad\'s war',
    description:
      'Iden Versio leads Inferno Squad from the Battle of Endor through the rise of the First Order, eventually defecting to save her homeworld.',
    lore: 'The game bridges Return of the Jedi and The Force Awakens, showing Operation: Cinder — Palpatine\'s posthumous scorched-earth contingency. Iden\'s defection and the formation of the Resistance\'s roots in the New Republic military are key transitional lore.',
    releaseYear: 2017,
    connections: ['return-jedi', 'force-awakens'],
    canon: 'canon',
  },

  // ─── NEW REPUBLIC ───
  {
    id: 'jedi-knight',
    title: 'Jedi Knight: Dark Forces II',
    year: 10,
    type: 'game',
    era: 'new-republic',
    lane: 3,
    color: '#ff6b35',
    tagline: 'Kyle Katarn becomes a Jedi',
    description:
      'Kyle Katarn discovers his Force sensitivity and confronts the Dark Jedi Jerec, who seeks the power of the Valley of the Jedi on Ruusan.',
    lore: 'The game that gave us multiplayer lightsaber combat and the iconic "kataarn" jungle chase. Kyle\'s choice between the light and dark side at the Valley of the Jedi shaped his path toward becoming a Jedi Master. Mara Jade\'s appearances tied the Expanded Universe together.',
    releaseYear: 1997,
    connections: ['dark-forces'],
    canon: 'legends',
  },
  {
    id: 'mandalorian',
    title: 'The Mandalorian',
    year: 9,
    type: 'series',
    era: 'new-republic',
    lane: 1,
    color: '#00d4ff',
    tagline: 'This is the Way',
    description:
      'Din Djarin protects Grogu (Baby Yoda), reunites him with Luke Skywalker, and eventually retakes Mandalore with the Darksaber.',
    lore: 'The series explores Mandalorian culture, the purge by the Empire, and the Living Force through Grogu. Bo-Katan, the Armorer, and the Mythosaur\'s return redefine Mandalore\'s future. Gideon\'s cloning experiments connect to Imperial remnant science.',
    releaseYear: 2019,
    connections: ['return-jedi', 'book-boba'],
    canon: 'canon',
  },
  {
    id: 'book-boba',
    title: 'The Book of Boba Fett',
    year: 9,
    type: 'series',
    era: 'new-republic',
    lane: 2,
    color: '#00d4ff',
    tagline: 'Boba rules Tatooine',
    description:
      'Boba Fett survives the Sarlacc, leads Tusken Raiders, and seizes Jabba\'s throne as Tatooine\'s daimyo.',
    lore: 'Boba\'s respect for the Tuskens recontextualizes his character. The Pyke Syndicate spice trade and the eventual battle for Mos Espa show the New Republic\'s limited reach in the Outer Rim. Cad Bane\'s return bridges Clone Wars to this era.',
    releaseYear: 2021,
    connections: ['mandalorian'],
    canon: 'canon',
  },
  {
    id: 'ahsoka',
    title: 'Ahsoka',
    year: 11,
    type: 'series',
    era: 'new-republic',
    lane: 1,
    color: '#00d4ff',
    tagline: 'Thrawn returns',
    description:
      'Ahsoka Tano searches for Ezra Bridger and Grand Admiral Thrawn in the Unknown Regions via the Pathway to Peridea.',
    lore: 'Peridea, the ancient homeworld of the Dathomiri witches, exists beyond the known galaxy. Baylan Skoll\'s quest for "a power beyond Jedi and Sith" introduces mysterious forces. The series sets up the impending return of Thrawn as a galaxy-level threat.',
    releaseYear: 2023,
    connections: ['rebels', 'mandalorian'],
    canon: 'canon',
  },

  // ─── FIRST ORDER ───
  {
    id: 'force-awakens',
    title: 'The Force Awakens',
    year: 34,
    type: 'film',
    era: 'first-order',
    lane: 0,
    color: '#ffd700',
    tagline: 'The Force awakens',
    description:
      'Rey, Finn, and Poe destroy Starkiller Base. Han Solo dies at the hands of his son, Kylo Ren. Luke Skywalker is found on Ahch-To.',
    lore: 'The First Order rose from the Unknown Regions, funded by Imperial remnants and guided by Snoke. Rey\'s Force vision in Maz\'s castle, the awakening described by Snoke, and the map to Luke set the sequel trilogy in motion. Starkiller Base\'s destruction of the Hosnian system decapitates the New Republic.',
    releaseYear: 2015,
    connections: ['battlefront-2-classic', 'last-jedi'],
    canon: 'canon',
  },
  {
    id: 'last-jedi',
    title: 'The Last Jedi',
    year: 34,
    type: 'film',
    era: 'first-order',
    lane: 0,
    color: '#ffd700',
    tagline: 'Let the past die',
    description:
      'Luke trains Rey, confronts his failure with Ben Solo, and becomes one with the Force. Holdo\'s sacrifice at Crait saves the Resistance.',
    lore: 'The film deconstructs Jedi myth: Luke\'s exile, the Canto Bight arms dealers profiting from both sides, and Rey\'s discovery that she is nobody — or is she? The Force connection between Rey and Kylo, and Yoda\'s "we are what they grow beyond," redefine legacy.',
    releaseYear: 2017,
    connections: ['force-awakens', 'rise-skywalker'],
    canon: 'canon',
  },
  {
    id: 'rise-skywalker',
    title: 'The Rise of Skywalker',
    year: 35,
    type: 'film',
    era: 'first-order',
    lane: 0,
    color: '#ffd700',
    tagline: 'The dyad defeats Palpatine',
    description:
      'Rey discovers she is Palpatine\'s granddaughter. The Final Order fleet is destroyed at Exegol. Ben Solo sacrifices himself to save Rey.',
    lore: 'Exegol, the Sith Eternal, and Palpatine\'s cloning experiments tie the saga\'s end to its beginning. "A thousand generations live in you." Rey takes the Skywalker name. The Prophecy of the Chosen One echoes across three trilogies — balance restored, again, at terrible cost.',
    releaseYear: 2019,
    connections: ['last-jedi'],
    canon: 'canon',
  },
  {
    id: 'squadrons',
    title: 'Star Wars: Squadrons',
    year: 34,
    type: 'game',
    era: 'first-order',
    lane: 2,
    color: '#ff6b35',
    tagline: 'Dogfights after Endor',
    description:
      'Set during the late Galactic Civil War and New Republic era, players fly for both New Republic Vanguard and Imperial Titan squadrons.',
    lore: 'The game celebrates starfighter combat culture: the TIE Fighter\'s raw power vs. the X-wing\'s versatility. Project Starhawk — the New Republic\'s superweapon answer — shows the moral lines the new government nearly crossed.',
    releaseYear: 2020,
    connections: ['return-jedi'],
    canon: 'canon',
  },
];

export function getEventById(id: string): TimelineEvent | undefined {
  return TIMELINE_EVENTS.find((e) => e.id === id);
}

export function getSortedEvents(): TimelineEvent[] {
  return [...TIMELINE_EVENTS].sort((a, b) => a.year - b.year);
}
