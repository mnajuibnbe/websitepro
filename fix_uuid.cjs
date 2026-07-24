const fs = require('fs');
let content = fs.readFileSync('src/pages/MyCourses.tsx', 'utf8');

const regex = /const courseIds = enrollmentsData\.map\(e => e\.course_id\)\.filter\(id => id\);/;
const replacement = `const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const courseIds = enrollmentsData.map(e => String(e.course_id)).filter(id => id && uuidRegex.test(id));`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/MyCourses.tsx', content);
