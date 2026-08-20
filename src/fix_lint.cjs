const fs = require('fs');
const file = 'src/context/AppContext.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const menuImageByCategory = \{[\s\S]*?\};\n\n/, '');
fs.writeFileSync(file, content);
console.log('Removed menuImageByCategory');
