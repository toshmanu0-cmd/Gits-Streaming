import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 10000;
const tmdbApiKey = process.env.TMDB_API_KEY;
const tmdbBaseUrl = "https://api.themoviedb.org/3";

if (!tmdbApiKey) {
  console.error("Missing TMDB_API_KEY environment variable.");
  process.exit(1);
}

async function tmdb(pathname, query = {}) {
  const url = new URL(`${tmdbBaseUrl}${pathname}`);
  url.searchParams.set("api_key", tmdbApiKey);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.status_message || "TMDB request failed");
    error.status = response.status;
    throw error;
  }

  return data;
}

async function tmdbPages(pathname, query = {}, pageCount = 2) {
  const pages = [];
  for (let page = 1; page <= pageCount; page += 1) {
    pages.push(await tmdb(pathname, { ...query, page }));
  }

  const firstPage = pages[0];
  const seen = new Set();
  const results = pages.flatMap(page => page.results || []).filter(movie => {
    if (!movie.id || seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });

  return {
    ...firstPage,
    page: 1,
    pages_loaded: pages.length,
    total_results: firstPage.total_results || results.length,
    results
  };
}

app.get("/api/search", async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    if (!query) return res.status(400).json({ error: "A search query is required." });
    res.json(await tmdbPages("/search/movie", { query, include_adult: "false" }, 2));
  } catch (error) {
    res.status(error.status || 502).json({ error: error.message });
  }
});

app.get("/api/trending", async (_req, res) => {
  try {
    res.json(await tmdbPages("/trending/movie/week", {}, 2));
  } catch (error) {
    res.status(error.status || 502).json({ error: error.message });
  }
});

app.get("/api/discover", async (req, res) => {
  try {
    const genre = String(req.query.genre || "").trim();
    if (!/^\d+$/.test(genre)) return res.status(400).json({ error: "A valid genre ID is required." });
    res.json(await tmdbPages("/discover/movie", { with_genres: genre, include_adult: "false", sort_by: "popularity.desc" }, 2));
  } catch (error) {
    res.status(error.status || 502).json({ error: error.message });
  }
});

app.get("/api/videos/:movieId", async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.movieId)) return res.status(400).json({ error: "A valid movie ID is required." });
    res.json(await tmdb(`/movie/${req.params.movieId}/videos`));
  } catch (error) {
    res.status(error.status || 502).json({ error: error.message });
  }
});

app.use(express.static(__dirname));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(port, "0.0.0.0", () => {
  console.log(`TrailerFlix listening on port ${port}`);
});
