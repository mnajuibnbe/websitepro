const fs = require('fs');
let code = fs.readFileSync('src/pages/LoginPage.tsx', 'utf8');

code = code.replace(
  '<a href="#/login" className="text-sm font-medium text-accent-600 hover:text-accent-700">نسيت كلمة المرور؟</a>',
  '<a href="#/forgot-password" onClick={(e) => { e.preventDefault(); onNavigate("#/forgot-password"); }} className="text-sm font-medium text-accent-600 hover:text-accent-700">نسيت كلمة المرور؟</a>'
);

fs.writeFileSync('src/pages/LoginPage.tsx', code);
