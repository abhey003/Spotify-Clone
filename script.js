

const songs = [];
let currentSongIndex = 0;
let playlists = JSON.parse(localStorage.getItem('playlists')) || {};
const audioPlayer = document.getElementById("audio-player");
const detailsDiv = document.getElementById("details");
const playlistSongsContainer = document.getElementById("playlist-songs-container");
let filteredSongs = songs; // To hold filtered songs

// Show loading spinner
function showLoading() {
    const loadingSpinner = document.createElement("div");
    loadingSpinner.classList.add("spinner-border", "text-light");
    loadingSpinner.role = "status";
    loadingSpinner.innerHTML = '<span class="sr-only">Loading...</span>';
    document.getElementById("songs").appendChild(loadingSpinner);
}

// Hide loading spinner
function hideLoading() {
    const loadingSpinner = document.querySelector(".spinner-border");
    if (loadingSpinner) loadingSpinner.remove();
}

// Fetch songs from the iTunes API
async function fetchSongs() {
    showLoading();
    try {
        const response = await fetch('https://itunes.apple.com/search?term=raj bains&entity=song&limit=100');
        const data = await response.json();
        songs.push(...data.results.map(song => ({
            title: song.trackName,
            artist: song.artistName,
            album: song.collectionName,
            genre: song.primaryGenreName,
            url: song.previewUrl,
            artworkUrl100: song.artworkUrl100
        })));
        displaySongs();
    } catch (error) {
        console.error("Error fetching songs:", error);
        alert("Failed to fetch songs. Please try again.");
    } finally {
        hideLoading();
    }
}


// Search songs based on user input
function searchSongs() {
    const searchTerm = document.getElementById("search-input").value.toLowerCase();
    filteredSongs = songs.filter(song => 
        song.title.toLowerCase().includes(searchTerm) || 
        song.artist.toLowerCase().includes(searchTerm)
    );
    displaySongs(); // Refresh the displayed songs
}

// Display songs in the music library
function displaySongs() {
    const songsContainer = document.getElementById("songs");
    songsContainer.innerHTML = filteredSongs.map((song, index) => `
        <div class="list-group-item" onclick="playSong(${index})">
            <img src="${song.artworkUrl100}" class="thumbnail" alt="${song.title}">
            <span class="song-title">${song.title} - ${song.artist}</span>
            <button class="btn btn-primary btn-sm btn-add-to-playlist" onclick="addSongToPlaylist(document.getElementById('playlist-select').value, ${index}); event.stopPropagation();">Add to Playlist</button>
        </div>
    `).join('');
}

// Play selected song and show details
function playSong(index) {
    currentSongIndex = index;
    audioPlayer.src = filteredSongs[index].url; // Use filteredSongs for playback
    audioPlayer.play()
        .then(() => showSongDetails(index))
        .catch(error => {
            console.error("Error playing audio:", error);
            alert("Failed to play the audio. Please check your browser settings.");
        });
}

// Show details of the selected song
function showSongDetails(index) {
    const song = filteredSongs[index]; // Use filteredSongs for details
    detailsDiv.innerHTML = `
        <strong>Title:</strong> ${song.title}<br>
        <strong>Artist:</strong> ${song.artist}<br>
        <strong>Album:</strong> ${song.album}<br>
        <strong>Genre:</strong> ${song.genre}
    `;
}

// Playlist functionality
document.getElementById("playlist-form").addEventListener("submit", function(event) {
    event.preventDefault();
    const playlistName = document.getElementById("playlist-name").value.trim();
    if (playlistName) {
        createPlaylist(playlistName);
        document.getElementById("playlist-name").value = ''; // Clear input
    } else {
        alert("Playlist name cannot be empty.");
    }
});

// Create a new playlist
function createPlaylist(name) {
    if (!playlists[name]) { // Avoid duplicates
        playlists[name] = []; // Initialize empty playlist
        localStorage.setItem('playlists', JSON.stringify(playlists));
        displayPlaylists();
        updatePlaylistSelect();
    } else {
        alert("Playlist already exists.");
    }
}

// Add song to selected playlist
function addSongToPlaylist(playlistName, songIndex) {
    if (playlists[playlistName]) {
        const songToAdd = {
            title: filteredSongs[songIndex].title,
            artist: filteredSongs[songIndex].artist,
            album: filteredSongs[songIndex].album,
            genre: filteredSongs[songIndex].genre,
            url: filteredSongs[songIndex].url,
            artworkUrl100: filteredSongs[songIndex].artworkUrl100
        };
        if (!playlists[playlistName].some(song => song.title === songToAdd.title)) {
            playlists[playlistName].push(songToAdd);
            localStorage.setItem('playlists', JSON.stringify(playlists));
            alert(`Added "${songToAdd.title}" to "${playlistName}"`);
        } else {
            alert("Song already in the playlist.");
        }
    } else {
        alert("Please select a valid playlist.");
    }
}

// Display playlists
function displayPlaylists() {
    const playlistContainer = document.getElementById("playlist-container");
    playlistContainer.innerHTML = Object.keys(playlists).map(playlist => `
        <div class="playlist-item" onclick="showPlaylistSongs('${playlist}')">
            ${playlist}
        </div>
    `).join('');
}

// Update the playlist select dropdown
function updatePlaylistSelect() {
    const playlistSelect = document.getElementById("playlist-select");
    playlistSelect.innerHTML = '<option value="">Select a Playlist</option>';
    Object.keys(playlists).forEach(playlist => {
        const option = document.createElement("option");
        option.value = playlist;
        option.innerText = playlist;
        playlistSelect.appendChild(option);
    });
}

// Show songs in the selected playlist
function showPlaylistSongs(playlist) {
    playlistSongsContainer.innerHTML = '';
    if (playlists[playlist] && playlists[playlist].length > 0) {
        playlistSongsContainer.innerHTML = playlists[playlist].map((song, index) => `
            <div class="list-group-item" onclick="playSong(${songs.findIndex(s => s.title === song.title)})">
                <img src="${song.artworkUrl100}" class="thumbnail" alt="${song.title}">
                <span class="song-title">${song.title} - ${song.artist}</span>
                <button class="btn btn-danger btn-sm float-right" onclick="removeSongFromPlaylist('${playlist}', ${index}); event.stopPropagation();">Remove</button>
            </div>
        `).join('');
    } else {
        playlistSongsContainer.innerHTML = '<p>No songs in this playlist.</p>';
    }
}

// Remove song from the selected playlist
function removeSongFromPlaylist(playlist, songIndex) {
    playlists[playlist].splice(songIndex, 1);
    if (playlists[playlist].length === 0) {
        delete playlists[playlist];
    }
    localStorage.setItem('playlists', JSON.stringify(playlists));
    displayPlaylists();
    showPlaylistSongs(playlist);
}

// Initialize the app
fetchSongs();

// Event listener for audio player
audioPlayer.addEventListener('ended', () => {
    currentSongIndex = (currentSongIndex + 1) % filteredSongs.length; // Loop back to the start
    playSong(currentSongIndex);
});

// Add event listeners for Next and Previous buttons
document.getElementById("prev-btn").addEventListener("click", () => {
    currentSongIndex = (currentSongIndex - 1 + filteredSongs.length) % filteredSongs.length; // Go to previous song
    playSong(currentSongIndex);
});

document.getElementById("next-btn").addEventListener("click", () => {
    currentSongIndex = (currentSongIndex + 1) % filteredSongs.length; // Go to next song
});

// Display playlists on load
displayPlaylists();
updatePlaylistSelect();
