"""Run every analysis and export step in order, from data_clean/ to the web apps' data.

Usage:
    python scripts/run_pipeline.py            # analysis + exports (about 2 minutes)
    python scripts/run_pipeline.py --raw DIR  # also rebuild data_clean/ from the raw downloads first (see data_raw/README.md)

Steps:
    1. build_clean_data.py   raw files -> data_clean/            (only with --raw)
    2. eda.py                data_clean/ -> outputs/eda_results.json
    3. compute_index.py      cost of a nutritious diet, every region and month -> outputs/cond_index.csv
    4. h1_typical_vs_sapat.py  H1 test -> outputs/h1_results.csv, docs/figures/
    5. export_app_data.py    -> web/shared/data/sapat_data.js
    6. export_local_prices.py -> web/shared/data/local_prices.js
    7. export_extra_nutrients.py -> web/shared/data/extra_nutrients.js
"""
import argparse
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run(*args):
    t = time.time()
    print(f"\n>>> python {' '.join(args)}", flush=True)
    subprocess.run([sys.executable, *args], cwd=ROOT, check=True)
    print(f"    done in {time.time() - t:.0f} s", flush=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--raw", help="folder with the raw downloads; rebuilds data_clean/ first")
    a = ap.parse_args()
    if a.raw:
        run("scripts/build_clean_data.py", a.raw, "data_clean")
    run("scripts/eda.py", "data_clean", "outputs/eda_results.json")
    run("scripts/compute_index.py")
    run("scripts/h1_typical_vs_sapat.py")
    run("scripts/export_app_data.py")
    run("scripts/export_local_prices.py")
    run("scripts/export_extra_nutrients.py")
    print("\nAll steps finished. Check with: npm test")


if __name__ == "__main__":
    main()
