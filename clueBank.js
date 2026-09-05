/* ============================================================
   CLUE BANK — Game 4 (Pattern / Word-Chain Recognition)
   Owner: Person 4 (Mokshita)

   Shape (one entry per object):
   {
     object: string,        // the correct answer, as shown on the button
     clues: string[5],      // ordered vague -> specific
     distractors: string[3] // same-category wrong options, for MCQ scaling
   }

   Objects were chosen to be everyday, familiar items for an older
   patient in a home/village setting (matches Patient.region_village
   and the Bhashini language-pref field in CONTRACTS.md) rather than
   abstract or culturally narrow items. Translate `object` and `clues`
   per patient.language_pref before display — this file holds the
   English source strings.
   ============================================================ */

export const CLUE_BANK = [
  {
    object: "Umbrella",
    clues: [
      "You reach for this when the sky changes.",
      "It stays folded up most of the year.",
      "It opens wide to keep you dry.",
      "You hold its handle above your head.",
      "It has ribs of metal and a curved canopy of cloth.",
    ],
    distractors: ["Raincoat", "Sun hat", "Poncho"],
  },
  {
    object: "Kettle",
    clues: [
      "It sits quietly in the kitchen until needed.",
      "Something inside it starts to move when it warms up.",
      "It makes a whistling or clicking sound when ready.",
      "You pour hot water out of its spout.",
      "You fill it to make tea in the morning.",
    ],
    distractors: ["Saucepan", "Thermos", "Pressure cooker"],
  },
  {
    object: "Bicycle",
    clues: [
      "You find this outside, not indoors.",
      "It needs balance to use well.",
      "It has two of something, not four.",
      "You push down with your feet to make it move.",
      "It has handlebars, pedals, and a bell.",
    ],
    distractors: ["Scooter", "Rickshaw", "Tricycle"],
  },
  {
    object: "Comb",
    clues: [
      "It's small enough to fit in a pocket.",
      "You use it in front of a mirror.",
      "It has many thin teeth in a row.",
      "You pull it through something on your head.",
      "It tidies your hair before you go out.",
    ],
    distractors: ["Hairbrush", "Mirror", "Hairpin"],
  },
  {
    object: "Lantern",
    clues: [
      "You notice this more when it gets dark.",
      "It has been used for hundreds of years.",
      "It holds a flame or a bulb inside glass.",
      "You carry it by a handle on top.",
      "It lights the path during a power cut.",
    ],
    distractors: ["Candle", "Torch", "Diya"],
  },
  {
    object: "Spoon",
    clues: [
      "It's on the table at every meal.",
      "It comes in different sizes for different foods.",
      "It has a handle and a shallow curve at one end.",
      "You dip it into a bowl or cup.",
      "You use it to eat dal or stir your tea.",
    ],
    distractors: ["Fork", "Ladle", "Knife"],
  },
  {
    object: "Clock",
    clues: [
      "It's on the wall in almost every home.",
      "It never seems to stop moving.",
      "It has a face you glance at often.",
      "Its hands sweep round in a circle.",
      "It tells you it's time for lunch.",
    ],
    distractors: ["Calendar", "Watch", "Timer"],
  },
  {
    object: "Broom",
    clues: [
      "It leans quietly in a corner.",
      "It's used early in the morning, often outdoors too.",
      "It has bristles bunched at one end.",
      "You sweep it side to side across the floor.",
      "It clears dust and leaves from the courtyard.",
    ],
    distractors: ["Mop", "Dustpan", "Duster"],
  },
  {
    object: "Radio",
    clues: [
      "It used to sit in the center of the living room.",
      "You don't watch it, you listen to it.",
      "It has a dial or buttons for stations.",
      "Voices and songs come out of it.",
      "You turn its knob to hear the morning news.",
    ],
    distractors: ["Television", "Gramophone", "Tape recorder"],
  },
  {
    object: "Basket",
    clues: [
      "It goes with you to the market.",
      "It's woven, not solid.",
      "It has a handle so you can swing it.",
      "It carries vegetables, fruit, or flowers.",
      "You fill it up at the vegetable seller's cart.",
    ],
    distractors: ["Bag", "Crate", "Sack"],
  },
  {
    object: "Pillow",
    clues: [
      "It waits for you at the end of the day.",
      "It's soft, never hard.",
      "It has a cover you can change and wash.",
      "You rest your head on it.",
      "It's on the bed, under your cheek at night.",
    ],
    distractors: ["Blanket", "Mattress", "Cushion"],
  },
  {
    object: "Mirror",
    clues: [
      "You stand in front of it every day.",
      "It doesn't speak, but it shows you something.",
      "It's flat and made of glass.",
      "It shows your reflection back at you.",
      "You check your hair or face in it before leaving.",
    ],
    distractors: ["Photo frame", "Window", "Comb"],
  },
  {
    object: "Key",
    clues: [
      "It's small enough to lose easily.",
      "You keep it close, maybe on a ring.",
      "It's made of metal with ridges cut into it.",
      "It fits into one particular lock.",
      "You turn it to open your front door.",
    ],
    distractors: ["Lock", "Latch", "Padlock"],
  },
  {
    object: "Candle",
    clues: [
      "It's kept aside for when the lights go out.",
      "It slowly grows shorter as it's used.",
      "It has a wick running through its middle.",
      "You light it with a match or a flame.",
      "Its wax drips as it burns beside your bed.",
    ],
    distractors: ["Lantern", "Diya", "Torch"],
  },
  {
    object: "Hand fan",
    clues: [
      "You reach for this on a hot afternoon.",
      "It doesn't need electricity.",
      "It's flat and light, easy to carry.",
      "You move your wrist back and forth with it.",
      "You wave it in front of your face for a breeze.",
    ],
    distractors: ["Ceiling fan", "Table fan", "Newspaper"],
  },
  {
    object: "Chair",
    clues: [
      "It's found in almost every room.",
      "It doesn't move around on its own.",
      "It has legs, but it never walks.",
      "It's made to hold your weight comfortably.",
      "You sit down on it at the dinner table.",
    ],
    distractors: ["Stool", "Bench", "Sofa"],
  },
  {
    object: "Blanket",
    clues: [
      "You want this more in winter than summer.",
      "It's kept folded at the foot of the bed.",
      "It's soft and made of thick woven cloth.",
      "You pull it up and over yourself.",
      "It keeps you warm while you sleep.",
    ],
    distractors: ["Shawl", "Pillow", "Bedsheet"],
  },
  {
    object: "Bucket",
    clues: [
      "It's kept near the tap or well.",
      "It's hollow, meant to hold something.",
      "It has a handle across the top.",
      "You carry it when it's full of water.",
      "You use it to bathe or fill the water pot.",
    ],
    distractors: ["Mug", "Water pot", "Tub"],
  },
  {
    object: "Slippers",
    clues: [
      "They wait for you by the door.",
      "You never wear just one.",
      "They're loose, easy to slip on and off.",
      "They protect your feet from the cold floor.",
      "You step into them first thing in the morning.",
    ],
    distractors: ["Sandals", "Shoes", "Socks"],
  },
  {
    object: "Scissors",
    clues: [
      "It's kept somewhere safe, out of reach of children.",
      "It works in pairs, joined at the middle.",
      "It has two sharp blades that cross over.",
      "You squeeze the handles together to use it.",
      "You use it to cut cloth or paper cleanly.",
    ],
    distractors: ["Knife", "Blade", "Nail cutter"],
  },
  {
    object: "Needle",
    clues: [
      "It's tiny and easy to misplace.",
      "It's kept with a spool of something.",
      "It's thin, sharp, with a small hole at one end.",
      "Thread is passed through that hole.",
      "You use it to stitch a torn shirt.",
    ],
    distractors: ["Pin", "Thread", "Safety pin"],
  },
  {
    object: "Diya",
    clues: [
      "It's brought out especially during festivals.",
      "It's small, made of clay or metal.",
      "It holds oil and a small cotton wick.",
      "Its flame flickers gently in the breeze.",
      "You light a row of them for Diwali.",
    ],
    distractors: ["Candle", "Lantern", "Lamp"],
  },
  {
    object: "Prayer bell",
    clues: [
      "It's kept in a quiet corner of the house.",
      "You use it without saying a word.",
      "It's made of brass or bronze.",
      "It rings out during morning worship.",
      "You shake it gently in front of the prayer altar.",
    ],
    distractors: ["Temple bell", "Conch shell", "Cymbals"],
  },
  {
    object: "Newspaper",
    clues: [
      "It arrives at your door early in the day.",
      "It's meant to be read once, then set aside.",
      "It's made of thin sheets of paper.",
      "It's folded and full of small print.",
      "You read it with your morning tea.",
    ],
    distractors: ["Magazine", "Letter", "Calendar"],
  },
  {
    object: "Photo frame",
    clues: [
      "It sits still on a shelf or wall.",
      "It holds onto a single moment.",
      "It's often made of wood or metal with glass.",
      "It holds a picture of someone you love.",
      "It shows a photo of your family from years ago.",
    ],
    distractors: ["Mirror", "Calendar", "Painting"],
  },
  {
    object: "Water pot",
    clues: [
      "It's kept in a cool corner of the kitchen.",
      "It's round and made of clay.",
      "It keeps what's inside naturally cool.",
      "It has a narrow neck and a wide belly.",
      "You pour water from it into a glass, matka-style.",
    ],
    distractors: ["Bucket", "Jug", "Bottle"],
  },
  {
    object: "Rolling pin",
    clues: [
      "It's kept near the flour, not far from the stove.",
      "It works together with a flat wooden board.",
      "It's a smooth wooden cylinder.",
      "You roll it back and forth with both hands.",
      "You use it to flatten dough into a round roti.",
    ],
    distractors: ["Ladle", "Spatula", "Whisk"],
  },
  {
    object: "Sieve",
    clues: [
      "It's used before something goes into the pan.",
      "It looks a little like a small basket.",
      "It's made of metal mesh stretched over a rim.",
      "Fine things pass through, bigger things stay behind.",
      "You use it to strain tea leaves from your chai.",
    ],
    distractors: ["Strainer", "Colander", "Filter"],
  },
  {
    object: "Mortar and pestle",
    clues: [
      "It's older than most gadgets in the kitchen.",
      "It comes as a pair, always used together.",
      "One piece is a bowl, the other a heavy stick.",
      "You press and turn the stick against the bowl.",
      "You crush spices in it before adding them to the curry.",
    ],
    distractors: ["Grinder", "Blender", "Rolling pin"],
  },
  {
    object: "Sewing machine",
    clues: [
      "It sits by the window for good light.",
      "It has a wheel you turn or a pedal you press.",
      "It has a needle that moves up and down fast.",
      "It pulls thread through cloth in a straight line.",
      "You use it to stitch a new blouse or hem a saree.",
    ],
    distractors: ["Needle", "Iron", "Scissors"],
  },
  {
    object: "Walking stick",
    clues: [
      "It goes wherever you go, once you need it.",
      "It's long and thin, taller than a shoe.",
      "It has a curved handle at the top.",
      "You lean your weight onto it as you walk.",
      "It steadies you on the way to the temple.",
    ],
    distractors: ["Cane", "Crutch", "Umbrella"],
  },
  {
    object: "Shawl",
    clues: [
      "You reach for this as the evening turns cool.",
      "It's soft, wide, and easy to fold.",
      "It's woven from wool or fine cotton.",
      "You wrap it around your shoulders.",
      "You drape it over yourself on a winter evening.",
    ],
    distractors: ["Blanket", "Scarf", "Sweater"],
  },
  {
    object: "Torch",
    clues: [
      "It's kept in a drawer, ready for emergencies.",
      "It runs on batteries, not on flame.",
      "It's small enough to hold in one hand.",
      "It sends out a narrow, bright beam of light.",
      "You switch it on when the power goes out at night.",
    ],
    distractors: ["Lantern", "Candle", "Mobile phone"],
  },
  {
    object: "Thermos flask",
    clues: [
      "It travels with you sometimes, not just kept at home.",
      "It's shaped a little like a bottle.",
      "It has two walls with a gap in between.",
      "It keeps what's inside hot for hours.",
      "You pour tea into it before a long train journey.",
    ],
    distractors: ["Kettle", "Water bottle", "Flask"],
  },
  {
    object: "Almirah",
    clues: [
      "It's one of the biggest things in the room.",
      "It doesn't move once it's placed.",
      "It has doors that swing open.",
      "It has shelves and a rod for hanging things.",
      "You hang your sarees and shirts inside it.",
    ],
    distractors: ["Chest of drawers", "Trunk", "Cupboard"],
  },
  {
    object: "Ceiling fan",
    clues: [
      "You notice this by looking up, not down.",
      "It stays fixed to one spot.",
      "It has blades that spin in a circle.",
      "It needs a switch on the wall to work.",
      "It turns overhead and cools the whole room.",
    ],
    distractors: ["Hand fan", "Table fan", "Cooler"],
  },
  {
    object: "Doorbell",
    clues: [
      "You never see it used, only heard.",
      "It's fixed near the entrance of the house.",
      "It's small, usually just a single button.",
      "Pressing it sends a sound through the house.",
      "A visitor presses it and you hear a ring inside.",
    ],
    distractors: ["Door knocker", "Telephone", "Alarm"],
  },
  {
    object: "Calendar",
    clues: [
      "It's replaced once a year, not more.",
      "It hangs flat against the wall.",
      "It's made of paper with numbers printed on it.",
      "Each page shows one month at a time.",
      "You circle the date of a birthday or festival on it.",
    ],
    distractors: ["Clock", "Newspaper", "Diary"],
  },
  {
    object: "Bangles",
    clues: [
      "They come in a set, not just one.",
      "They make a small sound when you move.",
      "They're round, worn on your arm.",
      "They can be glass, metal, or plastic.",
      "You slide them onto your wrist before a wedding.",
    ],
    distractors: ["Rings", "Bracelet", "Anklet"],
  },
  {
    object: "Tiffin box",
    clues: [
      "It goes out of the house and comes back empty.",
      "It's made of steel, stacked in layers.",
      "It's held together by a clasp at the top.",
      "Each layer holds a different dish.",
      "You carry your lunch in it to work or school.",
    ],
    distractors: ["Lunch bag", "Container", "Basket"],
  },
];
