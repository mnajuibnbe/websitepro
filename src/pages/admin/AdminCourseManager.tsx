import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RequirePermission } from '../../components/auth/RequirePermission';
import { Permission } from '../../types/auth';
import { supabase } from '../../lib/supabase';

export function AdminCourseManager() {
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      setIsLoading(true);
      const { data: dbCourses, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching DB courses:', error);
      }

      // Fetch mock courses to maintain legacy UI completeness
      const { getCourses } = await import('../../services/api');
      const mockCourses = await getCourses();

      const merged = [...(dbCourses || [])];
      
      // Append mocks that don't share IDs with DB courses
      mockCourses.forEach(mock => {
        if (!merged.find(c => String(c.id) === String(mock.id))) {
          merged.push({
            ...mock,
            created_at: new Date().toISOString(), // stub
            status: mock.status === 'active' ? 'نشط' : 'مسودة',
            price: mock.price ? `${mock.price} ر.س` : 'مجاني',
            students: Math.floor(Math.random() * 100) // stub since we don't have this in mock DB
          });
        }
      });
      
      // Map DB courses to view format
      const viewCourses = merged.map(c => ({
        ...c,
        status: c.status === 'active' || c.status === 'نشط' ? 'نشط' : 'مسودة',
        price: typeof c.price === 'number' ? `${c.price} ر.س` : c.price,
        students: c.students || 0
      }));

      setCourses(viewCourses);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="lg:pr-72 pt-8 pb-24 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-primary-900">إدارة الكورسات</h1>
            <RequirePermission permission={Permission.CREATE_COURSE}>
              <Button variant="primary" className="flex items-center gap-2" onClick={() => navigate('/admin/courses/edit')}>
                <Plus className="w-5 h-5" />
                إضافة كورس جديد
              </Button>
            </RequirePermission>
          </div>

          <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-primary-200 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                <input 
                  type="text" 
                  placeholder="ابحث عن كورس..." 
                  className="w-full pl-4 pr-10 py-2 bg-primary-50 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-primary-50 text-primary-600 font-medium border-b border-primary-200">
                  <tr>
                    <th className="py-4 px-6 text-sm">اسم الكورس</th>
                    <th className="py-4 px-6 text-sm">السعر</th>
                    <th className="py-4 px-6 text-sm">عدد الطلاب</th>
                    <th className="py-4 px-6 text-sm">الحالة</th>
                    <th className="py-4 px-6 text-sm text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
                        </div>
                      </td>
                    </tr>
                  ) : courses.map(course => (
                    <tr key={course.id} className="hover:bg-primary-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-primary-900">{course.title}</td>
                      <td className="py-4 px-6 text-primary-600" dir="ltr">{course.price}</td>
                      <td className="py-4 px-6 text-primary-600">{course.students}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          course.status === 'نشط' ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'
                        }`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 flex justify-center gap-2">
                        <button onClick={() => navigate('/admin/courses/edit')} className="p-2 text-primary-500 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors" title="تعديل">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-primary-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors" title="حذف">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
