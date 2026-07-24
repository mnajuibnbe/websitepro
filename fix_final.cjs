const fs = require('fs');
let sidebar = fs.readFileSync('src/components/dashboard/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(/data\?\.user\?\.email/g, 'user?.email');
fs.writeFileSync('src/components/dashboard/Sidebar.tsx', sidebar);

let myCourses = fs.readFileSync('src/pages/MyCourses.tsx', 'utf8');
myCourses = myCourses.replace(/userData\?\.user/g, 'user');
fs.writeFileSync('src/pages/MyCourses.tsx', myCourses);
