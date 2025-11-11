import sqlite3
from pathlib import Path
from typing import Iterable, Tuple, Any, Dict, List
import json

DB_PATH = Path(__file__).resolve().parents[1] / "database" / "app.db"

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review TEXT NOT NULL,
    sentiment TEXT NOT NULL,
    keywords_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL,
    followee_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followee_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    caption TEXT DEFAULT '',
    image_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
"""


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(SCHEMA_SQL)


def insert_review(review: str, sentiment: str, keywords: Iterable[str]) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO reviews (review, sentiment, keywords_json) VALUES (?, ?, ?)",
            (review, sentiment, json.dumps(list(keywords))),
        )
        conn.commit()
        return int(cur.lastrowid)


def list_reviews(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        cur = conn.execute(
            "SELECT id, review, sentiment, keywords_json, created_at FROM reviews ORDER BY id DESC LIMIT ? OFFSET ?",
            (limit, offset),
        )
        rows = cur.fetchall()
        items = []
        for r in rows:
            items.append(
                {
                    "id": r["id"],
                    "review": r["review"],
                    "sentiment": r["sentiment"],
                    "keywords": json.loads(r["keywords_json"] or "[]"),
                    "created_at": r["created_at"],
                }
            )
        return items


def count_reviews() -> int:
    with get_conn() as conn:
        cur = conn.execute("SELECT COUNT(*) AS c FROM reviews")
        row = cur.fetchone()
        return int(row["c"] if row and "c" in row.keys() else 0)


# ---------- Users ----------
def create_user(username: str, email: str, password_hash: str) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, password_hash),
        )
        conn.commit()
        return int(cur.lastrowid)


def get_user_by_username(username: str) -> Dict[str, Any] | None:
    with get_conn() as conn:
        cur = conn.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cur.fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: int) -> Dict[str, Any] | None:
    with get_conn() as conn:
        cur = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def follow_user(follower_id: int, followee_id: int) -> None:
    if follower_id == followee_id:
        return
    with get_conn() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)",
            (follower_id, followee_id),
        )
        conn.commit()


def unfollow_user(follower_id: int, followee_id: int) -> None:
    with get_conn() as conn:
        conn.execute(
            "DELETE FROM follows WHERE follower_id = ? AND followee_id = ?",
            (follower_id, followee_id),
        )
        conn.commit()


def count_followers(user_id: int) -> int:
    with get_conn() as conn:
        cur = conn.execute("SELECT COUNT(*) AS c FROM follows WHERE followee_id = ?", (user_id,))
        return int(cur.fetchone()["c"])


def count_following(user_id: int) -> int:
    with get_conn() as conn:
        cur = conn.execute("SELECT COUNT(*) AS c FROM follows WHERE follower_id = ?", (user_id,))
        return int(cur.fetchone()["c"])


# ---------- Posts ----------
def create_post(user_id: int, image_url: str, caption: str) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO posts (user_id, image_url, caption) VALUES (?, ?, ?)",
            (user_id, image_url, caption),
        )
        conn.commit()
        return int(cur.lastrowid)


def like_post(user_id: int, post_id: int) -> None:
    with get_conn() as conn:
        conn.execute("INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)", (post_id, user_id))
        conn.commit()


def unlike_post(user_id: int, post_id: int) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM likes WHERE post_id = ? AND user_id = ?", (post_id, user_id))
        conn.commit()


def add_comment(user_id: int, post_id: int, text: str) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)",
            (post_id, user_id, text),
        )
        conn.commit()
        return int(cur.lastrowid)


def get_post_with_meta(post_id: int) -> Dict[str, Any] | None:
    with get_conn() as conn:
        post_cur = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,))
        post = post_cur.fetchone()
        if not post:
            return None
        likes_cur = conn.execute("SELECT COUNT(*) AS c FROM likes WHERE post_id = ?", (post_id,))
        comments_cur = conn.execute(
            "SELECT c.id, c.text, c.created_at, u.username FROM comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.id DESC",
            (post_id,),
        )
        return {
            "id": post["id"],
            "user_id": post["user_id"],
            "caption": post["caption"],
            "image_url": post["image_url"],
            "created_at": post["created_at"],
            "likes": int(likes_cur.fetchone()["c"]),
            "comments": [dict(r) for r in comments_cur.fetchall()],
        }


def list_feed_posts(user_id: int, limit: int, offset: int) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT p.*, u.username
            FROM posts p
            JOIN follows f ON f.followee_id = p.user_id
            JOIN users u ON u.id = p.user_id
            WHERE f.follower_id = ?
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?
            """,
            (user_id, limit, offset),
        )
        rows = cur.fetchall()
        items = []
        for r in rows:
            likes_cur = conn.execute("SELECT COUNT(*) AS c FROM likes WHERE post_id = ?", (r["id"],))
            comments_cur = conn.execute("SELECT COUNT(*) AS c FROM comments WHERE post_id = ?", (r["id"],))
            items.append(
                {
                    "id": r["id"],
                    "user_id": r["user_id"],
                    "username": r["username"],
                    "caption": r["caption"],
                    "image_url": r["image_url"],
                    "created_at": r["created_at"],
                    "likes": int(likes_cur.fetchone()["c"]),
                    "comments": int(comments_cur.fetchone()["c"]),
                }
            )
        return items


