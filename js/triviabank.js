/* ---------- Trivia's auto questions ----------
   When a duck sends no question (or one that isn't valid), the game plays one of these instead. I want them at a college
   level: physics, calculus, computer science, history, neuroscience, English, and more (chemistry, biology, economics,
   statistics, philosophy, psychology, astronomy). They are always multiple choice, with one right answer.
   Each entry: [the question, [the answers], which one is right (left out: the first)]. The game shuffles the answers
   when it deals one, except a true or false question, which keeps True first. */
export const TV_BANK = [
  // physics
  ["What is the SI unit of force?", ["Newton", "Joule", "Watt", "Pascal"]],
  [
    "In an elastic collision, which quantity is conserved besides momentum?",
    [
      "Kinetic energy",
      "Temperature",
      "Each object's velocity",
      "Potential energy",
    ],
  ],
  [
    "Which particle carries the electromagnetic force?",
    ["The photon", "The gluon", "The W boson", "The graviton"],
  ],
  [
    "The speed of light in a vacuum is closest to:",
    ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "340 m/s"],
  ],
  [
    "About how fast do things accelerate when they fall near Earth's surface?",
    ["9.8 m/s²", "6.7 m/s²", "1.6 m/s²", "98 m/s²"],
  ],
  [
    "By the second law of thermodynamics, the entropy of an isolated system…",
    ["Never decreases", "Always stays the same", "Always decreases", "Is zero"],
  ],
  [
    "Ohm's law says voltage equals…",
    [
      "Current times resistance",
      "Current divided by resistance",
      "Power times current",
      "Resistance divided by current",
    ],
  ],
  [
    "Which of these cannot travel through a vacuum?",
    ["Sound", "Light", "Radio waves", "X-rays"],
  ],
  [
    "The uncertainty principle limits how precisely you can know both a particle's position and its…",
    ["Momentum", "Charge", "Rest mass", "Color"],
  ],
  ["What is the SI unit of capacitance?", ["Farad", "Henry", "Tesla", "Ohm"]],
  [
    "A ball is thrown straight up. At the very top of its path, its acceleration is…",
    ["9.8 m/s² downward", "Zero", "9.8 m/s² upward", "Growing every second"],
  ],
  [
    "What is the kinetic energy of a mass m moving at speed v?",
    ["½mv²", "mv", "mv²", "2mv"],
  ],
  [
    "True or false: sound travels faster in water than in air.",
    ["True", "False"],
  ],
  // calculus and math
  [
    "What is the derivative of sin(x)?",
    ["cos(x)", "−cos(x)", "−sin(x)", "tan(x)"],
  ],
  ["What is the derivative of eˣ?", ["eˣ", "x·eˣ⁻¹", "ln(x)", "1/x"]],
  ["What is the derivative of ln(x)?", ["1/x", "ln(x)/x", "eˣ", "x"]],
  ["What is the derivative of x³?", ["3x²", "x²", "3x³", "x⁴/4"]],
  [
    "What is the integral of 1/x dx?",
    ["ln|x| + C", "x²/2 + C", "−1/x² + C", "eˣ + C"],
  ],
  [
    "What is the limit of sin(x)/x as x goes to 0?",
    ["1", "0", "Infinity", "It doesn't exist"],
  ],
  [
    "What does the Fundamental Theorem of Calculus connect?",
    [
      "Derivatives and integrals",
      "Limits and series",
      "Vectors and matrices",
      "Primes and factors",
    ],
  ],
  [
    "What is the sum of 1 + 1/2 + 1/4 + 1/8 + … forever?",
    ["2", "1", "Infinity", "1.5"],
  ],
  [
    "By the product rule, the derivative of f·g is…",
    ["f′g + fg′", "f′g′", "f′g − fg′", "(f′g − fg′)/g²"],
  ],
  [
    "What is the derivative of a constant?",
    ["0", "1", "The constant itself", "It has none"],
  ],
  [
    "What is the integral of cos(x) dx?",
    ["sin(x) + C", "−sin(x) + C", "cos(x) + C", "tan(x) + C"],
  ],
  [
    "True or false: every continuous function is differentiable.",
    ["True", "False"],
    1,
  ],
  ["What is the median of 2, 3, 7, 9 and 10?", ["7", "6.2", "3", "9"]],
  [
    "A fair coin is flipped twice. What is the chance of two heads?",
    ["1/4", "1/2", "1/3", "1/8"],
  ],
  // computer science
  [
    "What is the worst-case time of binary search on a sorted list of n items?",
    ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
  ],
  [
    "Which data structure is first in, first out?",
    ["A queue", "A stack", "A binary tree", "A hash set"],
  ],
  [
    "Which data structure is last in, first out?",
    ["A stack", "A queue", "A heap", "A graph"],
  ],
  [
    "What does CPU stand for?",
    [
      "Central Processing Unit",
      "Computer Personal Unit",
      "Central Program Utility",
      "Core Processing Uplink",
    ],
  ],
  [
    "What is quicksort's average running time?",
    ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
  ],
  ["How many bits are in a byte?", ["8", "4", "16", "10"]],
  ["What is the binary number 1011 in decimal?", ["11", "13", "9", "10"]],
  [
    "Which problem did Alan Turing prove no algorithm can solve in general?",
    [
      "The halting problem",
      "The traveling salesman problem",
      "Sorting a list",
      "Finding shortest paths",
    ],
  ],
  [
    "On average, how long does a lookup in a hash table take?",
    ["O(1)", "O(n)", "O(log n)", "O(n²)"],
  ],
  [
    "Which traversal visits a binary search tree's keys in sorted order?",
    ["In-order", "Pre-order", "Post-order", "Level-order"],
  ],
  [
    "What does Dijkstra's algorithm find?",
    [
      "The shortest paths from one node",
      "The largest clique",
      "A topological order",
      "The strongly connected parts",
    ],
  ],
  ["What is 2 to the power of 10?", ["1024", "1000", "512", "2048"]],
  [
    "Which logic gate outputs true only when both of its inputs are true?",
    ["AND", "OR", "XOR", "NOR"],
  ],
  [
    "What does SQL mostly work with?",
    ["Relational databases", "Image files", "Network cables", "3D models"],
  ],
  [
    "In a recursive function, what stops the recursion?",
    ["A base case", "A loop counter", "A global variable", "A compiler flag"],
  ],
  // history
  ["In what year did World War I begin?", ["1914", "1918", "1939", "1905"]],
  [
    "Who was the first emperor of Rome?",
    ["Augustus", "Julius Caesar", "Nero", "Constantine"],
  ],
  [
    "In what year was the Magna Carta sealed?",
    ["1215", "1066", "1492", "1776"],
  ],
  [
    "After the West fell, which empire was ruled from Constantinople?",
    [
      "The Byzantine Empire",
      "The Holy Roman Empire",
      "The Mongol Empire",
      "The Persian Empire",
    ],
  ],
  [
    "In what year did the French Revolution begin?",
    ["1789", "1776", "1812", "1848"],
  ],
  [
    "Who wrote The Communist Manifesto with Friedrich Engels?",
    ["Karl Marx", "Vladimir Lenin", "Adam Smith", "Leon Trotsky"],
  ],
  [
    "Which civilization built Machu Picchu?",
    ["The Inca", "The Maya", "The Aztecs", "The Olmecs"],
  ],
  ["In what year did the Berlin Wall fall?", ["1989", "1991", "1961", "1975"]],
  [
    "Which treaty ended World War I between Germany and the Allies?",
    [
      "The Treaty of Versailles",
      "The Treaty of Westphalia",
      "The Treaty of Ghent",
      "The Treaty of Tordesillas",
    ],
  ],
  [
    "In what year was the U.S. Constitution signed?",
    ["1787", "1776", "1791", "1812"],
  ],
  [
    "When did the Black Death sweep through Europe?",
    ["The 1340s", "The 1540s", "The 1140s", "The 1740s"],
  ],
  [
    "Most of the Great Wall of China standing today was built under which dynasty?",
    ["The Ming", "The Qin", "The Han", "The Tang"],
  ],
  [
    "Who led India's independence movement with nonviolent resistance?",
    [
      "Mahatma Gandhi",
      "Subhas Chandra Bose",
      "Muhammad Ali Jinnah",
      "B. R. Ambedkar",
    ],
  ],
  [
    "Which battle in 1066 began the Norman conquest of England?",
    [
      "The Battle of Hastings",
      "The Battle of Agincourt",
      "The Battle of Waterloo",
      "The Battle of Bosworth",
    ],
  ],
  [
    "True or false: the Great Fire of London happened in 1666.",
    ["True", "False"],
  ],
  // neuroscience and psychology
  [
    "What is the basic signaling cell of the nervous system?",
    ["The neuron", "The nephron", "The red blood cell", "The hepatocyte"],
  ],
  [
    "Which part of a neuron usually receives signals from other neurons?",
    [
      "The dendrites",
      "The axon terminal",
      "The myelin sheath",
      "The node of Ranvier",
    ],
  ],
  [
    "Which brain structure is most tied to forming new long-term memories?",
    ["The hippocampus", "The cerebellum", "The medulla", "The occipital lobe"],
  ],
  [
    "Which neurotransmitter is most tied to reward and motivation?",
    ["Dopamine", "GABA", "Acetylcholine", "Glycine"],
  ],
  [
    "What is the main inhibitory neurotransmitter in the adult brain?",
    ["GABA", "Glutamate", "Dopamine", "Epinephrine"],
  ],
  [
    "Which lobe of the brain mainly handles vision?",
    [
      "The occipital lobe",
      "The temporal lobe",
      "The frontal lobe",
      "The parietal lobe",
    ],
  ],
  [
    "The cerebellum mostly helps with…",
    ["Balance and coordinated movement", "Language", "Vision", "Smell"],
  ],
  [
    "What does the myelin around an axon mainly do?",
    [
      "Speeds up its signals",
      "Stores memories",
      "Makes neurotransmitters",
      "Clears out waste",
    ],
  ],
  [
    "Broca's area is mostly tied to…",
    ["Producing speech", "Recognizing faces", "Hearing music", "Smell"],
  ],
  [
    "Which ions rushing into a neuron start an action potential?",
    ["Sodium", "Potassium", "Chloride", "Magnesium"],
  ],
  [
    "What is the tiny gap between two neurons called?",
    ["The synapse", "The axon hillock", "The soma", "The ganglion"],
  ],
  ["True or false: people use only 10% of their brains.", ["True", "False"], 1],
  [
    "Who is known for classical conditioning with dogs?",
    ["Ivan Pavlov", "B. F. Skinner", "Sigmund Freud", "Jean Piaget"],
  ],
  // English and literature
  [
    "Who wrote Pride and Prejudice?",
    ["Jane Austen", "Charlotte Brontë", "Mary Shelley", "George Eliot"],
  ],
  [
    'In which play does a character ask "To be, or not to be"?',
    ["Hamlet", "Macbeth", "Othello", "King Lear"],
  ],
  ["How many lines does a sonnet usually have?", ["14", "12", "10", "16"]],
  [
    "Who wrote the novel 1984?",
    ["George Orwell", "Aldous Huxley", "Ray Bradbury", "H. G. Wells"],
  ],
  [
    'Which figure of speech compares two things using "like" or "as"?',
    ["A simile", "A metaphor", "Hyperbole", "Alliteration"],
  ],
  [
    "Who is said to have composed The Odyssey?",
    ["Homer", "Virgil", "Sophocles", "Ovid"],
  ],
  [
    "What is iambic pentameter?",
    [
      "Five unstressed-stressed beats in a line",
      "A poem of five stanzas",
      "Lines that rhyme in pairs",
      "Verse with no meter at all",
    ],
  ],
  [
    "Who wrote Frankenstein?",
    ["Mary Shelley", "Bram Stoker", "Edgar Allan Poe", "Emily Brontë"],
  ],
  [
    'Which novel opens with "Call me Ishmael"?',
    [
      "Moby-Dick",
      "Treasure Island",
      "The Old Man and the Sea",
      "Robinson Crusoe",
    ],
  ],
  [
    'A word that sounds like what it means, like "buzz", is an example of…',
    ["Onomatopoeia", "Personification", "Irony", "An oxymoron"],
  ],
  [
    "Who wrote The Great Gatsby?",
    [
      "F. Scott Fitzgerald",
      "Ernest Hemingway",
      "John Steinbeck",
      "William Faulkner",
    ],
  ],
  [
    '"Jumbo shrimp" is an example of…',
    ["An oxymoron", "A simile", "An allusion", "Onomatopoeia"],
  ],
  [
    "Which of these words is a conjunction?",
    ["Because", "Quickly", "Beneath", "Happy"],
  ],
  [
    "Who wrote One Hundred Years of Solitude?",
    [
      "Gabriel García Márquez",
      "Jorge Luis Borges",
      "Isabel Allende",
      "Pablo Neruda",
    ],
  ],
  // chemistry and biology
  ["What is the chemical symbol for sodium?", ["Na", "So", "S", "Sd"]],
  ["What is the pH of pure water at 25 °C?", ["7", "0", "14", "1"]],
  [
    "Avogadro's number is about…",
    ["6.02 × 10²³", "3.00 × 10⁸", "1.60 × 10⁻¹⁹", "9.81 × 10²"],
  ],
  [
    "Which kind of bond is made by atoms sharing electrons?",
    [
      "A covalent bond",
      "An ionic bond",
      "A hydrogen bond",
      "A van der Waals force",
    ],
  ],
  [
    "What is the most common gas in Earth's air?",
    ["Nitrogen", "Oxygen", "Carbon dioxide", "Argon"],
  ],
  [
    "Which element has atomic number 6?",
    ["Carbon", "Oxygen", "Nitrogen", "Boron"],
  ],
  [
    "Which organelle makes most of a cell's ATP?",
    ["The mitochondrion", "The ribosome", "The Golgi apparatus", "The nucleus"],
  ],
  [
    "DNA's four bases are adenine, thymine, guanine and…",
    ["Cytosine", "Uracil", "Alanine", "Histidine"],
  ],
  [
    "What do plants use to turn light into chemical energy?",
    ["Photosynthesis", "Respiration", "Fermentation", "Transpiration"],
  ],
  [
    "Which blood cells carry oxygen?",
    ["Red blood cells", "White blood cells", "Platelets", "Plasma cells"],
  ],
  [
    "Who proposed evolution by natural selection alongside Alfred Russel Wallace?",
    [
      "Charles Darwin",
      "Gregor Mendel",
      "Louis Pasteur",
      "Jean-Baptiste Lamarck",
    ],
  ],
  // economics, statistics and philosophy
  [
    "In economics, what is an opportunity cost?",
    [
      "The value of the best option given up",
      "The price on the tag",
      "The cost of labor",
      "A tax on trade",
    ],
  ],
  [
    "When the price of a normal good goes up, the quantity people demand usually…",
    ["Falls", "Rises", "Stays the same", "Doubles"],
  ],
  [
    "Who wrote The Wealth of Nations?",
    ["Adam Smith", "John Maynard Keynes", "Karl Marx", "Milton Friedman"],
  ],
  [
    "A p-value under 0.05 usually leads researchers to…",
    [
      "Reject the null hypothesis",
      "Accept the null hypothesis",
      "Double the sample",
      "Drop the outliers",
    ],
  ],
  [
    'Who wrote "I think, therefore I am"?',
    ["René Descartes", "Immanuel Kant", "John Locke", "Plato"],
  ],
  [
    "Which philosopher tutored Alexander the Great?",
    ["Aristotle", "Socrates", "Plato", "Epicurus"],
  ],
  // astronomy
  [
    "Which planet is closest to the Sun?",
    ["Mercury", "Venus", "Mars", "Earth"],
  ],
  [
    "What powers the Sun?",
    [
      "Nuclear fusion",
      "Nuclear fission",
      "Chemical burning",
      "Radioactive decay",
    ],
  ],
  [
    "True or false: sunlight takes about 8 minutes to reach Earth.",
    ["True", "False"],
  ],
];
