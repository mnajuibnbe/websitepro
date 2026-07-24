const fs = require('fs');

function addImport(filePath, importStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('useAuth')) {
    content = importStr + '\n' + content;
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
}

addImport('src/components/dashboard/ContinueLearning.tsx', "import { useAuth } from '../../contexts/AuthContext';");
addImport('src/components/dashboard/MyCoursesList.tsx', "import { useAuth } from '../../contexts/AuthContext';");
addImport('src/pages/Dashboard.tsx', "import { useAuth } from '../contexts/AuthContext';");
addImport('src/pages/MyCourses.tsx', "import { useAuth } from '../contexts/AuthContext';");
addImport('src/pages/admin/AdminDashboard.tsx', "import { useAuth } from '../../contexts/AuthContext';");

// Fix Sidebar.tsx - data.user.email was replaced with user.email, but one `data` reference remains?
let sidebar = fs.readFileSync('src/components/dashboard/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(/if \(data\?\.user\) \{/g, 'if (user) {');
sidebar = sidebar.replace(/setUserEmail\(data\.user\.email\);/g, 'setUserEmail(user?.email || "");');
sidebar = sidebar.replace(/const \{ data \} = await supabase\.auth\.getUser\(\);/g, ''); // just to be sure
fs.writeFileSync('src/components/dashboard/Sidebar.tsx', sidebar);

// Fix MyCourses.tsx
let myCourses = fs.readFileSync('src/pages/MyCourses.tsx', 'utf8');
myCourses = myCourses.replace(/if \(userData\?\.user\) \{/g, 'if (user) {');
myCourses = myCourses.replace(/const \{ data: userData \} = await supabase\.auth\.getUser\(\);/g, '');
myCourses = myCourses.replace(/userData\.user\.id/g, 'user?.id');
fs.writeFileSync('src/pages/MyCourses.tsx', myCourses);

