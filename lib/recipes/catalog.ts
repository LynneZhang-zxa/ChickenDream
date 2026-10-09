import type { Ingredient, Recipe, Step } from "../recipe";

// Helpers only reduce authoring repetition. Every exported record is plain JSON.
const ingredient = (name: string, amount: number, unit: string, note?: string): Ingredient =>
  ({ name, amount, unit, ...(note ? { note } : {}) });
const step = (id: string, title: string, instruction: string, ingredients: string[], durationSeconds?: number, safety?: string, tip?: string): Step =>
  ({ id, title, instruction, ingredients, ...(durationSeconds ? { durationSeconds } : {}), ...(safety ? { safety } : {}), ...(tip ? { tip } : {}) });
const poultry = "Keep raw poultry separate from ready-to-eat food, wash hands and utensils, and check the thickest pieces reach 165°F (74°C) with a thermometer.";
const groundMeat = "Check ground beef reaches 160°F (71°C) with a food thermometer; color alone does not show it is safe.";
const riceSafety = "Use freshly cooked rice or rice promptly refrigerated within two hours. Reheat refrigerated rice to 165°F (74°C).";
const leftovers = "Refrigerate leftovers in shallow containers within two hours, use within three to four days, and reheat to 165°F (74°C).";

type Entry = Pick<Recipe, "id" | "title" | "description" | "cuisine" | "tags" | "prepMinutes" | "cookMinutes" | "servings" | "ingredients" | "steps"> & { image?: string };
function recipe(entry: Entry): Recipe {
  return {
    ...entry,
    image: entry.image ?? "/recipes/placeholder.svg",
    imageKind: entry.image ? "photo" : "placeholder",
    totalMinutes: entry.prepMinutes + entry.cookMinutes,
    emoji: "🍽️",
    calories: null,
    nutrition: { status: "unavailable", reason: "No verified nutrition calculation is available for this recipe." },
  };
}

