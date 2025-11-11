from fastapi import APIRouter
from pydantic import BaseModel
from textblob import TextBlob
import yake

router = APIRouter()


class ReviewIn(BaseModel):
    review: str


kw_extractor = yake.KeywordExtractor(top=3)


@router.post("/analyze")
def analyze_review(payload: ReviewIn):
    review = payload.review
    blob = TextBlob(review)
    sentiment = "positive" if blob.sentiment.polarity > 0 else "negative" if blob.sentiment.polarity < 0 else "neutral"
    keywords = [kw for kw, score in kw_extractor.extract_keywords(review)]

    return {"review": review, "sentiment": sentiment, "keywords": keywords}
