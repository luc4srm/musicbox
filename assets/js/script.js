// ===============================
// MUSICBOX - PLAYLISTS (js/playlists.js)
// Player GLOBAL (não para ao trocar filtros) + Persistência entre páginas
// ===============================

// ===============================
// 1) DADOS: playlists + faixas
// ===============================
const playlists = [
  {
    title: "Pop",
    category: "Pop",
    cover: "assets/img/pop.jpg",
    desc: "",
    tracks: [
      { name: "Bird Of A Feather", file: "assets/audio/Bird-Of-A-Feather.mp3" },
      { name: "Manchild", file: "assets/audio/Manchild.mp3" },
      { name: "Abracadabra", file: "assets/audio/Abracadabra.mp3" },
      { name: "Man I Need", file: "assets/audio/I-Need.mp3" },
      { name: "Die With A Smile", file: "assets/audio/white.mp3" },
    ]
  },
  {
    title: "Rock",
    category: "Rock",
    cover: "assets/img/rock.jpg",
    desc: "",
    tracks: [
      { name: "Everything Ends", file: "assets/audio/Architects-Everything-Ends.mp3" },
      { name: "Lachryma", file: "assets/audio/Ghost-Lachryma.mp3" },
      { name: "Back In Black", file: "assets/audio/Back-In-Black.mp3" },
      { name: "Hotel California", file: "assets/audio/Eagles-Hotel-California.mp3" },
      { name: "Specter", file: "assets/audio/Bad-Omens-Specter.mp3" },
    ]
  },
  {
    title: "MPB",
    category: "MPB",
    cover: "assets/img/mpb.jpg",
    desc: "",
    tracks: [
      { name: "Amei Te Ver", file: "assets/audio/Amei-Te-Ver.mp3" },
      { name: "Malandragem", file: "assets/audio/Cassia-Eller-Malandragem.mp3" },
      { name: "Entre a Serpente e a Estrela", file: "assets/audio/Entre-a-Serpente-e-a-Estrela.mp3" },
      { name: "Feito a Maré", file: "assets/audio/Feito-a-Maré.mp3" },
      { name: "De Janeiro a Janeiro", file: "assets/audio/Roberta.mp3" },
    ]
  }
];

// ===============================
// 2) ELEMENTOS DA PÁGINA (podem não existir em todas)
// ===============================
const container = document.getElementById("playlistContainer");
const filterButtons = document.querySelectorAll(".filter-btn");

// ===============================
// 3) ELEMENTOS DO PLAYER GLOBAL (HTML)
// ===============================
const gpAudio = document.getElementById("gpAudio");
const gpPlay  = document.getElementById("gpPlay");
const gpTitle = document.getElementById("gpTitle");
const gpTime  = document.getElementById("gpTime");
const gpSeek  = document.getElementById("gpSeek");
const gpVol   = document.getElementById("gpVol");

