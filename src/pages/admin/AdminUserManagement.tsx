import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

interface StudentData {
  id: string;
  name: string;
  email: string;
  joined: string;
  courses: number;
}

export function AdminUserManagement() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<'error' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      setIsLoading(true);
      setErrorState(null);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          created_at
        `)
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching students:', usersError);
        setErrorState('error');
        return;
      }

      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('status', 'active');

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        setErrorState('error');
        return;
      }

      const activeCounts: Record<string, number> = {};
      if (enrollmentsData) {
        enrollmentsData.forEach(enrollment => {
          if (enrollment.user_id) {
             activeCounts[enrollment.user_id] = (activeCounts[enrollment.user_id] || 0) + 1;
          }
        });
      }

      const mappedStudents: StudentData[] = (usersData || []).map((user: any) => ({
        id: user.id,
        name: user.full_name || 'طالب غير معروف',
        email: user.email || 'غير متوفر',
        joined: new Date(user.created_at).toLocaleDateString('ar-EG'),
        courses: activeCounts[user.id] || 0,
      }));

      setStudents(mappedStudents);
    } catch (e) {
      console.error(e);
      setErrorState('error');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredStudents = students.filter(student => {
    const q = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="lg:pr-72 pt-8 pb-24 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-primary-900 mb-8">إدارة الطلاب</h1>
          
          <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-primary-200 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                <input 
                  type="text" 
                  placeholder="ابحث بالاسم أو البريد..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 bg-primary-50 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 transition-colors"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-primary-50 text-primary-600 font-medium border-b border-primary-200">
                  <tr>
                    <th className="py-4 px-6 text-sm">الاسم</th>
                    <th className="py-4 px-6 text-sm">البريد الإلكتروني</th>
                    <th className="py-4 px-6 text-sm">تاريخ الانضمام</th>
                    <th className="py-4 px-6 text-sm">عدد الكورسات النشطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
                        </div>
                      </td>
                    </tr>
                  ) : errorState === 'error' ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-danger-600">
                          <AlertCircle className="w-10 h-10 mb-4" />
                          <p className="mb-4 font-medium">حدث خطأ أثناء تحميل البيانات</p>
                          <Button variant="primary" onClick={fetchStudents}>
                            إعادة المحاولة
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-primary-500">
                        لا توجد بيانات مطابقة للبحث
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-primary-900">{student.name}</td>
                        <td className="py-4 px-6 text-primary-600" dir="ltr">{student.email}</td>
                        <td className="py-4 px-6 text-primary-600" dir="ltr">{student.joined}</td>
                        <td className="py-4 px-6 text-primary-600 font-bold">{student.courses}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
