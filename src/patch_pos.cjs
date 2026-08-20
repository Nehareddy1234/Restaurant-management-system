const fs = require('fs');
const file = 'src/pages/POS.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('FALLBACK_FOOD_IMAGE')) {
  content = content.replace(
    "import { useApp } from '../context/AppContext';",
    "import { useApp, FALLBACK_FOOD_IMAGE } from '../context/AppContext';"
  );
}

const oldDiv = `<div
                className="menu-card-image"
                style={{
                  backgroundImage: \`url(\${item.image && item.image.trim() ? item.image : 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=200&h=200'})\`
                }}
              >
                {getCartQuantity(item.id) > 0 && (
                  <span className="menu-item-qty-badge">{getCartQuantity(item.id)}</span>
                )}
              </div>`;

const newDiv = `<div className="menu-card-image" style={{ position: 'relative', padding: 0, overflow: 'hidden' }}>
                <img 
                  src={item.image && item.image.trim() ? item.image : FALLBACK_FOOD_IMAGE} 
                  alt={item.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
                  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_FOOD_IMAGE; }} 
                />
                {getCartQuantity(item.id) > 0 && (
                  <span className="menu-item-qty-badge" style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2 }}>{getCartQuantity(item.id)}</span>
                )}
              </div>`;

content = content.replace(oldDiv, newDiv);
fs.writeFileSync(file, content);
console.log('Updated POS.jsx');
