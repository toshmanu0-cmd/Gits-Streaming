const apiKey = "826446f6315c2770ec2d9f2b79b40cee";

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

async function searchMovies(query) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
  );

  const data = await res.json();

  gallery.innerHTML = "";

  data.results.forEach(movie => {
    if (!movie.poster_path) return;

    const card = document.createElement("div");
    card.className = "thumbnail";

card.innerHTML = `
  <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}">
  <span>${movie.title}</span>
  <div>⭐ ${movie.vote_average.toFixed(1)}</div>
  <p>${movie.overview.slice(0,100)}...</p>
`;
    card.onclick = () => loadTrailer(movie.id);

    gallery.appendChild(card);
  });
}

async function loadTrailer(movieId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}`
  );

  const data = await res.json();

  const trailer = data.results.find(
    v => v.site === "YouTube" && v.type === "Trailer"
  );

  if (!trailer) {
    alert("Trailer not found");
    return;
  }

  modal.style.display = "flex";
  player.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
}

closePlayer.onclick = () => {
  modal.style.display = "none";
  player.src = "";
};

searchBtn.onclick = () => {
  if (searchInput.value.trim()) {
    searchMovies(searchInput.value);
  }
};

searchInput.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});
async function loadTrending() {
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`
  );

  const data = await res.json();

  gallery.innerHTML = "";

  data.results.forEach(movie => {
    if (!movie.poster_path) return;

    const card = document.createElement("div");

    card.className = "thumbnail";

    card.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}">
      <span>${movie.title}</span>
      <div>⭐ ${movie.vote_average.toFixed(1)}</div>
    `;

    card.onclick = () => loadTrailer(movie.id);

    gallery.appendChild(card);
  });
}
async function loadCategory(container, genreId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreId}`
  );

  const data = await res.json();

  container.innerHTML = "";

  data.results.forEach(movie => {
    if (!movie.poster_path) return;

    const card = document.createElement("div");

    card.className = "thumbnail";

    card.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}">
      <span>${movie.title}</span>
    `;

    card.onclick = () => loadTrailer(movie.id);

    container.appendChild(card);
  });
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
  if(searchInput.value.length > 2){
    searchMovies(searchInput.value);
  }
});
