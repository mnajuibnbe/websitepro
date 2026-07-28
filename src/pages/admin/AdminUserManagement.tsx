import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { Search, Loader2, AlertCircle, Eye, X } from 'lucide-react';
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
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

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
        name: user.full_name || 'Unnamed user',
        email: user.email || 'Email unavailable',
        joined: new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(user.created_at)),
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
    <PortalLayout sidebar={<AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}>
          <div className="mb-8"><h1 className="text-3xl font-bold text-primary-900">User management</h1><p className="mt-2 text-primary-600">Review student accounts and active course enrollment counts.</p></div>

          <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-primary-200 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                <input
                  type="text"
                  placeholder="Search by name or email"
                  aria-label="Search users"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-primary-50 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-primary-50 text-primary-600 font-medium border-b border-primary-200">
                  <tr>
                    <th scope="col" className="py-4 px-6 text-sm">Name</th>
                    <th scope="col" className="py-4 px-6 text-sm">Email Address</th>
                    <th scope="col" className="py-4 px-6 text-sm">Joined</th>
                    <th scope="col" className="py-4 px-6 text-sm">Courses</th>
                    <th scope="col" className="py-4 px-6 text-sm text-right">Actions</th>
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
                  ) : errorState === 'error' ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-danger-600">
                          <AlertCircle className="w-10 h-10 mb-4" />
                          <p className="mb-4 font-medium">Error</p>
                          <Button variant="primary" onClick={fetchStudents}>
                            Retry
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-primary-500">
                        No users match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-primary-900">{student.name}</td>
                        <td className="py-4 px-6 text-primary-600" dir="ltr">{student.email}</td>
                        <td className="py-4 px-6 text-primary-600" dir="ltr">{student.joined}</td>
                        <td className="py-4 px-6 text-primary-600 font-bold">{student.courses}</td>
                        <td className="py-4 px-6 text-right"><button type="button" onClick={() => setSelectedStudent(student)} aria-label={`View ${student.name}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary-200 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"><Eye className="h-4 w-4" />View</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {selectedStudent && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-900/60 p-4" onMouseDown={event => event.target === event.currentTarget && setSelectedStudent(null)}><section role="dialog" aria-modal="true" aria-labelledby="student-details-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-accent-700">Student account</p><h2 id="student-details-title" className="mt-1 text-2xl font-bold text-primary-900">{selectedStudent.name}</h2></div><button type="button" onClick={() => setSelectedStudent(null)} aria-label="Close user details" className="rounded-lg p-2 text-primary-500 hover:bg-primary-50"><X className="h-5 w-5" /></button></div><dl className="mt-6 grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-primary-500">Email</dt><dd className="mt-1 break-all font-medium text-primary-900">{selectedStudent.email}</dd></div><div><dt className="text-sm text-primary-500">Joined</dt><dd className="mt-1 font-medium text-primary-900">{selectedStudent.joined}</dd></div><div><dt className="text-sm text-primary-500">Active courses</dt><dd className="mt-1 font-medium text-primary-900">{selectedStudent.courses}</dd></div><div><dt className="text-sm text-primary-500">User ID</dt><dd className="mt-1 break-all font-mono text-xs text-primary-700">{selectedStudent.id}</dd></div></dl><p className="mt-6 rounded-lg bg-primary-50 p-3 text-sm text-primary-600">Account mutations are intentionally unavailable here until server-side role and suspension APIs with audit enforcement are configured.</p></section></div>}
    </PortalLayout>
  );
}
