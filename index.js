const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Serve HTML files
app.use('/images', express.static(path.join(__dirname, 'images'))); // Serve static images

// Load database.json
const databasePath = path.join(__dirname, 'database.json');
let data = [];
if (fs.existsSync(databasePath)) {
  data = JSON.parse(fs.readFileSync(databasePath));
}

// 1️⃣ **Home Route**
app.get('/home', (req, res) => {
  const popularItems = data.filter(item => item.tag?.includes('popular'));
  const newReleaseItems = data.filter(item => item.tag?.includes('New release'));

  res.json({
    Popular: {
      Total: popularItems.length,
      items: popularItems.map(item => ({
        id: item.ID,
        name: item.name,
        img: item.img
      }))
    },
    'New release': {
      Total: newReleaseItems.length,
      items: newReleaseItems.map(item => ({
        id: item.ID,
        name: item.name,
        img: item.img
      }))
    }
  });
});

// 2️⃣ **Enhanced Query Route**
app.get('/query', (req, res) => {
  let filteredData = data;

  if (req.query.name) {
    const searchTerms = req.query.name.toLowerCase().split(/[\s&\-_%20]+/);
    filteredData = filteredData.filter(anime =>
      searchTerms.every(term =>
        anime.name.toLowerCase().includes(term) ||
        anime.othername?.some(alt => alt.toLowerCase().includes(term))
      )
    );
  }

  if (req.query.status) {
    filteredData = filteredData.filter(anime => anime.status.toLowerCase() === req.query.status.toLowerCase());
  }

  if (req.query.year) {
    filteredData = filteredData.filter(anime => anime.Release_year == req.query.year);
  }

  if (req.query.genre) {
    const genreQuery = req.query.genre.toLowerCase();
    filteredData = filteredData.filter(anime => anime.Genres?.some(genre => genre.toLowerCase() === genreQuery));
  }

  if (req.query.tag) {
    const tagQuery = req.query.tag.toLowerCase();
    filteredData = filteredData.filter(anime => anime.tag?.some(tag => tag.toLowerCase() === tagQuery));
  }

  res.json({
    Total: filteredData.length,
    items: filteredData.map(item => ({
      id: item.ID,
      name: item.name,
      img: item.img,
      status: item.status,
      year: item.Release_year,
      genres: item.Genres
    }))
  });
});

// 3️⃣ **Anime Details by ID**
app.get('/id/:id', (req, res) => {
  const animeId = parseInt(req.params.id, 10);
  const anime = data.find(item => item.ID === animeId);

  if (anime) {
    res.json(anime);
  } else {
    res.status(404).json({ message: 'Anime not found' });
  }
});

// 4️⃣ **Episode Details**
app.get('/episode/:episodeId', (req, res) => {
  const episodeId = parseInt(req.params.episodeId, 10);
  const anime = data.find(item => item.episodes?.some(ep => ep.id === episodeId));

  if (anime) {
    const episode = anime.episodes.find(ep => ep.id === episodeId);

    res.json({
      animeId: anime.ID,
      animeName: anime.name,
      id: episode.id,
      name: episode.name,
      poster: episode.poster,
      stream: episode.stream?.Embed || []
    });
  } else {
    res.status(404).json({ message: 'Episode not found' });
  }
});

// 5️⃣ **Video Quality Options**
app.get('/quality/:episodeId', (req, res) => {
  const episodeId = parseInt(req.params.episodeId, 10);
  const anime = data.find(item => item.episodes?.some(ep => ep.id === episodeId));

  if (anime) {
    const episode = anime.episodes.find(ep => ep.id === episodeId);
    res.json({
      total: episode.video?.length || 0,
      videos: episode.video || []
    });
  } else {
    res.status(404).json({ message: 'Episode not found' });
  }
});

// 6️⃣ **Slideshow Route**
app.get('/slideshow', (req, res) => {
  const slideshowItems = data.filter(item => item.SLIDESHOW === true);

  res.json({
    Total: slideshowItems.length,
    items: slideshowItems.map(item => ({
      ID: item.ID,
      name: item.name,
      img: item.img
    }))
  });
});

// 7️⃣ **Start the Server**
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
