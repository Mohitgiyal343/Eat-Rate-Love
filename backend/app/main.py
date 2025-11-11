from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from .routes.sentiment_routes import router as sentiment_router
from .routes.yelp_routes import router as yelp_router
from .routes.upload_routes import router as upload_router
from .routes.auth_routes import router as auth_router
from .routes.user_routes import router as user_router
from .routes.post_routes import router as post_router
from .routes.media_routes import router as media_router
from .db_sqlite import init_db


def create_app() -> FastAPI:
    app = FastAPI(title="Eat Rate Love API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Initialize SQLite schema on startup
    @app.on_event("startup")
    def _startup():
        init_db()

    @app.get("/health")
    def health():
        return {"status": "ok"}

    app.include_router(sentiment_router, prefix="/sentiment", tags=["sentiment"])
    app.include_router(yelp_router, prefix="/yelp", tags=["yelp"])
    app.include_router(upload_router, prefix="/upload", tags=["upload"])
    app.include_router(auth_router, prefix="/auth", tags=["auth"])
    app.include_router(user_router, prefix="/users", tags=["users"])
    app.include_router(post_router, prefix="/posts", tags=["posts"])
    app.include_router(media_router, prefix="/media", tags=["media"])

    # Static serving for uploaded media
    app.mount("/media", StaticFiles(directory="media"), name="media")

    return app


app = create_app()
