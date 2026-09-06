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
      "You carry this outside when rain is falling.",
      "It folds into a narrow bundle when you are done.",
      "It opens above you to make a dry space.",
      "You hold its handle above your head.",
      "It has ribs of metal and a curved canopy of cloth.",
    ],
    distractors: ["Rain boots", "Winter coat", "Sun hat"],
  },
  {
    object: "Kettle",
    clues: [
      "You put water in this on the kitchen stove.",
      "It has a handle on one side and a spout.",
      "Steam or a whistle tells you the water is hot.",
      "You pour hot water out of its spout.",
      "You fill it to make tea in the morning.",
    ],
    distractors: ["Frying pan", "Rice cooker", "Mixing bowl"],
  },
  {
    object: "Bicycle",
    clues: [
      "You ride this along a road or village path.",
      "You sit on a seat and hold two handlebars.",
      "Your feet push two pedals to move it forward.",
      "You push down with your feet to make it move.",
      "It has handlebars, pedals, and a bell.",
    ],
    distractors: ["Motorcycle", "Cart", "Wheelbarrow"],
  },
  {
    object: "Comb",
    clues: [
      "You keep this small grooming tool near a mirror.",
      "It is flat and has a row of short teeth.",
      "You pull those teeth through your hair.",
      "You pull it through something on your head.",
      "It tidies your hair before you go out.",
    ],
    distractors: ["Toothbrush", "Nail brush", "Clothes brush"],
  },
  {
    object: "Lantern",
    clues: [
      "You carry this when a dark path needs light.",
      "It has a light inside a protective outer cover.",
      "A handle lets you carry it from room to room.",
      "You carry it by a handle on top.",
      "It lights the path during a power cut.",
    ],
    distractors: ["Flashlight", "Street lamp", "Headlamp"],
  },
  {
    object: "Spoon",
    clues: [
      "You lift this from a plate or bowl to eat.",
      "It has one long handle and one rounded bowl.",
      "Its shallow bowl holds a small amount of food or drink.",
      "You dip it into a bowl or cup.",
      "You use it to eat dal or stir your tea.",
    ],
    distractors: ["Chopsticks", "Plate", "Cup"],
  },
  {
    object: "Clock",
    clues: [
      "You look at this to know the time of day.",
      "It has numbers arranged around a round face.",
      "Hands point to the hour and minute.",
      "Its hands sweep round in a circle.",
      "It tells you it's time for lunch.",
    ],
    distractors: ["Calendar", "Thermometer", "Picture frame"],
  },
  {
    object: "Broom",
    clues: [
      "You hold this to clean dust from the floor.",
      "A long handle lets you sweep without bending much.",
      "Many stiff bristles spread out at one end.",
      "You sweep it side to side across the floor.",
      "It clears dust and leaves from the courtyard.",
    ],
    distractors: ["Garden rake", "Watering can", "Clothes hanger"],
  },
  {
    object: "Radio",
    clues: [
      "You place this on a table to hear news or music.",
      "It has a speaker but no screen for pictures.",
      "A dial or buttons change the station.",
      "Voices and songs come out of it.",
      "You turn its knob to hear the morning news.",
    ],
    distractors: ["Television", "Loudspeaker", "Mobile phone"],
  },
  {
    object: "Basket",
    clues: [
      "You carry this to bring vegetables home from the market.",
      "It is an open container with sides and a bottom.",
      "Woven strips make its sides easy to see through.",
      "It carries vegetables, fruit, or flowers.",
      "You fill it up at the vegetable seller's cart.",
    ],
    distractors: ["Suitcase", "Metal tray", "Shopping trolley"],
  },
  {
    object: "Pillow",
    clues: [
      "You place this at the head of a bed.",
      "It is a small soft rectangle filled with cotton or foam.",
      "A removable cover keeps it clean.",
      "You rest your head on it.",
      "It's on the bed, under your cheek at night.",
    ],
    distractors: ["Bedside table", "Towel", "Stuffed toy"],
  },
  {
    object: "Mirror",
    clues: [
      "You hang or place this where you can see your face.",
      "Its shiny surface reflects the person standing in front of it.",
      "It is a flat glass panel with a frame.",
      "It shows your reflection back at you.",
      "You check your hair or face in it before leaving.",
    ],
    distractors: ["Painting", "Curtain", "Bookshelf"],
  },
  {
    object: "Key",
    clues: [
      "You carry this to open a locked door.",
      "It is a small metal object kept on a ring.",
      "One end has ridges shaped for a particular lock.",
      "It fits into one particular lock.",
      "You turn it to open your front door.",
    ],
    distractors: ["Coin", "Button", "Bottle opener"],
  },
  {
    object: "Candle",
    clues: [
      "You place this on a plate or holder when there is no electricity.",
      "It is a short stick of wax with a thread down the middle.",
      "A flame burns at the top and makes the wax shorter.",
      "You light it with a match or a flame.",
      "Its wax drips as it burns beside your bed.",
    ],
    distractors: ["Matches", "Incense stick", "Oil lamp"],
  },
  {
    object: "Hand fan",
    clues: [
      "You hold this in your hand on a hot afternoon.",
      "It is a flat piece of paper, cloth, or palm leaf.",
      "Moving it back and forth makes air against your face.",
      "You move your wrist back and forth with it.",
      "You wave it in front of your face for a breeze.",
    ],
    distractors: ["Hand towel", "Book", "Plate"],
  },
  {
    object: "Chair",
    clues: [
      "You pull this out when you want to sit down.",
      "It has a raised seat and a back to support you.",
      "Four legs usually hold its seat above the floor.",
      "It's made to hold your weight comfortably.",
      "You sit down on it at the dinner table.",
    ],
    distractors: ["Bed", "Bookshelf", "Table"],
  },
  {
    object: "Blanket",
    clues: [
      "You spread this over yourself on a cold night.",
      "It is a large soft piece of thick cloth.",
      "You pull it from your feet up to your shoulders.",
      "You pull it up and over yourself.",
      "It keeps you warm while you sleep.",
    ],
    distractors: ["Curtain", "Tablecloth", "Towel"],
  },
  {
    object: "Bucket",
    clues: [
      "You carry this to collect water from a tap or well.",
      "It is a deep round container that stands on its flat bottom.",
      "A curved handle goes from one side to the other.",
      "You carry it when it's full of water.",
      "You use it to bathe or fill the water pot.",
    ],
    distractors: ["Flower pot", "Cooking pot", "Waste bin"],
  },
  {
    object: "Slippers",
    clues: [
      "You leave these beside the door for walking indoors or outside.",
      "Each one is shaped for one foot and has no laces.",
      "You slide your feet into them without opening a fastening.",
      "They protect your feet from the cold floor.",
      "You step into them first thing in the morning.",
    ],
    distractors: ["Boots", "Ballet shoes", "Leg warmers"],
  },
  {
    object: "Scissors",
    clues: [
      "You keep this in a drawer for cutting paper or cloth.",
      "Two metal arms join at one central screw.",
      "Finger holes open and close two blades.",
      "You squeeze the handles together to use it.",
      "You use it to cut cloth or paper cleanly.",
    ],
    distractors: ["Screwdriver", "Ruler", "Tweezers"],
  },
  {
    object: "Needle",
    clues: [
      "You keep this in a sewing box for repairing cloth.",
      "It is a very thin metal tool with one sharp point.",
      "A tiny hole near its blunt end holds thread.",
      "Thread is passed through that hole.",
      "You use it to stitch a torn shirt.",
    ],
    distractors: ["Toothpick", "Matchstick", "Sewing button"],
  },
  {
    object: "Diya",
    clues: [
      "You place this small lamp near a prayer space or festival decoration.",
      "It is a shallow clay or metal bowl.",
      "Oil sits inside it with a cotton wick at the edge.",
      "Its flame flickers gently in the breeze.",
      "You light a row of them for Diwali.",
    ],
    distractors: ["Incense holder", "Flower garland", "Matchbox"],
  },
  {
    object: "Prayer bell",
    clues: [
      "You keep this near a home prayer place.",
      "It is a small hanging metal bell with a handle or loop.",
      "You move it so its clapper makes a clear ring.",
      "It rings out during morning worship.",
      "You shake it gently in front of the prayer altar.",
    ],
    distractors: ["Drum", "Whistle", "Maraca"],
  },
  {
    object: "Newspaper",
    clues: [
      "This folded paper is delivered to your home in the morning.",
      "It has many pages filled with today's news.",
      "Large headlines and small printed stories cover its pages.",
      "It's folded and full of small print.",
      "You read it with your morning tea.",
    ],
    distractors: ["Recipe book", "Envelope", "School notebook"],
  },
  {
    object: "Photo frame",
    clues: [
      "You place this on a shelf or hang it on a wall.",
      "A flat picture fits inside its border.",
      "Glass protects the picture from dust.",
      "It holds a picture of someone you love.",
      "It shows a photo of your family from years ago.",
    ],
    distractors: ["Clock", "Vase", "Bookend"],
  },
  {
    object: "Water pot",
    clues: [
      "You keep drinking water in this at home.",
      "It is a round clay container with a wide belly.",
      "Its porous clay helps the water stay cool.",
      "It has a narrow neck and a wide belly.",
      "You pour water from it into a glass, matka-style.",
    ],
    distractors: ["Cooking pan", "Flower pot", "Umbrella stand"],
  },
  {
    object: "Rolling pin",
    clues: [
      "You use this beside the flour to make flat bread.",
      "It is a smooth wooden cylinder with handles or narrow ends.",
      "Rolling it presses dough flat on a board.",
      "You roll it back and forth with both hands.",
      "You use it to flatten dough into a round roti.",
    ],
    distractors: ["Rolling bottle", "Wooden spoon", "Kitchen tongs"],
  },
  {
    object: "Sieve",
    clues: [
      "You hold this over a bowl when you want to separate small pieces.",
      "It is a shallow round tool with a handle and many tiny holes.",
      "Flour or tea liquid passes through its mesh.",
      "Fine things pass through, bigger things stay behind.",
      "You use it to strain tea leaves from your chai.",
    ],
    distractors: ["Measuring cup", "Frying pan", "Serving tray"],
  },
  {
    object: "Mortar and pestle",
    clues: [
      "You use this pair to crush spices in the kitchen.",
      "The heavy bowl stays still while the hand tool moves inside it.",
      "One piece is a deep bowl and the other is a thick grinding club.",
      "You press and turn the stick against the bowl.",
      "You crush spices in it before adding them to the curry.",
    ],
    distractors: ["Cutting board", "Measuring jug", "Kitchen scale"],
  },
  {
    object: "Sewing machine",
    clues: [
      "You sit beside this machine when repairing clothes.",
      "A foot pedal or motor makes its wheel turn.",
      "A needle carries thread up and down through fabric.",
      "It pulls thread through cloth in a straight line.",
      "You use it to stitch a new blouse or hem a saree.",
    ],
    distractors: ["Typewriter", "Hair dryer", "Kitchen mixer"],
  },
  {
    object: "Walking stick",
    clues: [
      "You carry this when walking feels unsteady.",
      "It is a long single support that touches the ground.",
      "A handle near the top fits in your hand.",
      "You lean your weight onto it as you walk.",
      "It steadies you on the way to the temple.",
    ],
    distractors: ["Walking frame", "Fishing rod", "Broom"],
  },
  {
    object: "Shawl",
    clues: [
      "You wrap this around your shoulders when the air is cool.",
      "It is wider than a scarf but lighter than a blanket.",
      "A long rectangular piece of cloth folds over your upper body.",
      "You wrap it around your shoulders.",
      "You drape it over yourself on a winter evening.",
    ],
    distractors: ["Raincoat", "Apron", "Trousers"],
  },
  {
    object: "Torch",
    clues: [
      "You keep this in a drawer for a power cut.",
      "It is a handheld battery-powered light.",
      "Pressing its switch sends one narrow beam forward.",
      "It sends out a narrow, bright beam of light.",
      "You switch it on when the power goes out at night.",
    ],
    distractors: ["Alarm clock", "Remote control", "Hair dryer"],
  },
  {
    object: "Thermos flask",
    clues: [
      "You carry this when you want tea or coffee later.",
      "It is a tall bottle with a screw or press-on lid.",
      "Its double wall keeps a drink hot or cold for hours.",
      "It keeps what's inside hot for hours.",
      "You pour tea into it before a long train journey.",
    ],
    distractors: ["Lunch box", "Travel mug", "Glass jar"],
  },
  {
    object: "Almirah",
    clues: [
      "You open this tall cupboard to choose your clothes.",
      "It is usually made of metal and stands on the floor.",
      "Large doors hide shelves and a hanging rail inside.",
      "It has shelves and a rod for hanging things.",
      "You hang your sarees and shirts inside it.",
    ],
    distractors: ["Sofa", "Dining table", "Bookshelf"],
  },
  {
    object: "Ceiling fan",
    clues: [
      "You look up to see this fixed above a room.",
      "Several long blades turn around a central motor.",
      "A wall switch or pull cord starts its circular movement.",
      "It needs a switch on the wall to work.",
      "It turns overhead and cools the whole room.",
    ],
    distractors: ["Light bulb", "Ceiling lamp", "Roof beam"],
  },
  {
    object: "Doorbell",
    clues: [
      "You press this when you arrive at someone's front door.",
      "It is a small button fixed beside the entrance.",
      "Pressing it sends an electrical ringing sound indoors.",
      "Pressing it sends a sound through the house.",
      "A visitor presses it and you hear a ring inside.",
    ],
    distractors: ["Light switch", "Door handle", "Mail slot"],
  },
  {
    object: "Calendar",
    clues: [
      "You hang this where you can see dates and months.",
      "It has a different numbered page or section for each month.",
      "You use its boxes to mark birthdays, holidays, and appointments.",
      "Each page shows one month at a time.",
      "You circle the date of a birthday or festival on it.",
    ],
    distractors: ["Map", "Recipe book", "Wall painting"],
  },
  {
    object: "Bangles",
    clues: [
      "You wear these colourful rings of jewellery on your wrists.",
      "Several can slide together and make a soft clicking sound.",
      "Each narrow circle is open in the middle and has no clasp.",
      "They can be glass, metal, or plastic.",
      "You slide them onto your wrist before a wedding.",
    ],
    distractors: ["Earrings", "Necklace", "Hair clips"],
  },
  {
    object: "Tiffin box",
    clues: [
      "You carry this when taking food away from home.",
      "It is a metal box with one or more food containers inside.",
      "A lid or clasp keeps the lunch from spilling.",
      "Each layer holds a different dish.",
      "You carry your lunch in it to work or school.",
    ],
    distractors: ["Water bottle", "School backpack", "Serving plate"],
  },
];
