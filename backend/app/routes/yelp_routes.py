from fastapi import APIRouter, Query
import pandas as pd
from pathlib import Path
from typing import Optional

router = APIRouter()

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "yelp_indian_restaurants.csv"


def load_dataset() -> pd.DataFrame:
    if not DATA_PATH.exists():
        return pd.DataFrame()
    df = pd.read_csv(DATA_PATH)
    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    return df


@router.get("/restaurants")
def list_restaurants(
    q: Optional[str] = Query(None, description="Search in name and categories"),
    city: Optional[str] = Query(None, description="Filter by city"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    df = load_dataset()
    if df.empty:
        return {"total": 0, "items": []}

    filtered = df
    if city:
        if "city" in filtered.columns:
            filtered = filtered[filtered["city"].str.contains(city, case=False, na=False)]
    if q:
        name_mask = filtered["name"].str.contains(q, case=False, na=False) if "name" in filtered.columns else False
        cat_mask = filtered["categories"].str.contains(q, case=False, na=False) if "categories" in filtered.columns else False
        filtered = filtered[name_mask | cat_mask]

    total = int(len(filtered))
    page = filtered.iloc[offset : offset + limit]

    items = page.to_dict(orient="records")
    return {"total": total, "items": items}


