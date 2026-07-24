const fs = require('fs');
let content = fs.readFileSync('src/pages/MyCourses.tsx', 'utf8');

const regex = /async function fetchMyCourses\(\) \{[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\}/;

const newFunc = `async function fetchMyCourses() {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        onNavigate('/login');
        return;
      }

      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('status', 'active');

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        return;
      }
      
      if (enrollmentsData && enrollmentsData.length > 0) {
        const courseIds = enrollmentsData.map(e => e.course_id).filter(id => id);
        
        if (courseIds.length > 0) {
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds);
            
          if (coursesError) {
            console.error('Error fetching courses:', coursesError);
          }
          
          const merged = enrollmentsData.map(enrollment => ({
            ...enrollment,
            courses: coursesData?.find(c => c.id === enrollment.course_id)
          }));
          
          setEnrollments(merged);
        } else {
          setEnrollments(enrollmentsData);
        }
      } else {
        setEnrollments([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }`;

content = content.replace(regex, newFunc);
fs.writeFileSync('src/pages/MyCourses.tsx', content);
