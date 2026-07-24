const fs = require('fs');
let content = fs.readFileSync('src/pages/MyCourses.tsx', 'utf8');

content = content.replace(
  /console\.error\('Error fetching courses:', error\);/,
  "console.error('Error fetching courses:', JSON.stringify(error, null, 2));"
);

fs.writeFileSync('src/pages/MyCourses.tsx', content);
