import { useEffect, useState } from 'react';
import './App.css';
import { analyzeSentiment, searchRestaurants, uploadReview, listReviews } from './api';
import { AuthProvider, useAuth } from './auth/AuthContext';

function HeaderAuth() {
  const { user, logout, login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErr('');
    try {
      if (mode === 'login') {
        await login({ username, password });
      } else {
        await signup({ username, email, password });
      }
      setOpen(false);
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (e) {
      setErr(e.message || 'Auth failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (user) {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="muted">Signed in as <strong>{user.username}</strong></span>
        <button className="btn secondary" onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <>
      <button className="btn secondary" onClick={() => { setMode('login'); setOpen(true); }}>Log in</button>
      <button className="btn" onClick={() => { setMode('signup'); setOpen(true); }}>Sign up</button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{mode === 'login' ? 'Log in' : 'Sign up'}</h2>
              <button className="modal-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={onSubmit}>
                <div className="controls">
                  <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                {mode === 'signup' && (
                  <div className="controls">
                    <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                )}
                <div className="controls">
                  <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {err ? <div className="muted" style={{ color: 'var(--danger)' }}>{err}</div> : null}
                <div className="controls">
                  <button className="btn" type="submit" disabled={submitting}>
                    {submitting ? 'Please wait...' : (mode === 'login' ? 'Log in' : 'Create account')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AppInner() {
  const [review, setReview] = useState('');
  const [sentimentResult, setSentimentResult] = useState(null);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLimit, setReviewsLimit] = useState(10);
  const [reviewsOffset, setReviewsOffset] = useState(0);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [toast, setToast] = useState('');
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Keyboard shortcut: press "T" to toggle theme
  useEffect(() => {
    const onKey = (e) => {
      if (e.key?.toLowerCase() === 't') {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await analyzeSentiment(review);
      setSentimentResult(res);
      await uploadReview(review);
      const listed = await listReviews({ limit: reviewsLimit, offset: 0 });
      setReviews(listed.items || []);
      setReviewsTotal(listed.total || 0);
      setReviewsOffset(0);
      setToast('Review analyzed and saved!');
      setTimeout(() => setToast(''), 2000);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async (e) => {
    e.preventDefault();
    setLoadingRestaurants(true);
    setError('');
    try {
      const res = await searchRestaurants({ q: search, city, limit, offset });
      setRestaurants(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message || 'Search failed.');
    } finally {
      setLoadingRestaurants(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <span className="brand-title">Eat Rate Love</span>
          <span className="pill">v0.1</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn secondary" onClick={() => setShowModal(true)}>
            Project Highlights
          </button>
          <HeaderAuth />
          <label className="theme-toggle" aria-label="Toggle color theme">
            <input
              type="checkbox"
              checked={theme === 'light'}
              onChange={(e) => setTheme(e.target.checked ? 'light' : 'dark')}
              aria-checked={theme === 'light'}
              role="switch"
            />
            <span className="track">
              <span className="thumb">{theme === 'light' ? '☀️' : '🌙'}</span>
            </span>
          </label>
          {loading ? <div className="spinner" aria-label="loading" /> : null}
        </div>
      </div>

      <section className="hero">
        <div className="hero-title">Discover, Analyze, and Highlight Restaurants</div>
        <div className="hero-subtitle">Built with FastAPI, React, SQLite — including sentiment analysis and keyword extraction to enrich reviews.</div>
        <div className="hero-cta">
          <a className="btn" href="#sentiment">Try Sentiment</a>
          <a className="btn secondary" href="#search">Search Restaurants</a>
        </div>
        <div className="feature-badges">
          <span className="badge">TextBlob Sentiment</span>
          <span className="badge">YAKE Keywords</span>
          <span className="badge">CSV Dataset</span>
          <span className="badge">SQLite Persistence</span>
          <span className="badge">Docker + CI/CD</span>
        </div>
      </section>

      {error ? <div className="card" style={{ borderColor: 'rgba(255,107,107,0.4)' }}>
        <div style={{ color: 'var(--danger)' }}><strong>Error:</strong> {error}</div>
      </div> : null}

      <div className="grid">
        <section className="card" id="sentiment">
          <h2>Sentiment Analysis</h2>
          <div className="muted">Paste a review. We’ll analyze sentiment and extract top keywords.</div>
          <form onSubmit={onAnalyze}>
            <div className="controls">
              <textarea
                rows={4}
                placeholder="Amazing food and great service!"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>
            <div className="controls">
              <button className="btn" type="submit" disabled={loading || !review.trim()}>
                Analyze
              </button>
            </div>
          </form>
          {sentimentResult && (
            <div className="result">
              <div><strong>Sentiment:</strong> {sentimentResult.sentiment}</div>
              <div><strong>Keywords:</strong> {(sentimentResult.keywords || []).join(', ')}</div>
            </div>
          )}
        </section>

        <section className="card" id="search">
          <h2>Restaurant Search (CSV)</h2>
          <div className="muted">Search in name and categories. Filter by city, paginate results.</div>
          <form onSubmit={onSearch}>
            <div className="controls">
              <input
                type="text"
                placeholder="Search name or category"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <button className="btn" type="submit" disabled={loadingRestaurants}>Search</button>
            </div>
          </form>
          <div className="toolbar">
            <span className="muted">Total: {total}</span>
            <div className="pagination">
              <button
                className="btn secondary"
                onClick={() => { const next = Math.max(0, offset - limit); setOffset(next); onSearch(new Event('submit')); }}
                disabled={offset === 0 || loadingRestaurants}
              >
                Prev
              </button>
              <span>
                Page {Math.floor(offset / limit) + 1} / {Math.max(1, Math.ceil(total / limit))}
              </span>
              <button
                className="btn secondary"
                onClick={() => { const next = offset + limit; if (next < total) { setOffset(next); onSearch(new Event('submit')); } }}
                disabled={offset + limit >= total || loadingRestaurants}
              >
                Next
              </button>
            </div>
          </div>
          {loadingRestaurants ? (
            <div className="skeleton-list">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-item">
                  <div className="skeleton-line" style={{ width: '60%' }}></div>
                  <div className="skeleton-line" style={{ width: '40%' }}></div>
                </div>
              ))}
            </div>
          ) : restaurants.length === 0 && !loadingRestaurants ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">No restaurants found</div>
              <div className="empty-subtext">Try adjusting your search terms</div>
            </div>
          ) : (
            <ul className="list">
              {restaurants.map((r, idx) => (
                <li key={idx}>
                  <strong>{r.name || 'Unknown'}</strong>
                  {r.city ? ` — ${r.city}` : ''}
                  {r.categories ? ` — ${r.categories}` : ''}
                  {r.rating ? ` — Rating: ${r.rating}` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Recent Uploaded Reviews</h2>
        <div className="toolbar">
          <button className="btn secondary" onClick={async () => {
            setLoadingReviews(true);
            try {
              const listed = await listReviews({ limit: reviewsLimit, offset: reviewsOffset });
              setReviews(listed.items || []);
              setReviewsTotal(listed.total || 0);
            } catch (e) {
              setError(e.message || 'Failed to load reviews.');
            } finally {
              setLoadingReviews(false);
            }
          }}>Refresh</button>
          <select value={reviewsLimit} onChange={(e) => setReviewsLimit(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <span className="muted">Total: {reviewsTotal}</span>
          <div className="pagination">
            <button
              className="btn secondary"
              onClick={async () => {
                setLoadingReviews(true);
                const next = Math.max(0, reviewsOffset - reviewsLimit);
                setReviewsOffset(next);
                try {
                  const listed = await listReviews({ limit: reviewsLimit, offset: next });
                  setReviews(listed.items || []);
                  setReviewsTotal(listed.total || 0);
                } catch (e) {
                  setError(e.message || 'Failed to load reviews.');
                } finally {
                  setLoadingReviews(false);
                }
              }}
              disabled={reviewsOffset === 0 || loadingReviews}
            >
              Prev
            </button>
            <span>
              Page {Math.floor(reviewsOffset / reviewsLimit) + 1} / {Math.max(1, Math.ceil(reviewsTotal / reviewsLimit))}
            </span>
            <button
              className="btn secondary"
              onClick={async () => {
                setLoadingReviews(true);
                const next = reviewsOffset + reviewsLimit;
                if (next < reviewsTotal) {
                  setReviewsOffset(next);
                  try {
                    const listed = await listReviews({ limit: reviewsLimit, offset: next });
                    setReviews(listed.items || []);
                    setReviewsTotal(listed.total || 0);
                  } catch (e) {
                    setError(e.message || 'Failed to load reviews.');
                  } finally {
                    setLoadingReviews(false);
                  }
                }
              }}
              disabled={reviewsOffset + reviewsLimit >= reviewsTotal || loadingReviews}
            >
              Next
            </button>
          </div>
        </div>
        {loadingReviews ? (
          <div className="skeleton-list">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton-item">
                <div className="skeleton-line" style={{ width: '70%' }}></div>
                <div className="skeleton-line" style={{ width: '50%' }}></div>
                <div className="skeleton-line" style={{ width: '30%' }}></div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 && !loadingReviews ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-text">No reviews yet</div>
            <div className="empty-subtext">Analyze a review to see it here</div>
          </div>
        ) : (
          <ul className="list">
            {reviews.map((r) => (
              <li key={r.id}>
                <div><strong>{r.sentiment}</strong> — {r.review}</div>
                {r.keywords?.length ? <div className="muted">Keywords: {r.keywords.join(', ')}</div> : null}
                {r.created_at ? <div className="muted">{r.created_at}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      {toast ? <div className="toast">{toast}</div> : null}
      
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Project Highlights</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h3>Tech Stack</h3>
                <div className="tech-grid">
                  <div className="tech-item">
                    <strong>Backend:</strong> FastAPI, Python, SQLite, TextBlob, YAKE
                  </div>
                  <div className="tech-item">
                    <strong>Frontend:</strong> React, CSS3, JavaScript
                  </div>
                  <div className="tech-item">
                    <strong>DevOps:</strong> Docker, GitHub Actions, Render
                  </div>
                  <div className="tech-item">
                    <strong>Data:</strong> Yelp CSV Dataset, Pandas
                  </div>
                </div>
              </div>
              <div className="modal-section">
                <h3>Key Features</h3>
                <ul className="features-list">
                  <li>Sentiment analysis using TextBlob</li>
                  <li>Keyword extraction with YAKE</li>
                  <li>Restaurant search with CSV dataset</li>
                  <li>SQLite persistence for reviews</li>
                  <li>Pagination and filtering</li>
                  <li>Dark/Light theme toggle</li>
                  <li>Responsive design</li>
                  <li>Docker containerization</li>
                  <li>CI/CD with GitHub Actions</li>
                </ul>
              </div>
              <div className="modal-section">
                <h3>Links</h3>
                <div className="links-grid">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="link-item">
                    <span>🔗</span> GitHub Repository
                  </a>
                  <a href="https://fastapi.tiangolo.com" target="_blank" rel="noopener noreferrer" className="link-item">
                    <span>📚</span> FastAPI Docs
                  </a>
                  <a href="https://react.dev" target="_blank" rel="noopener noreferrer" className="link-item">
                    <span>⚛️</span> React Docs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
