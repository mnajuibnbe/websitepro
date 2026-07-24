const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const repl of replacements) {
    if (typeof repl.from === 'string') {
        content = content.replace(repl.from, repl.to);
    } else {
        content = content.replace(repl.from, repl.to);
    }
  }
  
  if (content !== original) {
    if (!content.includes('useAuth') && (content.includes('user') || content.includes('session'))) {
      content = "import { useAuth } from '" + getUseAuthImportPath(filePath) + "';\n" + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function getUseAuthImportPath(filePath) {
  const depth = filePath.split('/').length - 2; // src/pages/file.tsx -> depth 1 -> ../
  if (depth === 1) return '../contexts/AuthContext';
  if (depth === 2) return '../../contexts/AuthContext';
  if (depth === 3) return '../../../contexts/AuthContext';
  return './contexts/AuthContext';
}

// src/pages/Dashboard.tsx
replaceInFile('src/pages/Dashboard.tsx', [
  {
    from: /const \{ data: userData \} = await supabase\.auth\.getUser\(\);\s+if \(userData\?\.user\) \{/,
    to: `if (user) {`
  },
  {
    from: `eq('user_id', userData.user.id)`,
    to: `eq('user_id', user.id)`
  },
  {
    from: `export function Dashboard() {`,
    to: `export function Dashboard() {\n  const { user } = useAuth();`
  }
]);

// src/pages/MyCourses.tsx
replaceInFile('src/pages/MyCourses.tsx', [
  {
    from: /const \{ data: userData \} = await supabase\.auth\.getUser\(\);\s+if \(userData\?\.user\) \{/,
    to: `if (user) {`
  },
  {
    from: `eq('user_id', userData.user.id)`,
    to: `eq('user_id', user.id)`
  },
  {
    from: `export function MyCourses() {`,
    to: `export function MyCourses() {\n  const { user } = useAuth();`
  }
]);

// src/pages/admin/AdminDashboard.tsx
replaceInFile('src/pages/admin/AdminDashboard.tsx', [
  {
    from: /async function checkAuthAndLoadData\(\) \{[\s\S]*?loadPendingEnrollments\(\);\n\s*\} catch \(e\) \{[\s\S]*?\}\n\s*\}/,
    to: `async function checkAuthAndLoadData() {\n    if (!user || user.email !== 'm.najuib.nbe@gmail.com') {\n      navigate('/dashboard');\n      return;\n    }\n    setIsCheckingAuth(false);\n    loadPendingEnrollments();\n  }`
  },
  {
    from: `export function AdminDashboard() {`,
    to: `export function AdminDashboard() {\n  const { user } = useAuth();`
  }
]);

// src/pages/LessonPlayer.tsx
replaceInFile('src/pages/LessonPlayer.tsx', [
  {
    from: /const \{ data: userData \} = await supabase\.auth\.getUser\(\);\s+if \(!userData\?\.user\) return;/,
    to: `if (!user) return;`
  },
  {
    from: `user_id: userData.user.id`,
    to: `user_id: user.id`
  },
  {
    from: /const \{ data: userData \} = await supabase\.auth\.getUser\(\);\s+if \(userData\?\.user\) \{/,
    to: `if (user) {`
  },
  {
    from: `eq('user_id', userData.user.id)`,
    to: `eq('user_id', user.id)`
  }
]);

// src/components/dashboard/ContinueLearning.tsx
replaceInFile('src/components/dashboard/ContinueLearning.tsx', [
  {
    from: /const \{ data: userData \} = await supabase\.auth\.getUser\(\);\s+if \(!userData\?\.user\) return;/,
    to: `if (!user) return;`
  },
  {
    from: `eq('user_id', userData.user.id)`,
    to: `eq('user_id', user.id)`
  },
  {
    from: `export function ContinueLearning() {`,
    to: `export function ContinueLearning() {\n  const { user } = useAuth();`
  }
]);

// src/components/dashboard/MyCoursesList.tsx
replaceInFile('src/components/dashboard/MyCoursesList.tsx', [
  {
    from: /const \{ data: userData \} = await supabase\.auth\.getUser\(\);\s+if \(!userData\?\.user\) return;/,
    to: `if (!user) return;`
  },
  {
    from: `eq('user_id', userData.user.id)`,
    to: `eq('user_id', user.id)`
  },
  {
    from: `export function MyCoursesList() {`,
    to: `export function MyCoursesList() {\n  const { user } = useAuth();`
  }
]);

// src/components/dashboard/Sidebar.tsx
replaceInFile('src/components/dashboard/Sidebar.tsx', [
  {
    from: /const \{ data \} = await supabase\.auth\.getUser\(\);\s+if \(data\?\.user\) \{/,
    to: `if (user) {`
  },
  {
    from: `setUserEmail(data.user.email);`,
    to: `setUserEmail(user.email);`
  },
  {
    from: `export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {`,
    to: `export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {\n  const { user } = useAuth();`
  }
]);

// src/components/course-detail/EnrollmentCard.tsx
replaceInFile('src/components/course-detail/EnrollmentCard.tsx', [
  {
    from: /const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\s+if \(!session\) \{/,
    to: `if (!session) {`
  },
  {
    from: `export function EnrollmentCard({ courseId, price, originalPrice, hasDiscount, discountPercentage, features }: EnrollmentCardProps) {`,
    to: `export function EnrollmentCard({ courseId, price, originalPrice, hasDiscount, discountPercentage, features }: EnrollmentCardProps) {\n  const { user, session } = useAuth();`
  },
  {
    from: /const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\s+if \(session\) \{/,
    to: `if (session) {`
  },
  {
    from: `user_id: session.user.id`,
    to: `user_id: user?.id`
  },
  {
    from: `user_id: session?.user?.id`, // if already changed
    to: `user_id: user?.id`
  }
]);

