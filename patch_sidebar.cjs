const fs = require('fs');
const file = 'src/components/dashboard/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      
      if (user?.email === 'm.najuib.nbe@gmail.com') {
        setIsAdmin(true);
      }
    }
    checkAdmin();
  }, []);`;

const replaceStr = `  const { hasPermission } = useAuthorization();
  const isAdmin = hasPermission(Permission.ADMIN_ACCESS);`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync(file, content);
