"""Hand-built reference tables: region crosswalk and PSA commodity -> PhilFCT / WFP crosswalk.
Every proxy or assumption is labelled in `match_type` / `note` so it can be cited in the methodology."""
import pandas as pd

# ---------------- Region crosswalk ----------------
# fies_code = W_REGN in FIES PUF (2021: BARMM=15, 2023: BARMM=19). NIR exists only in PSA OpenSTAT prices.
REGIONS = [
    # key, short, fies_codes, psa_geo, wfp_admin1, poverty_label
    ("NCR", "NCR", [13], "..NCR - National Capital Region", "National Capital region", "National Capital Region (NCR)"),
    ("CAR", "CAR", [14], "..CAR - Cordillera Administrative Region", "Cordillera Administrative region", "Cordillera Administrative Region (CAR)"),
    ("R01", "I Ilocos", [1], "..I - Ilocos Region", "Region I", "Region I (Ilocos Region)"),
    ("R02", "II Cagayan Valley", [2], "..II - Cagayan Valley", "Region II", "Region II (Cagayan Valley)"),
    ("R03", "III Central Luzon", [3], "..III - Central Luzon", "Region III", "Region III (Central Luzon)"),
    ("R4A", "IV-A CALABARZON", [4], "..IV-A - CALABARZON", "Region IV-A", "Region IV-A (CALABARZON)"),
    ("R4B", "MIMAROPA", [17], "..MIMAROPA Region", "Region IV-B", "MIMAROPA Region"),
    ("R05", "V Bicol", [5], "..V - Bicol Region", "Region V", "Region V (Bicol Region)"),
    ("R06", "VI W. Visayas", [6], "..VI - Western Visayas", "Region VI", "Region VI (Western Visayas)"),
    ("R07", "VII C. Visayas", [7], "..VII - Central Visayas", "Region VII", "Region VII (Central Visayas)"),
    ("R08", "VIII E. Visayas", [8], "..VIII - Eastern Visayas", "Region VIII", "Region VIII (Eastern Visayas)"),
    ("R09", "IX Zamboanga Pen.", [9], "..IX - Zamboanga Peninsula", "Region IX", "Region IX (Zamboanga Peninsula)"),
    ("R10", "X N. Mindanao", [10], "..X - Northern Mindanao", "Region X", "Region X (Northern Mindanao)"),
    ("R11", "XI Davao", [11], "..XI - Davao Region", "Region XI", "Region XI (Davao Region)"),
    ("R12", "XII SOCCSKSARGEN", [12], "..XII - SOCCSKSARGEN", "Region XII", "Region XII (SOCCSKSARGEN)"),
    ("R13", "XIII Caraga", [16], "..XIII - Caraga", "Region XIII", "Caraga"),
    ("BARMM", "BARMM", [15, 19], "..BARMM - Bangsamoro Autonomous Region in Muslim Mindanao", "Autonomous region in Muslim Mindanao", "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)"),
    ("NIR", "NIR (prices only)", [], "..Negros Island Region (NIR)", None, None),
]
region_xwalk = pd.DataFrame(REGIONS, columns=["region_key", "region_short", "fies_codes", "psa_geo", "wfp_admin1", "poverty_label"])
FIES_TO_KEY = {c: k for k, _, codes, *_ in REGIONS for c in codes}
PSA_TO_KEY = {r[3]: r[0] for r in REGIONS}
WFP_TO_KEY = {r[4]: r[0] for r in REGIONS if r[4]}

