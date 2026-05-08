// ── Wordle answer pool (365 common 5-letter words) ──

export const WORDLE_ANSWERS = "about above abuse actor acute admit adopt adult after again agent agree ahead alarm album alien align alive alley allow alone along alter among angel anger angle angry ankle apart apple apply arena argue arise arrow aside asset avoid await awake aware awful badge baker basic beach begin being below bench berry black blade blame blank blast blaze bleed blend bless blind block blood bloom blown board bonus booth bound brain brand brave bread break breed brick bride brief bring broad broke brown brush buddy build bunch burst buyer cabin cable candy carry catch cause chain chair chalk chaos charm chase cheap check cheek cheer chest chief child china chunk civil claim clash class clean clear climb cling clock clone close cloud coach coast coral couch count court cover crack craft crane crash crazy cream creek crime cross crowd crown cruel crush curve cycle daily dance death debut delay demon dense depth derby devil dirty donor doubt draft drain drama drawn dream dress drift drill drink drive drone drove drunk eager eagle earth eight elect elite email empty enemy enjoy enter entry equal error essay event every exact exile exist extra faith fancy fatal fault feast fiber field fifth fifty fight final first flame flash flesh float flood floor flour fluid flush focus force forty forum found frame fresh front frost fruit fully giant given glass globe glory going grain grand grant grape grasp grass grave great green grief grind gross group grove grown guard guess guide guilt happy harsh haven heart heavy hence hobby honey honor horse hotel house human humor hurry ideal image imply index inner input irony issue ivory jewel joint judge juice karma knack knife knock known label labor large laser later laugh layer learn lease legal lemon level light limit liver local lodge logic loose lover lower loyal lucky lunar lunch magic major maker manor maple march marry match mayor media mercy merit metal might minor mixed model money month moral mount mouse mouth movie music nerve never newly night noble noise north noted novel nurse ocean offer onset opera orbit order organ other outer owned paint panel panic patch pause peace pearl penny phone photo piano piece pilot pitch pixel pizza place plain plane plant plate plaza plead pluck point polar porch pound power press price pride prime print prior prize proof proud prove pulse punch pupil purse queen quest queue quick quiet quota quote radar radio raise rally ranch range rapid ratio reach react ready realm rebel refer reign relax relay renew reply rider rifle rigid rival river robot rocky roots rough round route royal rugby ruler rural saint salad sauce scale scene scope score scout sense serve seven shade shake shame shape share shark sharp sheet shelf shell shift shine shirt shock shore short shout sight silly since sixth sixty skull slash sleep slice slide slope small smart smell smile smoke snake solar solid solve sorry space spare speak spend spine split spoke sport spray squad stack staff stage stake stale stamp stand stare stark start state steal steam steel steep steer stern stick still stock stone stool store storm story stout stove strap strip stuck study stuff style sugar suite super surge swamp swear sweep sweet swept swift swing sword table taste teach teeth tempo terms theft theme thick thing think third those three throw thumb tight timer tired title toast token total touch tough tower toxic trace track trade trail train trait trash treat trend trial trick troop truck truly trunk trust truth tumor twist ultra uncle under union unite unity until upper upset urban usage usual utter valid value vapor vault verse vigor viral virus visit vital vivid vocal voice voter wages waste watch water weary weave weird wheat wheel where which while white whole whose width witch woman women world worry worse worst worth would wound wrath write wrong wrote yacht yield young youth".split(" ");

// ── Dictionary for Spelling Bee (4+ letter common words) ──

