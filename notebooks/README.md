# notebooks/

| Notebook | What it is |
|---|---|
| `SAPAT_EDA.ipynb` | **Scratch notebook** for exploration and further analysis: dataset description, cleaning checks, food burden by decile, price of protein, household profiles (k-means), statistical tests. Kept for transparency; `scripts/` and `outputs/` are the source of record. |

## Run it

```bash
pip install -r requirements-notebook.txt
jupyter lab notebooks/SAPAT_EDA.ipynb
```

It finds `data_raw/` and `data_clean/` whether Jupyter starts in the repository root or in `notebooks/`. It needs the two raw FIES files in `data_raw/` (not committed, about 145 MB each; see `data_raw/README.md`). Every other input ships with the repository.

Checked on 24 Oct 2026: all 59 code cells run without errors from the repository layout (Python 3.13, pandas 3.0, scikit-learn 1.9, seaborn 0.13). Saved outputs are from that run's source data.
