import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';

export function PlayerTabs() {
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'discussion'>('overview');

  return (
    <div className="bg-white border border-primary-200 rounded-2xl shadow-sm overflow-hidden mb-12">
      {/* Tabs Header */}
      <div className="flex border-b border-primary-200 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors relative whitespace-nowrap min-w-max ${activeTab === 'overview' ? 'text-accent-600' : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>ملخص الدرس</span>
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors relative whitespace-nowrap min-w-max ${activeTab === 'resources' ? 'text-accent-600' : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'}`}
        >
          <FileText className="w-4 h-4" />
          <span>المصادر والمرفقات</span>
          {activeTab === 'resources' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('discussion')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors relative whitespace-nowrap min-w-max ${activeTab === 'discussion' ? 'text-accent-600' : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>النقاشات</span>
          {activeTab === 'discussion' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-600"></div>}
        </button>
      </div>

      {/* Tabs Content */}
      <div className="p-6 md:p-8">
        {activeTab === 'overview' && (
          <div className="prose prose-slate prose-lg max-w-none text-primary-700">
            <h3 className="text-xl font-bold text-primary-900 mb-4">في هذا الدرس ستتعلمين:</h3>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>المكونات الأساسية لحاجز البشرة (Skin Barrier).</li>
              <li>كيف تؤثر المنتجات القاسية على سلامة الحاجز.</li>
              <li>علامات تضرر حاجز البشرة وكيفية التفريق بينها وبين الحساسية.</li>
            </ul>
            <p className="leading-relaxed">
              حاجز البشرة هو خط الدفاع الأول للجسم، ويتكون بشكل أساسي من السيراميد، الكوليسترول، والأحماض الدهنية. في هذا الدرس سنقوم بتشريح هذه المكونات وفهم دور كل منها وكيفية الحفاظ على توازنها باستخدام المنتجات المناسبة.
            </p>
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <h3 className="text-xl font-bold text-primary-900 mb-6">الملفات المرفقة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/lesson" className="flex items-center justify-between p-4 rounded-xl border border-primary-200 hover:border-accent-500 hover:bg-accent-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-white group-hover:text-accent-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-900 text-sm">ملخص الدرس (PDF)</h4>
                    <span className="text-xs text-primary-500">2.4 MB</span>
                  </div>
                </div>
              </Link>
              <Link to="/lesson" className="flex items-center justify-between p-4 rounded-xl border border-primary-200 hover:border-accent-500 hover:bg-accent-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-white group-hover:text-accent-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-900 text-sm">قائمة المراجع العلمية</h4>
                    <span className="text-xs text-primary-500">Links</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'discussion' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-primary-900">أسئلة ونقاشات الدرس</h3>
              <Button variant="secondary" className="text-sm px-4">أضف سؤالاً</Button>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                  ف
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-primary-900">فاطمة علي</h4>
                    <span className="text-xs text-primary-400">قبل يومين</span>
                  </div>
                  <p className="text-primary-700 text-sm leading-relaxed mb-3">
                    دكتورة آية، هل يمكن استخدام النياسيناميد مع منتجات ترميم الحاجز التي تحتوي على سيراميد في نفس الروتين؟
                  </p>
                  
                  {/* Reply */}
                  <div className="flex gap-4 mt-3 bg-primary-50 p-4 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 font-bold flex-shrink-0">
                      آ
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-primary-900">د. آية البراشي <span className="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full ml-2">المدربة</span></h4>
                        <span className="text-xs text-primary-400">قبل يوم</span>
                      </div>
                      <p className="text-primary-700 text-sm leading-relaxed">
                        نعم بالتأكيد! النياسيناميد يحفز إنتاج السيراميد الطبيعي في البشرة، واستخدامه مع مرطب يحتوي على سيراميد يعطي نتائج تآزرية ممتازة لترميم الحاجز.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