# ---------------- Commodity crosswalk ----------------
# psa_commodity (exact OpenSTAT label) -> fct_food_id, food_group, unit grams, WFP equivalent, match type, note
C = [
 # Cereals
 ("RICE, REGULAR-MILLED, 1 KG","A019","cereals",1000,"Rice (regular, milled)","proxy","PhilFCT has no regular-milled entry; well-milled used (A012 glutinous rice in mapping file was wrong)"),
 ("RICE, WELL-MILLED, 1 KG","A019","cereals",1000,"Rice (well milled)","matched",""),
 ("RICE, SPECIAL, 1 KG","A019","cereals",1000,"Rice (special)","proxy","Special rice priced; well-milled composition used"),
 ("CORN GRITS, WHITE, 1 KG","A001","cereals",1000,"Semolina (white)","matched",""),
 ("CORN GRITS, YELLOW, 1 KG","A002","cereals",1000,"Semolina (yellow)","matched",""),
 ("WHOLE CORN GRAIN, YELLOW, 1 KG","A002","cereals",1000,"Maize (yellow)","proxy","Whole grain priced; yellow corn grits composition used"),
 # Roots & tubers
 ("POTATO, 1 KG","B007","roots & tubers",1000,"Potatoes (Irish)","matched",""),
 ("SWEET POTATO (CAMOTE), 1 KG","B009","roots & tubers",1000,"Sweet potatoes","proxy","Purple kamote composition used for generic camote"),
 ("GABI TUBERS, 1 KG","B015","roots & tubers",1000,"Taro","matched",""),
 # Pulses & nuts
 ("MONGGO, GREEN, 1 KG","C027","pulses & nuts",1000,"Beans (mung)","matched",""),
 ("RAW PEANUT, WITHOUT SHELL, 1 KG","C037","pulses & nuts",1000,"Groundnuts (shelled)","matched","Uses new export C037 Peanut w/o skin"),
 ("RAW PEANUT, UNSHELLED, 1 KG","C034","pulses & nuts",1000,"Groundnuts (unshelled)","matched",""),
 # Meat
 ("FRESH BEEF, PURE MEAT, 1 KG","F015","meat",1000,"Meat (beef)","matched",""),
 ("FRESH BEEF, MEAT WITH BONES, 1 KG","F035","meat",1000,"Meat (beef, chops with bones)","proxy","Beef shank (EP 89%) as bone-in beef"),
 ("FRESH PORK, KASIM, 1 KG","F157","meat",1000,"Meat (pork)","proxy","Boston butt lean (paypay) for kasim (shoulder)"),
 ("FRESH PORK, LIEMPO, 1 KG","F147","meat",1000,"Meat (pork, with fat)","matched",""),
 ("FRESH PORK, MEAT WITH BONES, 1 KG","F182","meat",1000,"Meat (pork, with bones)","proxy","Pork spare rib (EP 46%) as bone-in pork"),
 ("FRESH PORK, SPARE RIBS, 1 KG","F182","meat",1000,None,"matched",""),
 ("FRESH PORK, PATA, FORE (FRONT), 1 KG","F173","meat",1000,"Meat (pork, hock)","matched",""),
 ("FRESH CHICKEN, FULLY DRESSED, BROILER, 1 KG","F113","meat",1000,"Meat (chicken, whole)","matched",""),
 # Eggs
 ("FRESH EGG, CHICKEN, MEDIUM, 1 PC","H003","eggs",55,"Eggs","matched","Priced per piece; 55 g per medium egg as purchased (assumption)"),
 ("FRESH EGG, DUCK, MEDIUM, 1 PC","H007","eggs",70,"Eggs (duck)","matched","Priced per piece; 70 g per duck egg as purchased (assumption)"),
 # Fish & seafood
 ("FRESH FISH, ROUND SCAD, GALUNGGONG, MEDIUM, 1 KG","G105","fish & seafood",1000,"Fish (roundscad)","matched",""),
 ("FRESH FISH, TILAPIA, MEDIUM, 1 KG","G145","fish & seafood",1000,"Fish (tilapia)","matched",""),
 ("FRESH FISH, MILKFISH, BANGUS, MEDIUM, 1 KG","G074","fish & seafood",1000,"Fish (milkfish)","matched",""),
 ("FRESH FISH, TULINGAN (FRIGATE TUNA), MEDIUM, 1 KG","G146","fish & seafood",1000,"Fish (frigate tuna)","matched",""),
 ("FRESH FISH, ALOY/TULINGAN, MEDIUM, 1 KG","G146","fish & seafood",1000,None,"proxy","Frigate tuna composition"),
 ("FRESH FISH, SHORT MACKEREL (HASA HASA/KABAYAS/KABALYAS), MEDIUM, 1 KG","G073","fish & seafood",1000,"Fish (mackerel, fresh)","proxy","Indian mackerel (alumahan) composition for short mackerel"),
 ("FRESH FISH, SLIPMOUTH, SAPSAP, MEDIUM, 1 KG","G126","fish & seafood",1000,"Fish (slipmouth)","matched",""),
 ("FRESH FISH, NEMIMTERID, BISUGO, MEDIUM, 1 KG","G087","fish & seafood",1000,"Fish (threadfin bream)","matched",""),
 ("FRESH FISH, CAESIO, DALAGANG-BUKID, MEDIUM, 1 KG","G010","fish & seafood",1000,"Fish (redbelly yellowtail fusilier)","proxy","Goldband fusilier composition"),
 ("FRESH SHRIMP, SUAJE, MEDIUM, 1 KG","G119","fish & seafood",1000,"Shrimp (endeavor)","matched",""),
 ("FRESH SHRIMP, SUGPO, MEDIUM, 1 KG","G117","fish & seafood",1000,"Shrimp (tiger)","matched",""),
 ("FRESH CRABS, ALIMANGO, MEDIUM, 1 KG","G040","fish & seafood",1000,"Crab","matched","Uses new export G040 mud crab w/o fat (G036 crab fat in mapping file was wrong)"),
 # Vegetables
 ("STRING BEANS, 1 KG","D232","vegetables",1000,"Beans (string)","matched",""),
 ("BAGUIO BEANS, 1 KG","D206","vegetables",1000,"Beans (green, fresh)","matched",""),
 ("EGGPLANT, LONG, PURPLE, 1 KG","D073","vegetables",1000,"Eggplants","matched",""),
 ("TOMATO, 1 KG","D257","vegetables",1000,"Tomatoes","matched",""),
 ("BITTER GOURD (AMPALAYA), FRUIT, 1 KG","D018","vegetables",1000,"Bitter melon","matched",""),
 ("CHAYOTE, 1 KG","D050","vegetables",1000,"Choko","matched",""),
 ("COMMON GOURD (UPO), 1 KG","D025","vegetables",1000,"Bottle gourd","matched",""),
 ("SQUASH, 1 KG","D225","vegetables",1000,"Squashes","matched",""),
 ("CABBAGE, 1 KG","D035","vegetables",1000,"Cabbage","matched",""),
 ("PECHAY, CHINESE, 1 KG","D054","vegetables",1000,"Cabbage (chinese)","matched",""),
 ("PECHAY, NATIVE, 1 KG","D054","vegetables",1000,None,"proxy","Chinese cabbage composition for native pechay"),
 ("CAMOTE TOPS, 1 KG","D244","vegetables",1000,"Sweet Potato leaves","matched",""),
 ("KANGKONG, 1 KG","D242","vegetables",1000,"Water spinach","matched",""),
 ("CARROT, 1 KG","D039","vegetables",1000,"Carrots","matched",""),
 ("GARLIC, NATIVE, 1 KG","D084","condiments",1000,"Garlic (small)","matched",""),
 ("GARLIC, IMPORTED, 1 KG","D084","condiments",1000,"Garlic","matched",""),
 ("ONION RED CREOLE (BERMUDA RED), 1 KG","D141","condiments",1000,"Onions (red)","matched",""),
 ("GINGER, LOOSE, 1 KG","D304","condiments",1000,"Ginger","matched",""),
 # Fruits
 ("FRESH FRUIT, BANANA, LAKATAN, MEDIUM, 1 KG","E011","fruits",1000,"Bananas (lakatan)","matched",""),
 ("FRESH FRUIT, BANANA, LATUNDAN, MEDIUM, 1 KG","E012","fruits",1000,"Bananas (latundan)","matched",""),
 ("FRESH FRUIT, BANANA, SABA, MEDIUM, 1 KG","E014","fruits",1000,"Bananas (saba)","matched",""),
 ("FRESH FRUIT, MANGO, KALABAW, RIPE, MEDIUM, 1 KG","E051","fruits",1000,"Mangoes (carabao)","matched",""),
 ("FRESH FRUIT, MANGO, PIKO, RIPE, MEDIUM, 1 KG","E055","fruits",1000,"Mangoes (piko)","matched",""),
 ("FRESH FRUIT, PAPAYA, MEDIUM, 1 KG","E069","fruits",1000,"Papaya","matched",""),
 ("FRESH FRUIT, PINEAPPLE, PINYA, MEDIUM, 1 KG","E073","fruits",1000,"Pineapples","matched",""),
 ("FRESH FRUIT, ORANGE, DALANDAN, MEDIUM, 1 KG","E065","fruits",1000,"Mandarins","matched",""),
 ("CALAMANSI, LOOSE, 1 KG","E023","fruits",1000,"Calamansi","matched",""),
 ("MATURED COCONUT, MEDIUM, 1 PC","C006","fruits",None,"Coconut","matched","Priced per piece; grams per nut calibrated against WFP per-kg prices"),
 # Sugar (SRA, national, added separately)
 ("SRA REFINED SUGAR, 1 KG","M046","sugar",1000,"Sugar (white)","matched","SRA Metro Manila monitoring, applied to all regions"),
 ("SRA RAW SUGAR, 1 KG","M042","sugar",1000,"Sugar (brown)","proxy","SRA raw sugar priced; PhilFCT brown sugar composition"),
]
commodity_xwalk = pd.DataFrame(C, columns=["psa_commodity", "fct_food_id", "food_group", "grams_per_unit", "wfp_commodity", "match_type", "note"])

# PSA commodities deliberately not used (dried anchovy entry vs fresh dilis, no FCT export yet, branded duplicates)
EXCLUDED_NOTE = {
 "FRESH FISH, DILIS (ANCHOVIES), 1 KG": "Only DRIED anchovy (G150, 69 g protein) was exported; using it for fresh dilis would overstate protein ~4x",
 "FRESH CRABS, ALIMASAG, MEDIUM, 1 KG": "Blue crab meat entry not exported (G036 is crab fat)",
}
