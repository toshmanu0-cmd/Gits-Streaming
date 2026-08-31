import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 10000;
const tmdbApiKey = process.env.TMDB_API_KEY;
const tmdbBaseUrl = "https://api.themoviedb.org/3";

const locFallbackMovies = [
  { title: "The Great Train Robbery", year: "1903", duration: "12 min", poster: "https://tile.loc.gov/storage-services/service/pnp/ppmsca/00600/00642v.jpg", sourceUrl: "https://www.loc.gov/item/00694220/" },
  { title: "The Flying Ace", year: "1926", duration: "66 min", poster: "https://tile.loc.gov/storage-services/service/mbrs/ntscrm/2021604060/2021604060.jpg", sourceUrl: "https://www.loc.gov/item/2021604060/" },
  { title: "Hell-bound Train", year: "1930", duration: "Feature film", poster: "https://tile.loc.gov/storage-services/service/mbrs/ntscrm/2021604059/2021604059.jpg", sourceUrl: "https://www.loc.gov/item/2021604059/" },
  { title: "Cicada", year: "1939", duration: "8 min", poster: "https://tile.loc.gov/storage-services/service/mbrs/ntscrm/02757922/02757922.gif", sourceUrl: "https://www.loc.gov/item/2021604034/" },
  { title: "American scrapbook", year: "1954", duration: "14 min", poster: "https://tile.loc.gov/storage-services/service/mbrs/ntscrm/01167887/01167887.jpg", sourceUrl: "https://www.loc.gov/item/2011600300/" },
  { title: "Manchuria", year: "1938", duration: "11 min", poster: "https://tile.loc.gov/storage-services/service/mbrs/ntscrm/01836472/01836472.jpg", sourceUrl: "https://www.loc.gov/item/fia55000092/" },
  { title: "King Edward's funeral, 1910", year: "1910", duration: "7 min", poster: "https://tile.loc.gov/storage-services/service/mbrs/ntscrm/01808210/01808210.jpg", sourceUrl: "https://www.loc.gov/item/mp76000025/" },
  { title: "TR speaking at Pueblo, Colorado, 1912", year: "1912", duration: "1 min", poster: "https://tile.loc.gov/storage-services/service/mbrs/ntscrm/01957559/01957559.jpg", sourceUrl: "https://www.loc.gov/item/mp76000005/" },
  { title: "Leonard Wood lays cornerstone of Roosevelt House, 1921", year: "1921", duration: "1 min", poster: "https://tile.loc.gov/storage-services/service/mbrs/ntscrm/00012922/00012922.jpg", sourceUrl: "https://www.loc.gov/item/mp76000064/" },
  { title: "TR speaking to suffragettes at Sagamore Hill, 1917", year: "1917", duration: "1 min", poster: "https://tile.loc.gov/storage-services/service/mbrs/ntscrm/00013079/00013079.jpg", sourceUrl: "https://www.loc.gov/item/mp76000066/" }
].map(movie => ({ ...movie, sourceName: "Library of Congress" }));

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

app.get("/api/search", async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    if (!query) return res.status(400).json({ error: "A search query is required." });
    res.json(await tmdb("/search/movie", { query }));
  } catch (error) {
    res.status(error.status || 502).json({ error: error.message });
  }
});

app.get("/api/trending", async (_req, res) => {
  try {
    res.json(await tmdb("/trending/movie/week"));
  } catch (error) {
    res.status(error.status || 502).json({ error: error.message });
  }
});

app.get("/api/discover", async (req, res) => {
  try {
    const genre = String(req.query.genre || "").trim();
    if (!/^\d+$/.test(genre)) return res.status(400).json({ error: "A valid genre ID is required." });
    res.json(await tmdb("/discover/movie", { with_genres: genre }));
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

app.get("/api/loc-movies", async (req, res) => {
  try {
    const url = new URL("https://www.loc.gov/collections/national-screening-room/");
    url.searchParams.set("fo", "json");
    url.searchParams.set("c", "48");
    url.searchParams.set("sp", String(Math.max(1, Number(req.query.page) || 1)));
    const search = String(req.query.search || "").trim();
    if (search) url.searchParams.set("q", search);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Library of Congress request failed (${response.status})`);
    const data = await response.json();
    const movies = (data.content?.results || [])
      .filter(item => item.url && item.title && item.resources?.length)
      .map(item => ({
        title: item.title,
        year: item.date || "",
        description: item.description?.[0] || "",
        duration: item.resources?.[0]?.duration ? `${Math.round(item.resources[0].duration / 60)} min` : "",
        poster: item.resources?.[0]?.poster || item.image_url?.[0] || "",
        sourceUrl: item.url,
        sourceName: "Library of Congress"
      }));

    res.json({ page: data.content?.pagination?.current || 1, movies });
  } catch (error) {
    // Keep the catalog usable if the live LOC API is temporarily rate-limited or challenged.
    res.json({ page: 1, movies: locFallbackMovies, fallback: true });
  }
});

app.use(express.static(__dirname));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(port, "0.0.0.0", () => {
  console.log(`TrailerFlix listening on port ${port}`);
});
