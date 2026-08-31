const gallery = document.getElementById("gallery");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("playerModal");
const player = document.getElementById("player");
const closePlayer = document.getElementById("closePlayer");
const trending = document.getElementById("trending");
const action = document.getElementById("action");
const comedy = document.getElementById("comedy");
const horror = document.getElementById("horror");
const animation = document.getElementById("animation");
const adventure = document.getElementById("adventure");
const scifi = document.getElementById("scifi");
const romance = document.getElementById("romance");
const thriller = document.getElementById("thriller");
const fantasy = document.getElementById("fantasy");
const mystery = document.getElementById("mystery");
const war = document.getElementById("war");
const family = document.getElementById("family");
const drama = document.getElementById("drama");
const western = document.getElementById("western");
const crime = document.getElementById("crime");

function makeCard(movie, showOverview = false) {
  if (!movie.poster_path) return null;

  const card = document.createElement("div");
  card.className = "thumbnail";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `Watch trailer for ${movie.title}`);

  const rating = Number(movie.vote_average || 0).toFixed(1);
  const overview = (movie.overview || "No overview available.").slice(0, 100);
  card.innerHTML = `
    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title} poster" loading="lazy">
    <span>${movie.title}</span>
    <div>⭐ ${rating}</div>
    ${showOverview ? `<p>${overview}${overview.length >= 100 ? "..." : ""}</p>` : ""}
  `;

  const openTrailer = () => loadTrailer(movie.id);
  card.addEventListener("click", openTrailer);
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTrailer();
    }
  });
  return card;
}

async function searchMovies(query) {
  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Search failed.");

    gallery.innerHTML = "";
    const cards = (data.results || []).map(movie => makeCard(movie, true)).filter(Boolean);
    if (!cards.length) {
      gallery.innerHTML = '<p class="emptyState">No movies found. Try another search.</p>';
      return;
    }
    cards.forEach(card => gallery.appendChild(card));
  } catch (error) {
    gallery.innerHTML = `<p class="emptyState">${error.message}</p>`;
  }
}

async function loadTrailer(movieId) {
  try {
    const res = await fetch(`/api/videos/${movieId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Trailer request failed.");

    const trailer = (data.results || []).find(video =>
      video.site === "YouTube" && ["Trailer", "Teaser"].includes(video.type)
    );

    if (!trailer) {
      alert("No trailer is available for this title yet.");
      return;
    }

    modal.style.display = "flex";
    document.body.classList.add("modalOpen");
    player.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`;
    closePlayer.focus();
  } catch (error) {
    alert(error.message);
  }
}

function closeTrailer() {
  modal.style.display = "none";
  document.body.classList.remove("modalOpen");
  player.src = "";
}

closePlayer.onclick = closeTrailer;
modal.addEventListener("click", event => {
  if (event.target === modal) closeTrailer();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal.style.display === "flex") closeTrailer();
});

searchBtn.onclick = () => {
  const query = searchInput.value.trim();
  if (query) searchMovies(query);
};
searchInput.addEventListener("keypress", event => {
  if (event.key === "Enter") searchBtn.click();
});

async function loadTrending() {
  try {
    const res = await fetch("/api/trending");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load trending movies.");
    gallery.innerHTML = "";
    (data.results || []).map(movie => makeCard(movie)).filter(Boolean).forEach(card => gallery.appendChild(card));
  } catch (error) {
    gallery.innerHTML = `<p class="emptyState">${error.message}</p>`;
  }
}

async function loadCategory(container, genreId) {
  try {
    const res = await fetch(`/api/discover?genre=${genreId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load this category.");
    container.innerHTML = "";
    (data.results || []).map(movie => makeCard(movie)).filter(Boolean).forEach(card => container.appendChild(card));
  } catch (error) {
    container.innerHTML = `<p class="emptyState">${error.message}</p>`;
  }
}

loadTrending();
loadCategory(action, 28);
loadCategory(comedy, 35);
loadCategory(horror, 27);
loadCategory(animation, 16);
loadCategory(adventure, 12);
loadCategory(scifi, 878);
loadCategory(romance, 10749);
loadCategory(thriller, 53);
loadCategory(fantasy, 14);
loadCategory(mystery, 9648);
loadCategory(war, 10752);
loadCategory(family, 10751);
loadCategory(drama, 18);
loadCategory(western, 37);
loadCategory(crime, 80);

searchInput.addEventListener("input", () => {
  if (searchInput.value.trim().length > 2) searchMovies(searchInput.value.trim());
});
