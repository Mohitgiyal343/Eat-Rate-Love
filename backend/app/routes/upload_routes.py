from fastapi import APIRouter
from pydantic import BaseModel
from textblob import TextBlob
import yake
from ..db_sqlite import insert_review, list_reviews, count_reviews

router = APIRouter()


class ReviewIn(BaseModel):
    review: str


kw_extractor = yake.KeywordExtractor(top=3)


@router.post("/review")
def upload_review(payload: ReviewIn):
    review_text = payload.review
    blob = TextBlob(review_text)
    sentiment = (
        "positive" if blob.sentiment.polarity > 0 else "negative" if blob.sentiment.polarity < 0 else "neutral"
    )
    keywords = [kw for kw, score in kw_extractor.extract_keywords(review_text)]

    review_id = insert_review(review_text, sentiment, keywords)

    return {"id": review_id, "review": review_text, "sentiment": sentiment, "keywords": keywords}


@router.get("/reviews")
def get_reviews(limit: int = 50, offset: int = 0):
    items = list_reviews(limit=limit, offset=offset)
    total = count_reviews()
    return {"items": items, "total": total, "limit": limit, "offset": offset}


