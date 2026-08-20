const fs = require('fs');

const file = 'src/pages/GroceryPOS.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('FALLBACK_FOOD_IMAGE')) {
  content = content.replace(
    "import { useApp } from '../context/AppContext';",
    "import { useApp, FALLBACK_FOOD_IMAGE } from '../context/AppContext';"
  );
}

content = content.replace(
  /<img src=\{item\.image\} alt=\{item\.name\} className="grocery-product-image" \/>/g,
  `<img src={item.image || FALLBACK_FOOD_IMAGE} alt={item.name} className="grocery-product-image" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_FOOD_IMAGE; }} />`
);

content = content.replace(
  /<img src=\{item\.image\} alt=\{item\.name\} className="grocery-cart-item-image" \/>/g,
  `<img src={item.image || FALLBACK_FOOD_IMAGE} alt={item.name} className="grocery-cart-item-image" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_FOOD_IMAGE; }} />`
);

fs.writeFileSync(file, content);
console.log('Updated GroceryPOS.jsx');
