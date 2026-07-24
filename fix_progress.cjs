const fs = require('fs');
let content = fs.readFileSync('src/pages/MyCourses.tsx', 'utf8');

content = content.replace(
  /const progress = 0;/,
  "const progress: number = 0;"
);

fs.writeFileSync('src/pages/MyCourses.tsx', content);
