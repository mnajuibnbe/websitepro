const fs = require('fs');

function addImport(filePath, importStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('import { useAuth }')) {
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
