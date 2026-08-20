const fs = require('fs');
const file = 'src/context/AppContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const itemImages = {
  'Samosa (4 pcs)': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  'Pakora Mix': 'https://images.unsplash.com/photo-1596450514735-111a2fe02935?auto=format&fit=crop&w=600&q=80',
  'Uggani Bajji': 'https://images.unsplash.com/photo-1626079986343-41bbd6a2f323?auto=format&fit=crop&w=600&q=80',
  'Chicken Curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
  'Mutton Curry': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
  'Paneer Butter Masala': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&w=600&q=80',
  'Chana Masala': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  'Rayalaseema Chicken Biryani': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=600&q=80',
  'Rayalaseema Mutton Biryani': 'https://images.unsplash.com/photo-1589302168068-944d15260c66?auto=format&fit=crop&w=600&q=80',
  'Vegetable Biryani': 'https://images.unsplash.com/photo-1630409351052-eb02fbef802e?auto=format&fit=crop&w=600&q=80',
  'Naan (2 pcs)': 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=600&q=80',
  'Jowar Roti (3 pcs)': 'https://images.unsplash.com/photo-1599321955726-e04842669811?auto=format&fit=crop&w=600&q=80',
  'Paratha (2 pcs)': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
  'Plain Rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80',
  'Jeera Rice': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
  'Gulab Jamun (4 pcs)': 'https://images.unsplash.com/photo-1666190092159-3171cf470b53?auto=format&fit=crop&w=600&q=80',
  'Kheer': 'https://images.unsplash.com/photo-1580226456012-70b92eb1db59?auto=format&fit=crop&w=600&q=80',
  'Jalebi': 'https://images.unsplash.com/photo-1615486511484-91a7f0bebfcc?auto=format&fit=crop&w=600&q=80',
  'Masala Chai': 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=600&q=80',
  'Lassi': 'https://images.unsplash.com/photo-1625860533264-9df920f5c09e?auto=format&fit=crop&w=600&q=80',
  'Mango Juice': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
  'Curry Rice Combo': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
  'Family Feast': 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=600&q=80',
  'Prawn Biryani': 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
  'Buttermilk': 'https://images.unsplash.com/photo-1601050690082-a3843f548079?auto=format&fit=crop&w=600&q=80'
};

content = content.replace(/\{ id: \d+, name: '([^']+)',[^}]+\}/g, (match, name) => {
  if (itemImages[name]) {
    return match.replace(/image: 'https:\/\/images.unsplash.com[^']+'/, `image: '${itemImages[name]}'`);
  }
  return match;
});

fs.writeFileSync(file, content);
console.log('Updated with unique images.');
