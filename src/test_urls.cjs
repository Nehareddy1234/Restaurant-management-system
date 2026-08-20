const http = require('https');

const fetchUnsplashSearch = (query) => {
  return new Promise((resolve, reject) => {
    http.get(`https://unsplash.com/napi/search/photos?query=${query}&per_page=5`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.results.map(r => r.urls.regular));
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
};

(async () => {
  const images = await fetchUnsplashSearch('indian food');
  console.log(images);
})();