// Se a página não tem o player, não faz nada (evita erro em páginas sem player)
if (!gpAudio || !gpPlay || !gpTitle || !gpTime || !gpSeek || !gpVol) {
  // nada a iniciar
} else {

  // ===============================
  // 4) ESTADO / FILA ATUAL
  // ===============================
  const gpIcon = gpPlay.querySelector("i");

  // Guarda a fila atual (playlist/track) para auto-next global
  let currentQueue = null; // { tracks:[...], index:number, playlistTitle:string }

  // ===============================
  // 5) PERSISTÊNCIA (localStorage)
  // ===============================
  const STORAGE_KEY = "musicbox_player_state";

  function saveState() {
    if (!currentQueue) return;
    const state = {
      playlistTitle: currentQueue.playlistTitle,
      index: currentQueue.index,
      time: gpAudio.currentTime || 0,
      volume: gpAudio.volume
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const state = JSON.parse(raw);
      const playlist = playlists.find(p => p.title === state.playlistTitle);
      if (!playlist) return;

      const idx = Number(state.index);
      const track = playlist.tracks[idx];
      if (!track) return;

      const queue = { tracks: playlist.tracks, index: idx, playlistTitle: playlist.title };

      // carrega sem forçar autoplay (pra não ser bloqueado)
      gpTitle.textContent = `${queue.playlistTitle} • ${track.name}`;
      gpAudio.src = track.file;
      gpAudio.currentTime = Number(state.time) || 0;
      gpAudio.volume = isFinite(state.volume) ? Number(state.volume) : Number(gpVol.value);

      currentQueue = queue;

      // ícone
      gpIcon.className = gpAudio.paused ? "fa-solid fa-play" : "fa-solid fa-pause";
    } catch (_) {}
  }

  // ===============================
  // 6) UTILITÁRIOS (tempo / UI)
  // ===============================
  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function updateGlobalTime() {
    const total = isFinite(gpAudio.duration) ? formatTime(gpAudio.duration) : "0:00";
    gpTime.textContent = `${formatTime(gpAudio.currentTime)} / ${total}`;

    if (isFinite(gpAudio.duration) && gpAudio.duration > 0) {
      gpSeek.value = String((gpAudio.currentTime / gpAudio.duration) * 100);
    }
  }

  // ===============================
  // 7) TROCAR FAIXA NO PLAYER GLOBAL
  // ===============================
  function setGlobalTrack(track, queue) {
    gpTitle.textContent = `${queue.playlistTitle} • ${track.name}`;
    gpAudio.src = track.file;
    gpAudio.currentTime = 0;
    gpAudio.volume = Number(gpVol.value);

    gpAudio.play().catch(() => {}); // pode ser bloqueado se não houver interação
    gpIcon.className = "fa-solid fa-pause";

    currentQueue = queue;
    saveState();
  }

  // ===============================
  // 8) RENDER DAS PLAYLISTS (somente se existir container)
  // ===============================
  function render(category = "all") {
    if (!container) return;

    container.innerHTML = "";

    const filtered = (category === "all")
      ? playlists
      : playlists.filter(p => p.category === category);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="card shadow">
            <div class="card-body text-center">
              <h5 class="card-title mb-2">Nenhuma playlist encontrada</h5>
              <p class="mb-0">Selecione outra categoria.</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    filtered.forEach((p) => {
      const tracksHtml = p.tracks.map((t, idx) => `
        <div class="mt-3">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <strong>${t.name}</strong>

            <button
              class="play-btn track-play"
              type="button"
              data-playlist="${p.title}"
              data-category="${p.category}"
              data-index="${idx}">
              <i class="fa-solid fa-play"></i>
            </button>
          </div>
        </div>
      `).join("");

      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4";
      col.setAttribute("data-aos", "fade-up");

      col.innerHTML = `
        <div class="card shadow h-100 overflow-hidden">
          <img
            src="${p.cover}"
            alt="Capa ${p.title}"
            style="height: 220px; width: 100%; object-fit: cover;"
          >
          <div class="card-body">
            <h5 class="card-title mb-1">${p.title}</h5>
            <small class="d-block mb-2">${p.category}</small>
            <p class="mb-0">${p.desc}</p>
            ${tracksHtml}
          </div>
        </div>
      `;

      container.appendChild(col);
    });
  }

  // ===============================
  // 9) FILTROS (botões)
  // ===============================
  // Filtros (somente se existirem botões)
  if (filterButtons && filterButtons.length) {
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const category = btn.getAttribute("data-category");
        render(category);

        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  // ===============================
  // 10) CLICK PLAY NAS FAIXAS (delegação)
  // ===============================
  // Clique em Play de uma faixa (toca no player global) — funciona onde existirem esses botões
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".track-play");
    if (!btn) return;

    const playlistTitle = btn.getAttribute("data-playlist");
    const idx = Number(btn.getAttribute("data-index"));

    const playlist = playlists.find(p => p.title === playlistTitle);
    if (!playlist) return;

    const queue = { tracks: playlist.tracks, index: idx, playlistTitle: playlist.title };
    setGlobalTrack(playlist.tracks[idx], queue);
  });

  // ===============================
  // 11) CONTROLES DO PLAYER (play/pause, seek, volume)
  // ===============================
  gpPlay.addEventListener("click", () => {
    if (!gpAudio.src) return;
    if (gpAudio.paused) {
      gpAudio.play().catch(() => {});
      gpIcon.className = "fa-solid fa-pause";
    } else {
      gpAudio.pause();
      gpIcon.className = "fa-solid fa-play";
    }
    saveState();
  });

  gpSeek.addEventListener("input", () => {
    if (isFinite(gpAudio.duration) && gpAudio.duration > 0) {
      gpAudio.currentTime = (Number(gpSeek.value) / 100) * gpAudio.duration;
      saveState();
    }
  });

  gpVol.addEventListener("input", () => {
    gpAudio.volume = Number(gpVol.value);
    saveState();
  });
  gpAudio.volume = Number(gpVol.value);

  gpAudio.addEventListener("loadedmetadata", updateGlobalTime);
  gpAudio.addEventListener("timeupdate", () => { updateGlobalTime(); saveState(); });
  gpAudio.addEventListener("pause", () => { gpIcon.className = "fa-solid fa-play"; saveState(); });
  gpAudio.addEventListener("play",  () => { gpIcon.className = "fa-solid fa-pause"; saveState(); });

  // ===============================
  // 12) AUTO-NEXT (quando a música acaba)
  // ===============================
  // Auto-next global (playlist → próxima playlist)
  gpAudio.addEventListener("ended", () => {
    if (!currentQueue) return;

    // ===== ADIÇÃO: loop garantido quando for a ÚLTIMA música da ÚLTIMA playlist =====
    const currentPlaylistIndexGuard = playlists.findIndex(p => p.title === currentQueue.playlistTitle);

    if (
      currentQueue.index === currentQueue.tracks.length - 1 &&
      currentPlaylistIndexGuard === playlists.length - 1
    ) {
      const firstPlaylist = playlists[0];
      const newQueue = { tracks: firstPlaylist.tracks, index: 0, playlistTitle: firstPlaylist.title };
      setGlobalTrack(firstPlaylist.tracks[0], newQueue);
      return;
    }
    // ===== FIM DA ADIÇÃO =====

    const nextIndex = currentQueue.index + 1;

    // próxima música da mesma playlist
    if (nextIndex < currentQueue.tracks.length) {
      currentQueue.index = nextIndex;
      const nextTrack = currentQueue.tracks[nextIndex];
      setGlobalTrack(nextTrack, currentQueue);
      return;
    }

    // acabou a playlist -> próxima playlist
    const currentPlaylistIndex = playlists.findIndex(p => p.title === currentQueue.playlistTitle);
    let nextPlaylistIndex = currentPlaylistIndex + 1;
    if (nextPlaylistIndex >= playlists.length) nextPlaylistIndex = 0;

    const nextPlaylist = playlists[nextPlaylistIndex];
    const newQueue = { tracks: nextPlaylist.tracks, index: 0, playlistTitle: nextPlaylist.title };
    setGlobalTrack(nextPlaylist.tracks[0], newQueue);
  });

  // ===============================
  // 13) INICIALIZAÇÃO
  // ===============================
  document.addEventListener("DOMContentLoaded", () => {
    // restaura última música/tempo/volume em qualquer página
    loadState();

    // renderiza playlists só se essa página for a playlists.html (ou tiver container)
    render();
  });
}