export const ADDITIONAL_RECIPES: Recipe[] = [
  recipe({
    id: "tomato-beef-stew", title: "Tomato Beef Stew", description: "A Chinese-inspired tomato and ginger beef stew with tender potatoes and a rich broth.", cuisine: "Chinese-inspired", tags: ["beef", "stew", "make-ahead"], image: "/recipes/tomato-beef-stew.jpg", prepMinutes: 20, cookMinutes: 110, servings: 4,
    ingredients: [ingredient("beef chuck", 1.5, "pound", "cut into one-inch cubes"), ingredient("neutral oil", 2, "tablespoon"), ingredient("onion", 1, "", "diced"), ingredient("garlic", 3, "clove", "minced"), ingredient("fresh ginger", 1, "tablespoon", "minced"), ingredient("tomatoes", 4, "", "chopped"), ingredient("tomato paste", 2, "tablespoon"), ingredient("low-sodium beef broth", 3, "cup"), ingredient("soy sauce", 2, "tablespoon"), ingredient("potatoes", 1, "pound", "peeled and cubed"), ingredient("carrots", 2, "", "sliced"), ingredient("black pepper", 0.25, "teaspoon")],
    steps: [
      step("prep", "Prepare the ingredients", "Chop the vegetables and pat the beef dry. Keep the potatoes in cold water until needed, then drain.", ["beef chuck", "onion", "garlic", "fresh ginger", "tomatoes", "potatoes", "carrots"], undefined, "Use separate boards for raw beef and vegetables; wash hands and utensils after handling beef."),
      step("brown", "Brown the beef", "Heat the oil in a heavy pot over medium-high heat. Brown the beef in two batches for about eight minutes total, then transfer to a clean plate.", ["neutral oil", "beef chuck"], 480),
      step("base", "Build the tomato base", "Lower to medium heat and cook the onion for five minutes. Stir in garlic, ginger and tomato paste for one minute, then add tomatoes and cook for five minutes.", ["onion", "garlic", "fresh ginger", "tomato paste", "tomatoes"], 660),
      step("simmer", "Simmer the beef", "Return the beef and its juices to the pot with broth, soy sauce and pepper. Bring to a simmer, cover and cook gently for seventy minutes, stirring occasionally.", ["beef chuck", "low-sodium beef broth", "soy sauce", "black pepper"], 4200, undefined, "Add a little water if the stew begins sticking."),
      step("vegetables", "Add the vegetables", "Add drained potatoes and carrots and simmer covered for twenty-five minutes. Continue cooking if needed until the beef is fork-tender and the vegetables are soft; serve hot.", ["potatoes", "carrots"], 1500, leftovers),
    ],
  }),
  recipe({
    id: "chicken-curry", title: "Chicken Curry", description: "An approachable Indian-inspired chicken curry with tomatoes, warming spices and coconut milk.", cuisine: "Indian-inspired", tags: ["chicken", "curry", "one-pot"], image: "/recipes/chicken-curry.jpg", prepMinutes: 15, cookMinutes: 30, servings: 4,
    ingredients: [ingredient("boneless chicken thighs", 1.5, "pound", "cut into bite-size pieces"), ingredient("neutral oil", 2, "tablespoon"), ingredient("onion", 1, "", "diced"), ingredient("garlic", 4, "clove", "minced"), ingredient("fresh ginger", 1, "tablespoon", "grated"), ingredient("curry powder", 2, "tablespoon"), ingredient("ground cumin", 1, "teaspoon"), ingredient("salt", 0.75, "teaspoon"), ingredient("canned diced tomatoes", 14, "ounce"), ingredient("coconut milk", 13.5, "ounce"), ingredient("water", 0.5, "cup"), ingredient("cilantro", 0.25, "cup", "chopped")],
    steps: [
      step("prep", "Prepare the curry ingredients", "Dice the onion, mince the garlic and grate the ginger. Cut the chicken on a separate board into evenly sized pieces.", ["onion", "garlic", "fresh ginger", "boneless chicken thighs"], undefined, poultry),
      step("aromatics", "Soften the onion", "Heat oil in a deep skillet over medium heat. Cook the onion for seven minutes, stirring, then add garlic and ginger and cook for one minute.", ["neutral oil", "onion", "garlic", "fresh ginger"], 480),
      step("spices", "Add spices and chicken", "Stir in curry powder, cumin and salt for thirty seconds. Add chicken and stir for three minutes to coat it with the spices.", ["curry powder", "ground cumin", "salt", "boneless chicken thighs"], 180),
      step("simmer", "Simmer the curry", "Add tomatoes, coconut milk and water. Bring to a gentle simmer and cook uncovered for eighteen minutes, stirring occasionally, until the chicken reaches 165°F (74°C).", ["canned diced tomatoes", "coconut milk", "water"], 1080, poultry),
      step("serve", "Finish the curry", "If the sauce is thin, simmer a few minutes longer; if too thick, add a splash of water. Scatter cilantro over the curry and divide among four bowls.", ["cilantro"], undefined, leftovers),
    ],
  }),
  recipe({
    id: "bibimbap", title: "Bibimbap", description: "Korean rice bowls with seasoned beef, sauteed vegetables, fully cooked eggs and a gochujang sauce.", cuisine: "Korean", tags: ["rice", "beef", "bowl"], image: "/recipes/bibimbap.jpg", prepMinutes: 20, cookMinutes: 25, servings: 2,
    ingredients: [ingredient("short-grain rice", 1, "cup", "uncooked"), ingredient("water", 1.25, "cup"), ingredient("ground beef", 0.5, "pound"), ingredient("soy sauce", 1, "tablespoon"), ingredient("sesame oil", 2, "teaspoon"), ingredient("garlic", 2, "clove", "minced"), ingredient("neutral oil", 2, "tablespoon", "divided"), ingredient("carrot", 1, "", "cut into matchsticks"), ingredient("zucchini", 1, "", "thinly sliced"), ingredient("spinach", 4, "cup"), ingredient("eggs", 2, ""), ingredient("gochujang", 2, "tablespoon"), ingredient("rice vinegar", 1, "tablespoon"), ingredient("sugar", 1, "teaspoon"), ingredient("sesame seeds", 1, "teaspoon")],
    steps: [
      step("rice", "Cook the rice", "Rinse the rice and put in a saucepan with water. Bring to a boil, cover and cook on low for fifteen minutes, then rest off the heat for ten minutes; follow the rice package if its water ratio differs.", ["short-grain rice", "water"], 900, riceSafety),
      step("sauce", "Mix the sauce", "Mix gochujang, rice vinegar and sugar in a small bowl. Prepare the vegetables while the rice cooks.", ["gochujang", "rice vinegar", "sugar", "carrot", "zucchini", "spinach"]),
      step("vegetables", "Cook the vegetables", "Heat one tablespoon neutral oil in a skillet over medium-high heat. Cook carrot for three minutes, zucchini for three minutes and spinach for one minute in separate batches; set each aside.", ["neutral oil", "carrot", "zucchini", "spinach"], 420),
      step("beef", "Cook the beef", "In the same skillet, cook beef with garlic and soy sauce for six to eight minutes, breaking it up until it reaches 160°F (71°C). Stir in sesame oil and transfer to a clean bowl.", ["ground beef", "garlic", "soy sauce", "sesame oil"], 480, groundMeat),
      step("eggs", "Cook the eggs", "Heat the remaining tablespoon neutral oil over medium heat. Fry the eggs until both whites and yolks are firm, covering the pan briefly if needed.", ["neutral oil", "eggs"], 240, "Wash hands after handling eggs and cook both yolks and whites until firm."),
      step("assemble", "Assemble the bowls", "Divide rice between two bowls. Arrange vegetables and beef on top, add an egg to each, then sprinkle sesame seeds and serve with the sauce to mix through.", ["short-grain rice", "sesame seeds"], undefined, leftovers),
    ],
  }),
  recipe({
    id: "garlic-butter-shrimp", title: "Garlic Butter Shrimp", description: "Quick skillet shrimp with garlic butter, lemon and fresh parsley.", cuisine: "American", tags: ["seafood", "quick", "one-pan"], image: "/recipes/garlic-butter-shrimp.jpg", prepMinutes: 10, cookMinutes: 10, servings: 2,
    ingredients: [ingredient("raw shrimp", 1, "pound", "peeled and deveined; thawed"), ingredient("butter", 3, "tablespoon", "divided"), ingredient("olive oil", 1, "tablespoon"), ingredient("garlic", 4, "clove", "minced"), ingredient("salt", 0.5, "teaspoon"), ingredient("black pepper", 0.25, "teaspoon"), ingredient("lemon juice", 2, "tablespoon"), ingredient("parsley", 2, "tablespoon", "chopped")],
    steps: [
      step("prep", "Prepare the shrimp", "Pat thawed shrimp dry and season with salt and pepper. Mince the garlic and chop the parsley.", ["raw shrimp", "salt", "black pepper", "garlic", "parsley"], undefined, "Thaw shrimp in the refrigerator, keep chilled until cooking, and wash hands after handling raw seafood."),
      step("sear", "Sear the shrimp", "Heat olive oil and one tablespoon butter over medium-high heat. Add shrimp in one layer and cook for two minutes, then flip.", ["olive oil", "butter", "raw shrimp"], 120),
      step("garlic", "Add garlic butter", "Lower to medium heat and add remaining butter and garlic. Stir for two to three minutes until shrimp are firm, pearly and opaque throughout; remove promptly when cooked.", ["butter", "garlic", "raw shrimp"], 180, "Shrimp must be opaque throughout; do not rely only on exterior pink color."),
      step("finish", "Finish and serve", "Turn off the heat. Stir in lemon juice and parsley and divide the shrimp and sauce between two plates.", ["lemon juice", "parsley"], undefined, leftovers),
    ],
  }),
  recipe({
    id: "spaghetti-pomodoro", title: "Spaghetti Pomodoro", description: "Spaghetti tossed with a simple garlic, tomato and basil sauce.", cuisine: "Italian", tags: ["pasta", "vegetarian", "weeknight"], prepMinutes: 10, cookMinutes: 25, servings: 4,
    ingredients: [ingredient("spaghetti", 12, "ounce"), ingredient("olive oil", 2, "tablespoon"), ingredient("garlic", 4, "clove", "thinly sliced"), ingredient("canned crushed tomatoes", 28, "ounce"), ingredient("salt", 2, "teaspoon", "divided; one and a half for pasta water"), ingredient("black pepper", 0.25, "teaspoon"), ingredient("fresh basil", 0.5, "cup", "torn"), ingredient("parmesan", 0.25, "cup", "grated"), ingredient("water", 12, "cup", "for boiling pasta")],
    steps: [
      step("sauce", "Start the sauce", "Heat oil over medium-low heat in a wide pan. Cook garlic for one minute without browning, then add tomatoes, half a teaspoon salt and pepper.", ["olive oil", "garlic", "canned crushed tomatoes", "salt", "black pepper"], 60),
      step("simmer", "Simmer the tomatoes", "Simmer the sauce gently for twenty minutes, stirring occasionally. Meanwhile bring the water and remaining salt to a boil in a large pot.", ["water", "salt"], 1200),
      step("pasta", "Cook the spaghetti", "Cook spaghetti in the boiling water for the package's al dente time, usually eight to eleven minutes. Reserve half a cup of pasta water, then drain carefully.", ["spaghetti"], undefined, "Keep your face and hands away from rising steam when draining."),
      step("finish", "Toss and serve", "Toss spaghetti with sauce and basil over low heat for one minute. Add reserved pasta water a little at a time if needed, then serve with parmesan.", ["spaghetti", "fresh basil", "parmesan"], 60, leftovers),
    ],
  }),
  recipe({
    id: "chickpea-spinach-curry", title: "Chickpea Spinach Curry", description: "A filling meat-free tomato curry with chickpeas and spinach.", cuisine: "Indian-inspired", tags: ["vegan", "legumes", "one-pot"], prepMinutes: 10, cookMinutes: 25, servings: 4,
    ingredients: [ingredient("canned chickpeas", 30, "ounce", "drained and rinsed"), ingredient("onion", 1, "", "diced"), ingredient("neutral oil", 2, "tablespoon"), ingredient("garlic", 3, "clove", "minced"), ingredient("fresh ginger", 1, "tablespoon", "grated"), ingredient("curry powder", 1, "tablespoon"), ingredient("canned crushed tomatoes", 14, "ounce"), ingredient("coconut milk", 13.5, "ounce"), ingredient("spinach", 5, "cup"), ingredient("salt", 0.5, "teaspoon"), ingredient("lemon juice", 1, "tablespoon")],
    steps: [
      step("prep", "Prepare the ingredients", "Drain and rinse chickpeas. Dice onion, mince garlic, grate ginger and wash the spinach.", ["canned chickpeas", "onion", "garlic", "fresh ginger", "spinach"]),
      step("aromatics", "Cook the aromatics", "Heat oil in a saucepan over medium heat. Cook onion for six minutes, then stir in garlic, ginger and curry powder for one minute.", ["neutral oil", "onion", "garlic", "fresh ginger", "curry powder"], 420),
      step("simmer", "Simmer the chickpeas", "Add chickpeas, tomatoes, coconut milk and salt. Simmer uncovered for fifteen minutes, stirring occasionally.", ["canned chickpeas", "canned crushed tomatoes", "coconut milk", "salt"], 900),
      step("finish", "Wilt the spinach", "Add spinach in handfuls and stir for two minutes until wilted. Turn off the heat, stir in lemon juice and serve hot.", ["spinach", "lemon juice"], 120, leftovers),
    ],
  }),
  recipe({
    id: "miso-soup", title: "Miso Soup", description: "A light Japanese soup with tofu, wakame and miso stirred in gently at the end.", cuisine: "Japanese", tags: ["soup", "quick", "tofu"], prepMinutes: 5, cookMinutes: 10, servings: 2,
    ingredients: [ingredient("prepared dashi", 3, "cup", "unsalted"), ingredient("silken tofu", 6, "ounce", "cubed"), ingredient("dried wakame", 1, "teaspoon"), ingredient("white miso", 2, "tablespoon"), ingredient("scallions", 2, "", "thinly sliced")],
    steps: [
      step("prep", "Prepare tofu and scallions", "Drain the tofu and cut into small cubes. Wash and thinly slice the scallions.", ["silken tofu", "scallions"]),
      step("broth", "Heat the broth", "Bring dashi to a gentle simmer in a saucepan. Add wakame and simmer for three minutes to rehydrate it.", ["prepared dashi", "dried wakame"], 180),
      step("tofu", "Warm the tofu", "Add tofu carefully and simmer gently for two minutes until hot. Turn off the heat.", ["silken tofu"], 120),
      step("miso", "Stir in miso", "Whisk miso with a ladle of warm broth in a small bowl until smooth, then stir it back into the pot. Add scallions and serve immediately; avoid boiling after adding miso.", ["white miso", "scallions"], undefined, leftovers),
    ],
  }),
  recipe({
    id: "teriyaki-salmon", title: "Teriyaki Salmon", description: "Oven-baked salmon brushed with a homemade soy and ginger glaze.", cuisine: "Japanese-inspired", tags: ["fish", "oven", "weeknight"], prepMinutes: 10, cookMinutes: 20, servings: 2,
    ingredients: [ingredient("salmon fillets", 12, "ounce", "two equal fillets"), ingredient("soy sauce", 2, "tablespoon"), ingredient("water", 2, "tablespoon"), ingredient("honey", 1, "tablespoon"), ingredient("rice vinegar", 1, "tablespoon"), ingredient("fresh ginger", 1, "teaspoon", "grated"), ingredient("garlic", 1, "clove", "minced"), ingredient("neutral oil", 1, "teaspoon"), ingredient("sesame seeds", 1, "teaspoon")],
    steps: [
      step("prep", "Prepare the oven", "Heat the oven to 400°F (200°C). Oil a baking dish and place salmon skin-side down in it.", ["neutral oil", "salmon fillets"], undefined, "Keep raw fish and its utensils separate from cooked food; wash hands after handling."),
      step("glaze", "Make the glaze", "Simmer soy sauce, water, honey, vinegar, ginger and garlic in a small saucepan for four minutes until slightly thickened. Set aside half in a clean bowl for serving.", ["soy sauce", "water", "honey", "rice vinegar", "fresh ginger", "garlic"], 240),
      step("bake", "Bake the salmon", "Brush salmon with the remaining glaze. Bake for twelve to sixteen minutes, until a thermometer in the thickest part reads 145°F (63°C).", ["salmon fillets"], 720, "Cooking time depends on thickness; use a thermometer and do not reuse a brush that touched raw fish on cooked salmon."),
      step("serve", "Finish and serve", "Spoon the reserved clean glaze over the cooked salmon and sprinkle with sesame seeds. Divide between two plates.", ["sesame seeds"], undefined, leftovers),
    ],
  }),
  recipe({
    id: "vegetable-fried-rice", title: "Vegetable Fried Rice", description: "A quick Chinese-inspired skillet rice with peas, carrots and scrambled eggs.", cuisine: "Chinese-inspired", tags: ["rice", "vegetarian", "quick"], prepMinutes: 10, cookMinutes: 15, servings: 2,
    ingredients: [ingredient("cooked rice", 3, "cup", "properly chilled"), ingredient("eggs", 2, "", "beaten"), ingredient("neutral oil", 2, "tablespoon", "divided"), ingredient("carrot", 1, "", "finely diced"), ingredient("frozen peas", 0.5, "cup"), ingredient("garlic", 2, "clove", "minced"), ingredient("scallions", 2, "", "sliced"), ingredient("soy sauce", 2, "tablespoon"), ingredient("sesame oil", 1, "teaspoon")],
    steps: [
      step("prep", "Prepare the ingredients", "Break up chilled rice clumps with a fork. Dice carrot, mince garlic and slice scallions; beat eggs in a bowl.", ["cooked rice", "carrot", "garlic", "scallions", "eggs"], undefined, riceSafety),
      step("eggs", "Scramble the eggs", "Heat one tablespoon neutral oil in a large skillet over medium-high heat. Scramble eggs for two minutes until set, then transfer to a clean plate.", ["neutral oil", "eggs"], 120),
      step("vegetables", "Cook the vegetables", "Add remaining neutral oil and carrot to the pan and cook for four minutes. Add peas, garlic and scallions and stir for two minutes.", ["neutral oil", "carrot", "frozen peas", "garlic", "scallions"], 360),
      step("rice", "Fry the rice", "Add rice and soy sauce and stir-fry for five minutes, breaking up any clumps. Return eggs and stir in sesame oil; heat everything to 165°F (74°C), then serve.", ["cooked rice", "soy sauce", "eggs", "sesame oil"], 300, riceSafety),
    ],
  }),
  recipe({
    id: "homemade-tacos", title: "Homemade Tacos", description: "Weeknight ground beef tacos with crisp lettuce, tomatoes and a simple spice blend.", cuisine: "Mexican-inspired", tags: ["beef", "quick", "family"], prepMinutes: 15, cookMinutes: 15, servings: 4,
    ingredients: [ingredient("ground beef", 1, "pound"), ingredient("onion", 1, "", "diced"), ingredient("neutral oil", 1, "tablespoon"), ingredient("ground cumin", 2, "teaspoon"), ingredient("chili powder", 2, "teaspoon", "mild blend"), ingredient("salt", 0.5, "teaspoon"), ingredient("tomato paste", 1, "tablespoon"), ingredient("water", 0.5, "cup"), ingredient("small corn tortillas", 8, ""), ingredient("lettuce", 2, "cup", "shredded"), ingredient("tomatoes", 2, "", "diced"), ingredient("cheddar", 0.5, "cup", "grated"), ingredient("lime", 1, "", "cut into wedges")],
    steps: [
      step("prep", "Prepare the toppings", "Wash and shred lettuce, dice tomatoes and onion, grate cheese and cut lime into wedges. Keep the toppings away from raw beef.", ["lettuce", "tomatoes", "onion", "cheddar", "lime"]),
      step("beef", "Cook the beef", "Heat oil over medium-high heat and cook onion for three minutes. Add beef and cook for seven minutes, breaking it into crumbles, until it reaches 160°F (71°C); carefully drain excess fat.", ["neutral oil", "onion", "ground beef"], 600, groundMeat),
      step("season", "Season the filling", "Stir in cumin, chili powder, salt, tomato paste and water. Simmer for four minutes until the filling is moist but not watery.", ["ground cumin", "chili powder", "salt", "tomato paste", "water"], 240),
      step("serve", "Warm and fill tortillas", "Warm tortillas in a dry skillet for about thirty seconds per side. Divide beef among tortillas and top with lettuce, tomatoes and cheese; serve with lime wedges.", ["small corn tortillas", "lettuce", "tomatoes", "cheddar", "lime"], undefined, leftovers),
    ],
  }),
  recipe({
    id: "black-bean-quesadillas", title: "Black Bean Quesadillas", description: "Crisp folded tortillas filled with seasoned black beans, corn and melted cheese.", cuisine: "Mexican-inspired", tags: ["vegetarian", "beans", "quick"], prepMinutes: 10, cookMinutes: 15, servings: 2,
    ingredients: [ingredient("canned black beans", 15, "ounce", "drained and rinsed"), ingredient("frozen corn", 0.5, "cup", "thawed"), ingredient("ground cumin", 1, "teaspoon"), ingredient("salt", 0.25, "teaspoon"), ingredient("lime juice", 1, "tablespoon"), ingredient("flour tortillas", 4, "", "eight-inch"), ingredient("cheddar", 1, "cup", "grated"), ingredient("neutral oil", 2, "teaspoon", "divided")],
    steps: [
      step("filling", "Mix the filling", "Drain and rinse beans and thaw corn. Mash half the beans, then mix with remaining beans, corn, cumin, salt and lime juice.", ["canned black beans", "frozen corn", "ground cumin", "salt", "lime juice"]),
      step("assemble", "Fill the tortillas", "Divide the filling and cheese over one half of each tortilla. Fold the empty halves over and gently press flat.", ["flour tortillas", "cheddar"]),
      step("cook", "Cook in batches", "Heat one teaspoon oil in a skillet over medium heat. Cook two quesadillas for three minutes per side until crisp and hot throughout; repeat with remaining oil and quesadillas.", ["neutral oil", "flour tortillas"], 180, "Turn down the heat if tortillas brown before the cheese melts."),
      step("serve", "Slice and serve", "Rest for one minute so the filling settles. Cut each quesadilla into wedges and serve two per person.", [], 60, leftovers),
    ],
  }),
  recipe({
    id: "greek-chickpea-salad", title: "Greek Chickpea Salad", description: "A fresh chickpea salad with cucumber, tomatoes, olives and feta in a lemon dressing.", cuisine: "Greek-inspired", tags: ["vegetarian", "no-cook", "salad"], prepMinutes: 20, cookMinutes: 0, servings: 4,
    ingredients: [ingredient("canned chickpeas", 30, "ounce", "drained and rinsed"), ingredient("cucumber", 1, "", "diced"), ingredient("cherry tomatoes", 2, "cup", "halved"), ingredient("red onion", 0.5, "", "finely diced"), ingredient("pitted olives", 0.5, "cup", "sliced"), ingredient("feta", 4, "ounce", "crumbled; pasteurized"), ingredient("olive oil", 3, "tablespoon"), ingredient("lemon juice", 2, "tablespoon"), ingredient("dried oregano", 1, "teaspoon"), ingredient("black pepper", 0.25, "teaspoon")],
    steps: [
      step("prep", "Wash and chop", "Wash cucumber and tomatoes, then dice cucumber and halve tomatoes. Dice onion, slice olives and drain and rinse chickpeas.", ["cucumber", "cherry tomatoes", "red onion", "pitted olives", "canned chickpeas"]),
      step("dressing", "Mix the dressing", "Whisk olive oil, lemon juice, oregano and pepper in a large bowl.", ["olive oil", "lemon juice", "dried oregano", "black pepper"]),
      step("toss", "Toss the salad", "Add chickpeas, vegetables and olives and toss well. Fold in feta gently so it stays in small pieces.", ["canned chickpeas", "cucumber", "cherry tomatoes", "red onion", "pitted olives", "feta"]),
      step("serve", "Serve or chill", "Divide among four bowls, or cover and refrigerate until serving. Stir once more before serving to redistribute the dressing.", [], undefined, "Keep the salad refrigerated at 40°F (4°C) or below and refrigerate within two hours of preparation."),
    ],
  }),
  recipe({
    id: "lentil-vegetable-soup", title: "Lentil Vegetable Soup", description: "A hearty Mediterranean-inspired soup with brown lentils, tomatoes and vegetables.", cuisine: "Mediterranean-inspired", tags: ["vegan", "soup", "make-ahead"], prepMinutes: 15, cookMinutes: 40, servings: 4,
    ingredients: [ingredient("brown lentils", 1, "cup", "dry; rinsed and picked over"), ingredient("olive oil", 2, "tablespoon"), ingredient("onion", 1, "", "diced"), ingredient("carrots", 2, "", "diced"), ingredient("celery stalks", 2, "", "diced"), ingredient("garlic", 3, "clove", "minced"), ingredient("canned diced tomatoes", 14, "ounce"), ingredient("vegetable broth", 5, "cup"), ingredient("dried thyme", 1, "teaspoon"), ingredient("salt", 0.5, "teaspoon"), ingredient("lemon juice", 2, "tablespoon")],
    steps: [
      step("prep", "Prepare the vegetables", "Rinse lentils and remove any debris. Dice onion, carrots and celery and mince garlic.", ["brown lentils", "onion", "carrots", "celery stalks", "garlic"]),
      step("saute", "Soften the vegetables", "Heat oil in a large pot over medium heat. Cook onion, carrots and celery for seven minutes; stir in garlic for one minute.", ["olive oil", "onion", "carrots", "celery stalks", "garlic"], 480),
      step("simmer", "Cook the lentils", "Add lentils, tomatoes, broth, thyme and salt. Bring to a boil, then simmer partially covered for thirty minutes, until lentils are tender; add water if needed.", ["brown lentils", "canned diced tomatoes", "vegetable broth", "dried thyme", "salt"], 1800),
      step("finish", "Finish the soup", "Stir in lemon juice. For a thicker soup, mash a few lentils against the side of the pot; divide among four bowls.", ["lemon juice"], undefined, leftovers),
    ],
  }),
  recipe({
    id: "shakshuka", title: "Shakshuka", description: "Eggs gently cooked in a spiced tomato and pepper sauce, served with bread.", cuisine: "North African-inspired", tags: ["vegetarian", "eggs", "one-pan"], prepMinutes: 15, cookMinutes: 30, servings: 2,
    ingredients: [ingredient("olive oil", 2, "tablespoon"), ingredient("onion", 1, "", "diced"), ingredient("red bell pepper", 1, "", "diced"), ingredient("garlic", 3, "clove", "minced"), ingredient("ground cumin", 1, "teaspoon"), ingredient("paprika", 1, "teaspoon"), ingredient("salt", 0.5, "teaspoon"), ingredient("canned crushed tomatoes", 28, "ounce"), ingredient("eggs", 4, ""), ingredient("parsley", 2, "tablespoon", "chopped"), ingredient("bread", 4, "", "slices")],
    steps: [
      step("vegetables", "Cook the vegetables", "Heat oil in a deep skillet over medium heat. Cook diced onion and pepper for eight minutes until soft, stirring regularly.", ["olive oil", "onion", "red bell pepper"], 480),
      step("sauce", "Simmer the sauce", "Add garlic, cumin, paprika and salt and cook for one minute. Stir in tomatoes and simmer uncovered for twelve minutes until thickened.", ["garlic", "ground cumin", "paprika", "salt", "canned crushed tomatoes"], 720),
      step("eggs", "Cook the eggs", "Make four wells in the sauce and crack one egg into each. Cover and cook on low for eight to ten minutes until both whites and yolks are firm.", ["eggs"], 480, "Cook eggs until whites and yolks are firm; wash hands after handling shells."),
      step("serve", "Finish and serve", "Scatter parsley over the eggs and sauce. Divide between two plates and serve with bread for scooping.", ["parsley", "bread"], undefined, leftovers),
    ],
  }),
  recipe({
    id: "thai-basil-chicken", title: "Thai Basil Chicken", description: "A Thai-inspired chicken stir-fry with basil and a savory garlic sauce.", cuisine: "Thai-inspired", tags: ["chicken", "stir-fry", "quick"], prepMinutes: 15, cookMinutes: 15, servings: 2,
    ingredients: [ingredient("boneless chicken thighs", 1, "pound", "finely chopped"), ingredient("neutral oil", 1, "tablespoon"), ingredient("garlic", 4, "clove", "minced"), ingredient("red chili", 1, "", "sliced; remove seeds for less heat"), ingredient("green beans", 1, "cup", "cut into one-inch pieces"), ingredient("soy sauce", 1, "tablespoon"), ingredient("oyster sauce", 1, "tablespoon"), ingredient("sugar", 1, "teaspoon"), ingredient("water", 2, "tablespoon"), ingredient("Thai basil leaves", 1, "cup"), ingredient("cooked rice", 2, "cup", "freshly cooked")],
    steps: [
      step("prep", "Prepare sauce and ingredients", "Mix soy sauce, oyster sauce, sugar and water in a bowl. Prepare garlic, chili and beans, then chop chicken on a separate board.", ["soy sauce", "oyster sauce", "sugar", "water", "garlic", "red chili", "green beans", "boneless chicken thighs"], undefined, poultry),
      step("aromatics", "Start the stir-fry", "Heat oil in a large skillet over medium-high heat. Stir-fry garlic and chili for thirty seconds, then add chicken and cook for five minutes, stirring often.", ["neutral oil", "garlic", "red chili", "boneless chicken thighs"], 300),
      step("beans", "Cook with the sauce", "Add beans and prepared sauce. Cook for five to seven minutes until beans are tender-crisp and chicken reaches 165°F (74°C); add a splash of water if the pan dries out.", ["green beans"], 420, poultry),
      step("basil", "Add basil and serve", "Turn off the heat and fold in basil until wilted. Serve over the freshly cooked rice.", ["Thai basil leaves", "cooked rice"], undefined, riceSafety),
    ],
  }),
  recipe({
    id: "lemon-herb-chicken", title: "Lemon Herb Chicken", description: "Roasted chicken thighs and potatoes with lemon, garlic and oregano.", cuisine: "Mediterranean-inspired", tags: ["chicken", "oven", "sheet-pan"], prepMinutes: 15, cookMinutes: 40, servings: 4,
    ingredients: [ingredient("boneless chicken thighs", 1.5, "pound"), ingredient("potatoes", 1.5, "pound", "cut into three-quarter-inch pieces"), ingredient("olive oil", 3, "tablespoon", "divided"), ingredient("lemon juice", 3, "tablespoon"), ingredient("garlic", 4, "clove", "minced"), ingredient("dried oregano", 2, "teaspoon"), ingredient("salt", 1, "teaspoon", "divided"), ingredient("black pepper", 0.5, "teaspoon", "divided")],
    steps: [
      step("potatoes", "Start the potatoes", "Heat the oven to 425°F (220°C). Toss potatoes with one tablespoon oil, half the salt and half the pepper on a rimmed baking sheet; roast for fifteen minutes.", ["potatoes", "olive oil", "salt", "black pepper"], 900),
      step("season", "Season the chicken", "Mix remaining oil, salt and pepper with lemon juice, garlic and oregano in a bowl. Add chicken and turn to coat.", ["olive oil", "salt", "black pepper", "lemon juice", "garlic", "dried oregano", "boneless chicken thighs"], undefined, poultry),
      step("roast", "Roast together", "Turn potatoes and add chicken to the sheet in one layer. Roast for twenty to twenty-five minutes until potatoes are tender and chicken reaches 165°F (74°C).", ["boneless chicken thighs", "potatoes"], 1500, poultry),
      step("serve", "Rest and serve", "Rest the chicken for five minutes, then divide chicken and potatoes among four plates. Discard any uncooked marinade left in the bowl.", [], 300, leftovers),
    ],
  }),
  recipe({
    id: "avocado-pasta", title: "Avocado Pasta", description: "Pasta with a fresh avocado, lemon and basil sauce, best eaten immediately.", cuisine: "Italian-inspired", tags: ["vegan", "pasta", "quick"], prepMinutes: 10, cookMinutes: 10, servings: 2,
    ingredients: [ingredient("pasta", 6, "ounce"), ingredient("ripe avocado", 1, ""), ingredient("lemon juice", 2, "tablespoon"), ingredient("olive oil", 1, "tablespoon"), ingredient("fresh basil", 0.5, "cup"), ingredient("garlic", 1, "clove", "small; minced"), ingredient("salt", 1.5, "teaspoon", "one teaspoon for pasta water"), ingredient("black pepper", 0.25, "teaspoon"), ingredient("cherry tomatoes", 1, "cup", "halved"), ingredient("water", 8, "cup", "for boiling pasta")],
    steps: [
      step("pasta", "Cook the pasta", "Bring water and one teaspoon salt to a boil. Cook pasta for the package's al dente time, usually eight to ten minutes; reserve half a cup cooking water before draining.", ["water", "salt", "pasta"], undefined, "Drain carefully to avoid steam burns."),
      step("prep", "Prepare the produce", "Wash the avocado skin before cutting, then remove the pit and scoop out the flesh. Wash basil and tomatoes and halve tomatoes.", ["ripe avocado", "fresh basil", "cherry tomatoes"]),
      step("sauce", "Blend the sauce", "Blend avocado, lemon juice, olive oil, basil, garlic, remaining salt and pepper with two tablespoons reserved pasta water until smooth. Add more reserved water a spoonful at a time if needed.", ["ripe avocado", "lemon juice", "olive oil", "fresh basil", "garlic", "salt", "black pepper"]),
      step("serve", "Toss and serve", "Toss drained pasta with avocado sauce off the heat. Fold in tomatoes and serve immediately; refrigerate leftovers promptly and use within one day for best quality.", ["pasta", "cherry tomatoes"], undefined, "Refrigerate within two hours; the sauce will darken during storage."),
    ],
  }),
  recipe({
    id: "mushroom-risotto", title: "Mushroom Risotto", description: "Creamy arborio rice with browned mushrooms and parmesan, made without wine.", cuisine: "Italian", tags: ["vegetarian", "rice", "comfort-food"], prepMinutes: 15, cookMinutes: 35, servings: 4,
    ingredients: [ingredient("arborio rice", 1.5, "cup"), ingredient("vegetable broth", 6, "cup"), ingredient("mushrooms", 12, "ounce", "sliced"), ingredient("onion", 1, "", "finely diced"), ingredient("garlic", 2, "clove", "minced"), ingredient("olive oil", 2, "tablespoon"), ingredient("butter", 2, "tablespoon", "divided"), ingredient("parmesan", 0.5, "cup", "grated; vegetarian rennet if needed"), ingredient("black pepper", 0.25, "teaspoon"), ingredient("lemon juice", 1, "tablespoon")],
    steps: [
      step("prep", "Prepare and warm the broth", "Slice mushrooms, dice onion and mince garlic. Heat broth in a saucepan and keep it at a gentle simmer.", ["mushrooms", "onion", "garlic", "vegetable broth"]),
      step("mushrooms", "Brown the mushrooms", "Heat oil in a wide pan over medium-high heat. Cook mushrooms for seven minutes until browned; transfer to a bowl.", ["olive oil", "mushrooms"], 420),
      step("rice", "Toast the rice", "Lower the heat to medium and melt one tablespoon butter in the pan. Cook onion for four minutes, garlic for thirty seconds, then stir in rice for two minutes.", ["butter", "onion", "garlic", "arborio rice"], 360),
      step("simmer", "Add broth gradually", "Add warm broth one ladle at a time, stirring frequently and adding more when nearly absorbed. Continue for twenty to twenty-five minutes until rice is tender with a slight bite; you may not need all the broth.", ["vegetable broth", "arborio rice"], 1200, undefined, "Keep a gentle simmer rather than a hard boil."),
      step("finish", "Finish the risotto", "Turn off the heat and stir in mushrooms, remaining butter, parmesan, pepper and lemon juice. Add a little warm broth if needed so the risotto flows gently, then serve immediately.", ["mushrooms", "butter", "parmesan", "black pepper", "lemon juice"], undefined, riceSafety),
    ],
  }),
  recipe({
    id: "beef-broccoli-stir-fry", title: "Beef and Broccoli Stir-Fry", description: "Thin slices of beef and crisp broccoli in a quick soy and ginger sauce.", cuisine: "Chinese-inspired", tags: ["beef", "stir-fry", "quick"], prepMinutes: 20, cookMinutes: 15, servings: 2,
    ingredients: [ingredient("sirloin steak", 0.75, "pound", "thinly sliced against the grain"), ingredient("broccoli florets", 3, "cup"), ingredient("neutral oil", 2, "tablespoon", "divided"), ingredient("garlic", 3, "clove", "minced"), ingredient("fresh ginger", 1, "tablespoon", "grated"), ingredient("soy sauce", 2, "tablespoon"), ingredient("oyster sauce", 1, "tablespoon"), ingredient("cornstarch", 1, "tablespoon"), ingredient("water", 0.5, "cup", "divided"), ingredient("brown sugar", 1, "teaspoon")],
    steps: [
      step("prep", "Prepare the sauce", "Mix soy sauce, oyster sauce, cornstarch, sugar and a quarter cup water. Prepare broccoli, garlic and ginger, then thinly slice beef on a separate board.", ["soy sauce", "oyster sauce", "cornstarch", "brown sugar", "water", "broccoli florets", "garlic", "fresh ginger", "sirloin steak"], undefined, "Wash hands and utensils after handling raw beef."),
      step("broccoli", "Steam the broccoli", "Heat one tablespoon oil in a large skillet over medium-high heat. Add broccoli and remaining quarter cup water, cover for three minutes, then uncover and transfer broccoli to a bowl.", ["neutral oil", "broccoli florets", "water"], 180),
      step("beef", "Sear the beef", "Add remaining oil and sear beef in a single layer, in batches if needed, for about four minutes, turning once. Check representative thick slices reach 145°F (63°C), then transfer to a clean plate and rest three minutes.", ["neutral oil", "sirloin steak"], 240, "Use a food thermometer; whole-cut beef needs 145°F (63°C) and a three-minute rest."),
      step("sauce", "Thicken the sauce", "Lower heat to medium, add garlic and ginger and stir for thirty seconds. Stir the sauce mixture again, pour into the pan and simmer for two minutes until glossy.", ["garlic", "fresh ginger"], 120),
      step("finish", "Bring together", "Return rested beef and broccoli to the pan and toss for one minute until coated and hot. Divide between two plates and serve immediately.", ["sirloin steak", "broccoli florets"], 60, leftovers),
    ],
  }),
];
