import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Search, Edit, Ban, CheckCircle } from 'lucide-react';

export function AdminUserManagement() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const users = [
    { id: 1, name: 'أحمد محمد', email: 'ahmed@example.com', joined: '2026-07-01', courses: 2, status: 'نشط' },
    { id: 2, name: 'سارة خالد', email: 'sara@example.com', joined: '2026-07-15', courses: 1, status: 'نشط' },
    { id: 3, name: 'عمر ياسر', email: 'omar@example.com', joined: '2026-06-20', courses: 3, status: 'محظور' },
  ];

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
                    <th className="py-4 px-6 text-sm">عدد الكورسات</th>
                    <th className="py-4 px-6 text-sm">الحالة</th>
                    <th className="py-4 px-6 text-sm text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-primary-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-primary-900">{user.name}</td>
                      <td className="py-4 px-6 text-primary-600" dir="ltr">{user.email}</td>
                      <td className="py-4 px-6 text-primary-600" dir="ltr">{user.joined}</td>
                      <td className="py-4 px-6 text-primary-600">{user.courses}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          user.status === 'نشط' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 flex justify-center gap-2">
                        <button className="p-2 text-primary-500 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors" title="تعديل">
                          <Edit className="w-5 h-5" />
                        </button>
                        {user.status === 'نشط' ? (
                          <button className="p-2 text-primary-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors" title="حظر">
                            <Ban className="w-5 h-5" />
                          </button>
                        ) : (
                          <button className="p-2 text-primary-500 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors" title="إلغاء الحظر">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
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
