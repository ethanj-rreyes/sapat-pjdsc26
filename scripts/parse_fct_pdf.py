"""Parse PhilFCT single-food PDF reports into a row of nutrients per 100 g EP."""
import re, subprocess, sys, pandas as pd
FIELDS={"energy_kcal":r"Energy, calculated \(kcal\)","protein_g":r"Protein \(g\)","fat_g":r"Total Fat \(g\)",
 "carb_g":r"Carbohydrate, total \(g\)","fiber_g":r"Fiber, total dietary \(g\)","calcium_mg":r"Calcium, Ca \(mg\)",
 "iron_mg":r"Iron, Fe \(mg\)","zinc_mg":r"Zinc, Zn \(mg\)","sodium_mg":r"Sodium, Na \(mg\)","vit_a_rae_ug":r"Retinol Activity Equivalent, RAE \(µg\)",
 "thiamin_mg":r"Thiamin, Vitamin B1 \(mg\)","riboflavin_mg":r"Riboflavin, Vitamin B2 \(mg\)","niacin_mg":r"Niacin \(mg\)","vit_c_mg":r"Ascorbic Acid, Vitamin C \(mg\)"}
def parse(path):
    t=subprocess.run(["pdftotext","-layout",path,"-"],capture_output=True,text=True).stdout
    g=lambda p: (m.group(1).strip() if (m:=re.search(p,t)) else None)
    row={"report_file":path.split("/")[-1],"fct_food_id":g(r"Food ID:\s*(\S+)"),"fct_food_name":g(r"Food name and Description:\s*(.+)"),
         "common_name":g(r"Alternate/Common name\(s\):\s*(.+)"),"ep_pct":g(r"Edible portion:\s*([\d.]+)")}
    for k,p in FIELDS.items():
        m=re.search(p+r"\s+([\d.]+|-)",t); row[k]=None if (not m or m.group(1)=="-") else float(m.group(1))
    row["ep_pct"]=float(row["ep_pct"]) if row["ep_pct"] else None
    return row
if __name__=="__main__":
    print(pd.DataFrame([parse(p) for p in sys.argv[1:]]).to_string())
