import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Users, BookOpen, DollarSign, TrendingUp } from 'lucide-react';

export function AdminDashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const stats = [
    { title: 'إجمالي الطلاب', value: '1,234', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'الكورسات النشطة', value: '15', icon: BookOpen, color: 'text-accent-600', bg: 'bg-accent-50' },
    { title: 'المبيعات (هذا الشهر)', value: '45,000 ر.س', icon: DollarSign, color: 'text-success-600', bg: 'bg-success-50' },
  ];

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="lg:pr-72 pt-8 pb-24 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-primary-900 mb-8">لوحة القيادة</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-primary-200 shadow-sm flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
                    <Icon className={`w-7 h-7 ${stat.color}`} />
                  </div>
                  <div>
                    <h3 className="text-primary-600 font-medium mb-1">{stat.title}</h3>
                    <p className="text-2xl font-bold text-primary-900" dir="ltr">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-primary-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-600" />
                آخر النشاطات
              </h2>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-primary-100 last:border-0 hover:bg-primary-50/50 transition-colors -mx-4 px-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                      أ
                    </div>
                    <div>
                      <p className="font-bold text-primary-900 text-sm">أحمد محمد سجل في دبلومة العناية بالبشرة</p>
                      <p className="text-xs text-primary-500">منذ ساعتين</p>
                    </div>
                  </div>
                  <span className="text-success-600 font-bold text-sm" dir="ltr">+ 1,500 ر.س</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