const _DICT_SET = new Set((
  "able abet ache acid acre acts aged agent ages agile aging agree aide aisle akin alarm alder alert alien align alike alive allay alley allot allow alloy alone along alter amaze amine among ample angel anger angle angry ankle annex antic anvil apart arena argue arise armor array arrow aside atlas atone attic audio audit avail avert avoid await awake axle " +
  "babe back badge bail bait bake bald bale ball band bane bank bare bark barn base bash bass bath bawl bead beak beam bean bear beat been beer bell belt bend bent berry best bias bible bike bile bind bird bite black blade blame blank blast blaze bleed blend bless blind bliss block blood bloom blown blue bluff blunt blurt board boast boat body bold bolt bomb bond bone bonus book boom boot bore born boss both bound brace brain brake brand brass brave bread break breed brick bride brief brine bring brink broad broke brook broom broth brown brush brute buddy build built bulge bulk bull bunch burn burst buyer " +
  "cabin cable cage cake call calm came camp cane cape card care cart case cash cast cause cave cell chain chair chalk champ chase cheap check cheek cheer chess chest chief child china chip choir chord chore chunk cider civil claim clamp clang clap clash clasp class claw clay clean clear clerk click cliff climb cline cling clip cloak clock clone close cloth cloud clout club clue clump clung coach coast coat code coil coin cold collar color come cone cook cool cope copy cord core cork corn cost couch could count couple court cover crack craft crane crash crazy cream creek crew crime crisp cross crowd crown crude crush curve cycle " +
  "dace daily damp dance dare dark dart data date dawn dead deaf deal dealt dear death debut decay decoy deep deer delay delta demon dense depot depth derby desk devil diary dice diet dine dire dirt dirty ditch diver dodge doing dome done donor doom door dose doubt dough down draft drain drake drama drape drawn dream dress dried drift drill drink drive drone drool drop drove drunk dual duel dumb dump dune dunk dusk dust duty dwell dying " +
  "each earl earn ease east easy edge eight elder elect elite ember emit empty enemy enjoy enter entire entry equal error essay even event ever every evil exact exam exile exist extra " +
  "fable face fact fade fail fain faint fair fairy faith fake fall false fame fang fancy fare farm fast fatal fate fault favor fawn fear feast feat feed feel feet fell felt fence ferry fewer fiber field fifth fifty fight file fill film final find fine fire firm first fish fist five fixed flag flame flap flare flash flat flaw flea fled flee flesh flew fling flip flit float flock flood floor flour flow fluid flush flute foam foil fold folk font fool foot force forge fork form fort forth forty forum fossil found four frame frank fraud freak free fresh fret front frost fruit fuel full fund fungi funny fury fuse fuss " +
  "gain gale game gape garb gate gave gaze gear gene ghost giant gift gild gilt gist give given glad gland glare glass gleam glide globe gloom glory gloss glove glow glue gnaw goes gold golf gone good gore grab grace grade grain grand grant grape graph grasp grass grate grave gray graze great greed green greet grew grid grief grill grime grind grip groan groom gross group grove grow grown gruel grunt guard guess guest guide guilt gulf gust " +
  "hack hail hair hale half hall halt hand hang hare harm harp harsh haste hate haul have haven hawk haze head heal heap hear heard heart heat heavy hedge heel heir held help hemp hence herb herd here hero hide high hike hill hilt hind hint hire hold hole home honest honey honor hood hook hope horn horse host hotel hour house howl huge hull hump hung hunt hurl hurry hurt hush hymn " +
  "icon idea ideal idle image imply inane index indie inept inert infer ingot inlet inner input inter into intro irate iron irony issue ivory " +
  "jape jest jewel join joint joke jolly joust judge juice jump just jute " +
  "keen keep kernel keel kick kind king kite knack knead kneel knelt knew knife knit knob knock knot known " +
  "lace lack laid lain lair lake lamb lame lamp land lane lard large lash lass last late latch later laugh launch layer lead leaf leak lean leap learn lease least leave left legal lemon lend less level lever liar lick lien life lift light like limb lime limit limp line linen link lint lion list live liver load loaf loan local lock lodge loft lone long look loop loose lord lore lose loss lost loud love lover lower loyal luck lull lump lure lurk lush lust " +
  "made magic main major make male mall malt mane manor maple march mark marsh mask mass match mate math maze mead meal mean meat meet meld melt memo mend menu mercy merge merit mesh metal meter might mild mile mill mind mine miner minor mint mire mirror miser mixed moan moat mock mode moist mold money month mood moon moor moral motor mound mount mourn mouse mouth move movie much mule mural music muse mute myth " +
  "nail name nape near neat neck need nerve nest never nice night nine noble node noise none noon norm north nose note noted novel nurse " +
  "obey ocean offer olive once onset open opera orbit order organ other otter ought outer ounce over oven owner oxide " +
  "pace pack page paid pail pain pair pale palm pane panel panic paste patch path pause pave pawn peace peach peak peal pear pearl peel peer penny perch peril phase phone photo piano pick piece pike pile pine pint pipe pitch pixel place plaid plain plan plane plank plant plate plaza plead pleat plied plod plot pluck plumb plume plump plunge plunk point polar pond pool poor pope porch pork port pose post pouch pound pour power praise press price prick pride prime print prior prize probe prone proof proud prove prune pulse pump punch pupil purse push " +
  "quail qualm queen query quest queue quick quiet quilt quite quota quote " +
  "race rack raft rage raid rail rain raise rally ramp ranch range rank rapid rare rash rate ratio raven reach react read ready realm reap rebel recur reed reef reel refer reign relax relay remit renew rent repay reply resin rest retry rider ridge rifle rigid rind ring rinse riot ripe rise risk rite rival river road roam roar robe robin robot rocky rode role roll roman roost root rope rose rough round route rover royal rude ruin rule ruler rumor rural rush rust rune rung " +
  "sack safe sage said sail saint sake sale salt same sand sane satin sauce save scale scar scare scene scent scope score scout scrub seal seam search seat seed seek seem seen seize self sell send sense serf serve setup seven sever shade shake shall shame shape share shark sharp shave shawl shear shed sheen sheer sheet shelf shell shift shine shire shirt shock shoe shone shook shore short shout shove shown shred shrub shrug shut sick side siege sight sign silk silly since sing sink sire site sixth sixty size skate skill skin skip skull slab slain slant slash slate slave sleep sleet slew slice slick slide slim sling slink slip slit slope slow slug slump slung slur smart smell smelt smile smite smith smoke snack snail snake snare sneak sneer snore snout solar sole solid solve some song soon sore sort soul sound south space spare spark spawn speak spear speed spend spent spice spike spill spine spirit spit split spoke spoon sport spray spree spur squad stab stack staff stage stain stair stake stale stalk stall stamp stand stare stark start state stave stays steal steam steel steep steer stern stick stiff still sting stink stint stir stock stoke stone stood stool stoop store stork storm story stout stove strap straw stray strewn stride strife strike strip strive strode stroke stroll strong strove struck strung strut stuck stuff stump stung stunk style suite surge swamp swarm swear sweep sweet swept swift swirl swing swipe swore sword sworn swung " +
  "table tack taken tale talk tame tang tank tape tart task taste taunt teach teeth tempo tempt tenant tend tenor tense tent tenth tepid term terms terra test text than theft their theme thick thief thigh thing think third thorn those three threw thrill throb throne throng throw thrust thud thumb tiger tight tile till tilt timber time timid tine tinge tint tiny tire tired title toast today token told toll tone took tool tooth torch total touch tough tour tower town toxic trace track trade trail train trait tramp trance trap trash tread treat trend trial tribe trick tried trill trim trio trite trod troop troth trout truck truly trump trunk trust truth tumor tune tunic tunnel turn tutor tweed twice twine twirl twist type " +
  "udder ultra unable uncle under undid undue unfed unfit union unite unity until untie upper upset urban usher using usual utter " +
  "vague valid value valve vapor vault veil vein velvet vent venue verse vigor villa vine viral virus visit visor vital vivid vocal voice voter vouch " +
  "wade wager wages waist wait wake walk wall wand wane ward warm warn warp wart waste watch water waver wheat wheel where which while whine whirl white whole whose widen width wield wild will wilt wince winch wind wine wing wipe wire wise wish witch woman women world worry worse worst worth would wound woven wrath wreck wring write wrong wrote " +
  "yacht yearn yeast yield young youth " +
  // Additional common words for better Spelling Bee coverage
  "abut aced acme acne adore aloe amend amid ashen atoll avid " +
  "balm bask baton beady begun belie belle berth bevel biome birch bland blare bored borne boxer braid brash brawl briar budge bunny " +
  "cadet canoe carat chafe chant charm chasm chewy chill chose cinch cited cleft comet comic covet cozy crate crawl creed creep crest crone crook crumb cubic " +
  "debar decal delve deter dingy dizzy dowdy drawl dread drown dumpy dwelt " +
  "elfin ensue envoy epoch erode ethic evade evict exert expel " +
  "feign fiend fiery filth finch flail flake flair flask flick flung foggy foray forte fount frail frill frisk frown frugal fully furor " +
  "gamut gauze giddy glaze glean glint gouge grail gravel grimy gripe guise " +
  "hazel hefty heron hitch hoard homer hover humid husky " +
  "icing incur inlay " +
  "jaunt jazzy joker jumbo " +
  "kayak kebab kudos " +
  "laden ladle lanky lapse leach leafy leaky leash ledge lilac lofty lucid lumpy lunge lurch lusty lyric " +
  "macho mange mealy medic melee merry messy mince mocha moldy moose motto muggy " +
  "newly niche nickel niece notch nudge " +
  "oaken occur optic outdo " +
  "padre patio penal perky petty poach poker posse prank prawn prima proxy psalm " +
  "quack quell " +
  "rabid rainy regal ripen rivet rodeo rouge rowdy rumba rusty " +
  "savor scald scone scoop scorn sedan sheik siren sober sonic spank spore squid stank stash steed swoop " +
  "talon theta thong thump triad truce tweak " +
  "unlit " +
  "venom verge voila " +
  "waltz windy witty woken wreak " +
  "zoned " +
  // Common 4-letter words essential for Spelling Bee
  "cite core cure dale dose dote dove dram dusk emit fade fern flop foam fork foul fowl garb germ gild gilt gist glee glib glum gnaw gore grim grit guru " +
  "haze helm herd hewn hint hose hull icon isle jade jamb jeer jolt keen keel kelp lair lame laud lava lawn leer liar lieu lily lobe loom loot loom lush " +
  "mare mesa mice mire mite mock molt murk muse narc nick nook noun null oafs oath ogle oink omen opal orca oval pace pact pang pare peat peel pelt perk pier plop ploy poke poll pomp prep prey prod prop prow puff pulp puma purr " +
  "raft reed reel reek rely rice rick rile rind rode romp rote rout rove runt sage sank sash scab seep sham shim shin sift silk silt sine slab slag sled slew slim slob slot slug snag snip snub soap soar sock soda sole soma span spec sped spin spot spry stag stem step stew stub stud sway " +
  "taco tame tarp taut tear teem thaw tick tidy toil tomb tote tout trek trim trot true tuck tuft tusk " +
  "undo unit upon user " +
  "vane vary vast veer vial vice vine volt vow " +
  "wane ware wary wean wear weed weep weld well welt wick wiki wilt wiry woke womb wore worm worn wove wrap " +
  "yank yawn zero zinc zone " +
  // 5-6 letter words for richer puzzles
  "abode adapt adept admit adobe agony ample angel annoy anvil atone " +
  "basin batch begun berth bloom blunt bogus bonus borax bough bower brave " +
  "canal caper cedar cigar clasp cleft climb clink cobra comet coral couch crane cream crisp croak crock cross cumin " +
  "decor demon detox digit dowel drape dread drone drool drown " +
  "eager elbow ember evade exile " +
  "feast fiend flare flaunt flesh flint flora floss foyer frail freak frost " +
  "gauge ghost glare gleam globe gnome gourd grasp grief groan grove " +
  "haven heist heron hover " +
  "index ivory " +
  "lance lemon liner linen llama lofty lucid " +
  "manor marsh media merit miser moist moral motel motor mourn mulch " +
  "nerve noble notch novel " +
  "onset optic orbit otter outdo " +
  "panel paste pause peach pearl pedal penal perch plaid plume plunk poker porch pouch pound prawn pride prime prism prize prowl prune " +
  "quaint quake qualm quest " +
  "rapid resin rigor rinse robin rover royal rumor " +
  "salon savor scare scold scorn scout shawl sheik shelf shire shrub siege siren skull slope smart smear snail sneer snore solar spade spear spine splat spore squad stain stale stank steam stern stiff stock stomp stone storm stove stray strew strum swamp swell swoop " +
  "talon tease tempo theft thorn tiger toast torch tower trace train trash tread tribe troop trout trump tunic " +
  "ultra union untie urban " +
  "vault vigor voila voter " +
  "waltz wheat widen wield windy witch " +
  "yearn yield " +
  // Common short words frequently tried in Spelling Bee
  "arch area aria aunt axle " +
  "bait balm bang bark barn bass bask bead beam bell bile boil bolt bone bore bout brew bulb bunk bust " +
  "calm cape carp cart char clad clam clan claw clip coal coax coil colt comb cone cope cork cove crab crib crop crow cube cult curb curl " +
  "damp dash dawn daze deck deem deft deny dice dime dint dock dome dose doze drab drip drum dual dusk " +
  "ease etch euro " +
  "fame feat fern feud figs film flab flex foal foam foil fond fork foul fowl fray frog fume fund furl " +
  "gait garb gash gasp gaze germ gill gist glue gnat goat gone gown grit grub gulp guru gust " +
  "hail halt hare hash hasp hawk heap helm herd hewn hoax hone hoof hoop horn hose howl hulk hump hurl " +
  "jolt jest jilt jive " +
  "kelp kern knob " +
  "lame lava lawn leer lieu limb lime lint lobe loft loom loot lore lurk " +
  "mail malt mare maze meal mica mild mire mitt moat mock molt mood moor mope muck mule murk " +
  "nick nook noun " +
  "oath ogle omen only opal orca oval " +
  "palm pang pare pave peal peat pelt perk pier pine plop ploy plum poke poll pomp pork prep prey prod prop prow pulp puma purr " +
  "rack ramp rash reed reek rein rely rice rick rift rile roam rode romp rote rout rove rung runt ruse " +
  "sane sash scab scan scar seal seam seep sham shin sift silk silt sine slab slag sled slew slim slob slot snag snip snub sock sole soma span spec sped spin spit spot spry stab stag stem step stew stub stud sulk sway " +
  "taco tame tang tarp taut tear teem thaw tick tidy toil tomb tone tore tote tout trek trim trod trot tuck tuft tusk twit " +
  "undo unit urge " +
  "vane vary vast veer vial vice vine volt vow " +
  "wade wane ware wary wean weep weld welt wick wiki wilt wiry woke womb wore worm wove wrap writ " +
  "yank yawn zero zinc zone " +
  // Extra common words for better coverage
  "arid avow balm barb brim brisk bump burp camp cask clad clan clap clip coal cock colt comb coop cope cork coup cozy crab crib crop crow cuff cult curb " +
  "darn deaf deft deny dial doll dose drag drip dusk " +
  "fawn fern feud figs flab flex fond frog fume funk furl " +
  "gait gash gasp gill goat gown grit grub gulp gush " +
  "hasp herd hewn hoax hoof hoop hulk " +
  "idol jilt kelp kern kiln knit " +
  "laud lava lawn levy limb lion lobe loom loot lurk " +
  "mare mesa mild mitt mock moat molt monk mood murk " +
  "nick nook noun " +
  "oath ogle omen opal orca " +
  "palm pang pare pave pelt perk pier plop ploy plum poke poll pomp prep prey prod prop prow pulp purr " +
  "ramp rash reek rein rice rick rift rile romp rote rout rove rung runt " +
  "sash scab scan scar seam seep sham shin sift silt slam slab slag sled slew slim slob slot snag snip snub sock soma span spec sped spit spot spry stab stag stem step stew stub stud sulk " +
  "taco tang tarp taut teem thaw tick tidy toil tomb tore tote tout trek trod trot tuck tuft tusk twit " +
  "undo urge " +
  "vane vary vast veer vial vice vine volt " +
  "wade wane ware wary wean weep weld welt wick wilt wiry woke womb worm wove writ " +
  "yank yawn zinc zone " +
  // Longer words for pangram potential
  "abolish abstain auction blanket cabinet capture certain chapter climate coaster combine compact compute consent contain curtain delight dolphin embrace fashion freight glacier halting hosting imagine jesting kingdom lacking lobster monster organic parking plaster quarter rebirth reprise roaming scatter shelter shorten slither smother strange trading turbine undergo vaulted wasting " +
  // Words for harder letter sets
  "hind idol lion lipid livid polio polish plod nylon plain plaid rapid rapid gripe grimy grainy " +
  "malice italic recital article climate militia digital capital criminal criminal partial"
).split(/\s+/).filter(Boolean));
export const DICTIONARY = [..._DICT_SET];

