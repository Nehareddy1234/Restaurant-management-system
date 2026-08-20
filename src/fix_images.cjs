const fs = require('fs');

// We have 10 missing/404 image IDs in unsplash. Let's provide known good Unsplash food image IDs.
const validUnsplashUrls = [
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', // healthy food
  'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=600&q=80', // burger/fries
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', // bowl
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80', // pizza
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80', // pancakes
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=600&q=80', // sandwich
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80', // steak
  'https://images.unsplash.com/photo-1484723091791-c0d7f51b68ce?auto=format&fit=crop&w=600&q=80', // steak/potato
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=600&q=80', // pasta
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80'  // salad
];

const file = 'src/context/AppContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const badIds = [
  '1626079986343-41bbd6a2f323',
  '1631452180519-c014fe946bc0',
  '1589302168068-944d15260c66',
  '1630409351052-eb02fbef802e',
  '1599321955726-e04842669811',
  '1666190092159-3171cf470b53',
  '1580226456012-70b92eb1db59',
  '1615486511484-91a7f0bebfcc',
  '1625860533264-9df920f5c09e',
  '1601050690082-a3843f548079'
];

let currentIndex = 0;
for (const badId of badIds) {
    const regex = new RegExp(`https://images.unsplash.com/photo-${badId}\\?auto=format&fit=crop&w=600&q=80`, 'g');
    content = content.replace(regex, validUnsplashUrls[currentIndex]);
    currentIndex++;
}

fs.writeFileSync(file, content);
console.log('Fixed broken urls');
