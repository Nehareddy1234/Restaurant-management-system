const parser = require('@babel/parser');
const snippet = `<div className="customer-category-tabs">
  {categories.map(cat => (
    <button
      key={cat}
      onClick={() => setOrderType(cat)}
      className={\`customer-cart-type-btn \${orderType === cat ? 'active' : ''}\`}
    >{cat}</button>
  ))}
</div>`;
try {
  parser.parse(snippet, { sourceType: 'module', plugins: ['jsx'] });
  console.log('Category tabs parse OK');
} catch(e) {
  console.log('Error:', e.message, 'at', e.loc?.line);
}