// ── Spelling Bee pangram seeds (7 unique letters each) ──

export interface PangramSeed {
  letters: string[];
  center: string;
}

export const PANGRAM_SEEDS: PangramSeed[] = [
  { letters: ["s","t","r","a","n","g","e"], center: "a" },
  { letters: ["d","o","l","p","h","i","n"], center: "i" },
  { letters: ["b","l","a","n","k","e","t"], center: "e" },
  { letters: ["c","h","a","p","t","e","r"], center: "a" },
  { letters: ["c","l","i","m","a","t","e"], center: "i" },
  { letters: ["d","e","l","i","g","h","t"], center: "e" },
  { letters: ["f","l","a","m","i","n","g"], center: "a" },
  { letters: ["f","r","e","i","g","h","t"], center: "e" },
  { letters: ["h","a","l","t","i","n","g"], center: "a" },
  { letters: ["j","e","s","t","i","n","g"], center: "e" },
  { letters: ["k","i","n","g","d","o","m"], center: "i" },
  { letters: ["l","a","c","k","i","n","g"], center: "a" },
  { letters: ["m","o","n","s","t","e","r"], center: "e" },
  { letters: ["o","r","g","a","n","i","c"], center: "a" },
  { letters: ["p","a","r","k","i","n","g"], center: "a" },
  { letters: ["r","e","p","l","a","y","s"], center: "a" },
  { letters: ["s","c","o","r","i","n","g"], center: "i" },
  { letters: ["t","r","a","d","i","n","g"], center: "a" },
  { letters: ["b","u","i","l","d","e","r"], center: "e" },
  { letters: ["c","u","r","t","a","i","n"], center: "a" },
  { letters: ["g","l","a","c","i","e","r"], center: "a" },
  { letters: ["j","o","u","r","n","a","l"], center: "a" },
  { letters: ["l","o","b","s","t","e","r"], center: "e" },
  { letters: ["t","u","r","b","i","n","e"], center: "e" },
  { letters: ["v","a","u","l","t","e","d"], center: "a" },
  { letters: ["w","a","s","t","i","n","g"], center: "a" },
  { letters: ["h","o","s","t","i","n","g"], center: "i" },
  { letters: ["c","r","a","f","t","i","n"], center: "a" },  // CRAFTIN (crafting minus g for unique 7)
  { letters: ["s","h","i","e","l","d","r"], center: "e" },  // from SHIELDER
  { letters: ["m","a","r","k","e","t","s"], center: "a" },
];

