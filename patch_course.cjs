const fs = require('fs');
const file = 'src/pages/admin/AdminCourseManager.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { Button } from '../../components/ui/Button';",
  "import { Button } from '../../components/ui/Button';\nimport { RequirePermission } from '../../components/auth/RequirePermission';\nimport { Permission } from '../../types/auth';"
);

content = content.replace(
  `            <Button variant="primary" className="flex items-center gap-2" onClick={() => navigate('/admin/courses/edit')}>
              <Plus className="w-5 h-5" />
              إضافة كورس جديد
            </Button>`,
  `            <RequirePermission permission={Permission.CREATE_COURSE}>
              <Button variant="primary" className="flex items-center gap-2" onClick={() => navigate('/admin/courses/edit')}>
                <Plus className="w-5 h-5" />
                إضافة كورس جديد
              </Button>
            </RequirePermission>`
);
fs.writeFileSync(file, content);
