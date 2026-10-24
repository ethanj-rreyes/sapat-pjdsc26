"""Food list used by the planner, with portion rules that keep plans familiar.

`cap` is the most a member may eat of that food per day, in grams as purchased per 1,000 kcal of the
member's energy need (so a toddler's cap is about 40% of an adult man's). Caps follow typical Filipino
servings and Pinggang Pinoy proportions; they are planning assumptions, documented in docs/MODEL.md.
"""

# psa_commodity -> (key, display name, planner group, cap g/1000 kcal, market unit, grams per market unit)
FOODS = {
    "RICE, REGULAR-MILLED, 1 KG": ("rice_rm", "Rice, regular-milled", "cereals", 200, "kg", 1000),
    "RICE, WELL-MILLED, 1 KG": ("rice_wm", "Rice, well-milled", "cereals", 200, "kg", 1000),
    "CORN GRITS, WHITE, 1 KG": ("corn_w", "Corn grits, white", "cereals", 120, "kg", 1000),
    "CORN GRITS, YELLOW, 1 KG": ("corn_y", "Corn grits, yellow", "cereals", 120, "kg", 1000),
    "POTATO, 1 KG": ("potato", "Potato", "roots", 60, "kg", 1000),
    "SWEET POTATO (CAMOTE), 1 KG": ("camote", "Camote (sweet potato)", "roots", 80, "kg", 1000),
    "GABI TUBERS, 1 KG": ("gabi", "Gabi (taro)", "roots", 60, "kg", 1000),
    "MONGGO, GREEN, 1 KG": ("monggo", "Monggo (mung beans)", "pulses", 30, "kg", 1000),
    "RAW PEANUT, WITHOUT SHELL, 1 KG": ("peanut", "Peanuts, shelled", "pulses", 12, "kg", 1000),
    "RAW PEANUT, UNSHELLED, 1 KG": ("peanut_us", "Peanuts, unshelled", "pulses", 15, "kg", 1000),
    "FRESH BEEF, PURE MEAT, 1 KG": ("beef", "Beef, lean", "meat", 40, "kg", 1000),
    "FRESH BEEF, MEAT WITH BONES, 1 KG": ("beef_b", "Beef with bones", "meat", 45, "kg", 1000),
    "FRESH PORK, KASIM, 1 KG": ("pork_kasim", "Pork kasim", "meat", 40, "kg", 1000),
    "FRESH PORK, LIEMPO, 1 KG": ("pork_liempo", "Pork liempo", "meat", 30, "kg", 1000),
    "FRESH PORK, MEAT WITH BONES, 1 KG": ("pork_b", "Pork with bones", "meat", 50, "kg", 1000),
    "FRESH PORK, PATA, FORE (FRONT), 1 KG": ("pork_pata", "Pork pata", "meat", 40, "kg", 1000),
    "FRESH CHICKEN, FULLY DRESSED, BROILER, 1 KG": ("chicken", "Chicken, whole", "meat", 60, "kg", 1000),
    "FRESH EGG, CHICKEN, MEDIUM, 1 PC": ("egg", "Egg, chicken", "eggs", 55, "pc", 55),
    "FRESH EGG, DUCK, MEDIUM, 1 PC": ("egg_duck", "Egg, duck", "eggs", 35, "pc", 70),
    "FRESH FISH, ROUND SCAD, GALUNGGONG, MEDIUM, 1 KG": ("galunggong", "Galunggong", "fish", 60, "kg", 1000),
    "FRESH FISH, TILAPIA, MEDIUM, 1 KG": ("tilapia", "Tilapia", "fish", 60, "kg", 1000),
    "FRESH FISH, MILKFISH, BANGUS, MEDIUM, 1 KG": ("bangus", "Bangus (milkfish)", "fish", 60, "kg", 1000),
    "FRESH FISH, TULINGAN (FRIGATE TUNA), MEDIUM, 1 KG": ("tulingan", "Tulingan", "fish", 60, "kg", 1000),
    "FRESH FISH, ALOY/TULINGAN, MEDIUM, 1 KG": ("aloy", "Aloy/tulingan", "fish", 60, "kg", 1000),
    "FRESH FISH, SHORT MACKEREL (HASA HASA/KABAYAS/KABALYAS), MEDIUM, 1 KG": ("hasahasa", "Hasa-hasa (mackerel)", "fish", 60, "kg", 1000),
    "FRESH FISH, SLIPMOUTH, SAPSAP, MEDIUM, 1 KG": ("sapsap", "Sapsap", "fish", 60, "kg", 1000),
    "FRESH FISH, NEMIMTERID, BISUGO, MEDIUM, 1 KG": ("bisugo", "Bisugo", "fish", 60, "kg", 1000),
    "FRESH FISH, CAESIO, DALAGANG-BUKID, MEDIUM, 1 KG": ("dalagang", "Dalagang-bukid", "fish", 60, "kg", 1000),
    "FRESH SHRIMP, SUAJE, MEDIUM, 1 KG": ("suahe", "Shrimp, suahe", "fish", 30, "kg", 1000),
    "FRESH SHRIMP, SUGPO, MEDIUM, 1 KG": ("sugpo", "Shrimp, sugpo", "fish", 30, "kg", 1000),
    "FRESH CRABS, ALIMANGO, MEDIUM, 1 KG": ("alimango", "Crab, alimango", "fish", 30, "kg", 1000),
    "STRING BEANS, 1 KG": ("sitaw", "Sitaw (string beans)", "vegetables", 50, "kg", 1000),
    "BAGUIO BEANS, 1 KG": ("baguio", "Baguio beans", "vegetables", 50, "kg", 1000),
    "EGGPLANT, LONG, PURPLE, 1 KG": ("talong", "Talong (eggplant)", "vegetables", 50, "kg", 1000),
    "TOMATO, 1 KG": ("tomato", "Tomato", "vegetables", 40, "kg", 1000),
    "BITTER GOURD (AMPALAYA), FRUIT, 1 KG": ("ampalaya", "Ampalaya", "vegetables", 40, "kg", 1000),
    "CHAYOTE, 1 KG": ("sayote", "Sayote", "vegetables", 50, "kg", 1000),
    "COMMON GOURD (UPO), 1 KG": ("upo", "Upo (bottle gourd)", "vegetables", 50, "kg", 1000),
    "SQUASH, 1 KG": ("kalabasa", "Kalabasa (squash)", "vegetables", 50, "kg", 1000),
    "CABBAGE, 1 KG": ("repolyo", "Repolyo (cabbage)", "vegetables", 50, "kg", 1000),
    "PECHAY, CHINESE, 1 KG": ("pechay_c", "Pechay, Chinese", "vegetables", 50, "kg", 1000),
    "PECHAY, NATIVE, 1 KG": ("pechay_n", "Pechay, native", "vegetables", 50, "kg", 1000),
    "CAMOTE TOPS, 1 KG": ("talbos", "Talbos ng kamote", "vegetables", 40, "kg", 1000),
    "KANGKONG, 1 KG": ("kangkong", "Kangkong", "vegetables", 40, "kg", 1000),
    "CARROT, 1 KG": ("carrot", "Carrot", "vegetables", 30, "kg", 1000),
    "GARLIC, NATIVE, 1 KG": ("garlic_n", "Garlic, native", "condiments", 4, "kg", 1000),
    "GARLIC, IMPORTED, 1 KG": ("garlic_i", "Garlic, imported", "condiments", 4, "kg", 1000),
    "ONION RED CREOLE (BERMUDA RED), 1 KG": ("onion", "Onion, red", "condiments", 8, "kg", 1000),
    "GINGER, LOOSE, 1 KG": ("ginger", "Luya (ginger)", "condiments", 4, "kg", 1000),
    "FRESH FRUIT, BANANA, LAKATAN, MEDIUM, 1 KG": ("lakatan", "Banana, lakatan", "fruits", 60, "kg", 1000),
    "FRESH FRUIT, BANANA, LATUNDAN, MEDIUM, 1 KG": ("latundan", "Banana, latundan", "fruits", 60, "kg", 1000),
    "FRESH FRUIT, BANANA, SABA, MEDIUM, 1 KG": ("saba", "Banana, saba", "fruits", 60, "kg", 1000),
    "FRESH FRUIT, MANGO, KALABAW, RIPE, MEDIUM, 1 KG": ("mango", "Mango, carabao", "fruits", 50, "kg", 1000),
    "FRESH FRUIT, MANGO, PIKO, RIPE, MEDIUM, 1 KG": ("mango_p", "Mango, piko", "fruits", 50, "kg", 1000),
    "FRESH FRUIT, PAPAYA, MEDIUM, 1 KG": ("papaya", "Papaya, ripe", "fruits", 60, "kg", 1000),
    "FRESH FRUIT, PINEAPPLE, PINYA, MEDIUM, 1 KG": ("pinya", "Pineapple", "fruits", 50, "kg", 1000),
    "FRESH FRUIT, ORANGE, DALANDAN, MEDIUM, 1 KG": ("dalandan", "Dalandan", "fruits", 50, "kg", 1000),
    "CALAMANSI, LOOSE, 1 KG": ("calamansi", "Calamansi", "fruits", 8, "kg", 1000),
    "MATURED COCONUT, MEDIUM, 1 PC": ("coconut", "Coconut, mature", "fruits", 15, "pc", 1000),
    "SRA REFINED SUGAR, 1 KG": ("sugar_w", "Sugar, refined", "sugar", 10, "kg", 1000),
    "SRA RAW SUGAR, 1 KG": ("sugar_b", "Sugar, brown", "sugar", 10, "kg", 1000),
}
# Special rice and pure duplicates are excluded: same composition as cheaper entries.
EXCLUDED = {"RICE, SPECIAL, 1 KG", "FRESH PORK, SPARE RIBS, 1 KG"}

GROUP_LABELS = {
    "cereals": "Rice & corn", "roots": "Root crops", "pulses": "Beans & nuts", "meat": "Meat",
    "eggs": "Eggs", "fish": "Fish & seafood", "vegetables": "Vegetables", "condiments": "Spices",
    "fruits": "Fruits", "sugar": "Sugar",
}
# Groups that count as good-quality protein (animal sources and legumes)
QUALITY_PROTEIN_GROUPS = {"pulses", "meat", "eggs", "fish"}

# Diet rules (per member, all scaled by the member's energy need)
RULES = {
    "energy_max": 1.10,              # energy at most 110% of need
    "cereal_energy_share_max": 0.65, # rice and corn give at most 65% of energy
    "sugar_energy_share_max": 0.05,  # free sugars well under the 10% PDRI limit
    "quality_protein_share_min": 0.35,  # at least 35% of the protein need from animal foods or legumes
    "veg_min_g_per_1000kcal": 100,   # Pinggang Pinoy: a third of the plate is vegetables
}