// ── Mini Crossword puzzles (3x3 grids) ──

export interface MiniPuzzle {
  grid: [string, string, string];
  across: [string, string, string];
  down: [string, string, string];
}

export const CROSSWORD_PUZZLES: MiniPuzzle[] = [
  { grid: ["BAT","AGO","MEN"], across: ["Flying mammal","In the past","Plural of man"], down: ["Loud sound","Historical period","Unit of weight"] },
  { grid: ["LAP","AGO","BET"], across: ["Circuit of a track","Long time back","Wager"], down: ["Science room","How old you are","Cooking vessel"] },
  { grid: ["BOW","AWE","RED"], across: ["Ribbon knot","Amazement","Color of roses"], down: ["Drinking spot","Be in debt","Married"] },
  { grid: ["SAW","OWE","BED"], across: ["Cutting tool","Be indebted","Place to sleep"], down: ["Cry loudly","Wonder","Married"] },
  { grid: ["DOG","IRE","MET"], across: ["Man's best friend","Anger","Encountered"], down: ["Faint or dark","Mineral rock","Fetch"] },
  { grid: ["FOG","IRE","NET"], across: ["Thick mist","Wrath","Fishing mesh"], down: ["Shark's appendage","Mineral deposit","Acquire"] },
  { grid: ["HOG","IRE","PET"], across: ["Greedy eater","Fury","Stroke gently"], down: ["Trendy joint","Mineral rock","Acquire"] },
  { grid: ["GAP","IRE","NET"], across: ["Opening","Rage","Basketball hoop part"], down: ["Juniper spirit","Exist as","Stroke an animal"] },
  { grid: ["TAP","IRE","NET"], across: ["Faucet","Temper","Snare"], down: ["Tin metal","Exist","Domestic animal"] },
  { grid: ["HOT","ALE","DEN"], across: ["High temperature","Beer type","Study room"], down: ["Owned before","Exclamation","Number after nine"] },
  { grid: ["GOT","ALE","PEN"], across: ["Received","Brewery drink","Writing tool"], down: ["Opening","Spanish cheer","Number 10"] },
  { grid: ["NAB","OLE","WET"], across: ["Catch quickly","Spanish hooray","Soaked"], down: ["At this time","Type of beer","Place a wager"] },
  { grid: ["DAB","OLE","NET"], across: ["Light touch","Bravo!","Internet"], down: ["Put on (clothes)","Type of beer","Place a wager"] },
  { grid: ["HAT","AGO","MEN"], across: ["Head covering","Previously","Guys"], down: ["Pork cut","Historical period","2000 pounds"] },
  { grid: ["CAT","AGO","PEN"], across: ["Feline","In the past","Ink tool"], down: ["Baseball hat","How old","2000 lbs"] },
  { grid: ["MAT","AGO","PEN"], across: ["Floor covering","Earlier","Enclosure"], down: ["Chart","Historical period","2000 lbs"] },
  { grid: ["DOT","IRE","MEN"], across: ["Small spot","Annoyance","Males"], down: ["Faint","Mineral rock","A decade"] },
  { grid: ["RAT","AGO","PET"], across: ["Rodent","Time past","Companion animal"], down: ["Music genre","How old","Small child"] },
  { grid: ["LAB","OLE","PET"], across: ["Experiment room","Olé!","Furry friend"], down: ["Cut off","Type of ale","Wager"] },
  { grid: ["SAT","AGO","PEN"], across: ["Took a seat","Back then","Ballpoint"], down: ["Tree fluid","Historical period","2000 lbs"] },
];
