const fs = require('fs');

const goodUrl = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80'; // food
const file = 'src/context/AppContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = new RegExp(`https://images.unsplash.com/photo-1484723091791-c0d7f51b68ce\\?auto=format&fit=crop&w=600&q=80`, 'g');
content = content.replace(regex, goodUrl);

fs.writeFileSync(file, content);
console.log('Fixed second broken url');
