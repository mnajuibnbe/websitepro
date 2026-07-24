const fs = require('fs');
let code = fs.readFileSync('src/components/courses/CourseGrid.tsx', 'utf8');

// Add useNavigate import if not exists
if (!code.includes("useNavigate")) {
    code = code.replace("import { X, Loader2 } from 'lucide-react';", "import { X, Loader2 } from 'lucide-react';\nimport { useNavigate } from 'react-router-dom';");
}

// Add useNavigate hook
if (!code.includes("const navigate = useNavigate();")) {
    code = code.replace("const { token } = useAuth();", "const { token } = useAuth();\n  const navigate = useNavigate();");
}

// Update onEnroll
code = code.replace(/onEnroll=\{[^}]+\}/g, "onEnroll={() => navigate(`/course/${course.id}`)}");

fs.writeFileSync('src/components/courses/CourseGrid.tsx', code);
