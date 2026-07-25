import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isValidUUID } from '../lib/uuid';

export function LegacyLessonRedirector() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const courseId = params.get('courseId');
    const lessonId = params.get('lessonId');

    if (courseId && lessonId && isValidUUID(courseId) && isValidUUID(lessonId)) {
      navigate(`/learn/${courseId.trim()}/lesson/${lessonId.trim()}`, { replace: true });
    } else if (courseId && isValidUUID(courseId)) {
      navigate(`/learn/${courseId.trim()}`, { replace: true });
    } else {
      navigate('/my-courses', { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
      <p className="text-primary-600 font-medium">جاري إعادة التوجيه إلى مساحة التعلم...</p>
    </div>
  );
}
