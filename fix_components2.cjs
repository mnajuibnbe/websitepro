const fs = require('fs');

function replaceStr(filePath, fromStr, toStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(fromStr)) {
    content = content.replace(new RegExp(fromStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), toStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

// MyCourses.tsx
replaceStr('src/pages/MyCourses.tsx', 'const { data: userData } = await supabase.auth.getUser();', '');
replaceStr('src/pages/MyCourses.tsx', 'if (userData?.user) {', 'if (user) {');
replaceStr('src/pages/MyCourses.tsx', "eq('user_id', userData.user.id)", "eq('user_id', user.id)");

// LessonPlayer.tsx
replaceStr('src/pages/LessonPlayer.tsx', 'const { data: userData } = await supabase.auth.getUser();', '');
replaceStr('src/pages/LessonPlayer.tsx', 'if (!userData?.user) return;', 'if (!user) return;');
replaceStr('src/pages/LessonPlayer.tsx', 'user_id: userData.user.id', 'user_id: user.id');
replaceStr('src/pages/LessonPlayer.tsx', 'if (userData?.user) {', 'if (user) {');
replaceStr('src/pages/LessonPlayer.tsx', "eq('user_id', userData.user.id)", "eq('user_id', user.id)");

// EnrollmentCard.tsx
replaceStr('src/components/course-detail/EnrollmentCard.tsx', 'const { data: { session } } = await supabase.auth.getSession();', '');
replaceStr('src/components/course-detail/EnrollmentCard.tsx', 'if (session?.user) {', 'if (session?.user) {');
replaceStr('src/components/course-detail/EnrollmentCard.tsx', 'session.user.id', 'session.user.id'); // wait, if I remove getSession, session from useAuth is used! Wait, session is not from useAuth in this file, it might not be.
// Let's modify EnrollmentCard directly
let ecContent = fs.readFileSync('src/components/course-detail/EnrollmentCard.tsx', 'utf8');
ecContent = ecContent.replace('export function EnrollmentCard() {', 'export function EnrollmentCard() {\n  const { user, session } = useAuth();');
ecContent = ecContent.replace(/const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\n/g, '');
ecContent = ecContent.replace(/session\.user\.id/g, 'user?.id');
ecContent = ecContent.replace(/session\?\.user/g, 'user');
fs.writeFileSync('src/components/course-detail/EnrollmentCard.tsx', ecContent);
console.log('Updated EnrollmentCard');

// ContinueLearning.tsx
replaceStr('src/components/dashboard/ContinueLearning.tsx', 'const { data: userData } = await supabase.auth.getUser();', '');
replaceStr('src/components/dashboard/ContinueLearning.tsx', 'if (!userData?.user) return;', 'if (!user) return;');
replaceStr('src/components/dashboard/ContinueLearning.tsx', "eq('user_id', userData.user.id)", "eq('user_id', user.id)");
replaceStr('src/components/dashboard/ContinueLearning.tsx', 'if (userData?.user) {', 'if (user) {'); // if any

// MyCoursesList.tsx
replaceStr('src/components/dashboard/MyCoursesList.tsx', 'const { data: userData } = await supabase.auth.getUser();', '');
replaceStr('src/components/dashboard/MyCoursesList.tsx', 'if (!userData?.user) return;', 'if (!user) return;');
replaceStr('src/components/dashboard/MyCoursesList.tsx', "eq('user_id', userData.user.id)", "eq('user_id', user.id)");
replaceStr('src/components/dashboard/MyCoursesList.tsx', 'if (userData?.user) {', 'if (user) {');

// Sidebar.tsx
replaceStr('src/components/dashboard/Sidebar.tsx', 'const { data } = await supabase.auth.getUser();', '');
replaceStr('src/components/dashboard/Sidebar.tsx', 'if (data?.user) {', 'if (user) {');
replaceStr('src/components/dashboard/Sidebar.tsx', 'setUserEmail(data.user.email);', 'setUserEmail(user.email);');

