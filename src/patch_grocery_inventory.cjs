const fs = require('fs');

const file = 'src/pages/GroceryInventory.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('FALLBACK_FOOD_IMAGE')) {
  content = content.replace(
    "import { useApp } from '../context/AppContext';",
    "import { useApp, FALLBACK_FOOD_IMAGE } from '../context/AppContext';"
  );
}

content = content.replace(
  /<img src=\{item\.image\} alt=\{item\.name\} style=\{\{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' \}\} \/>/g,
  `<img src={item.image || FALLBACK_FOOD_IMAGE} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_FOOD_IMAGE; }} />`
);

fs.writeFileSync(file, content);
console.log('Updated GroceryInventory.jsx');
