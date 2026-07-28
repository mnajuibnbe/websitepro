import React from 'react';
import { Award, CheckCircle } from 'lucide-react';
import { FlaskConical, Droplet } from 'lucide-react';

interface CertificatePreviewProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  instructorName: string;
}

export function CertificatePreview({
  studentName,
  courseName,
  completionDate,
  certificateId,
  instructorName
}: CertificatePreviewProps) {
  return (
    <div className="relative w-full aspect-[1.414/1] md:aspect-[1.414/1] bg-white border-8 border-primary-100 rounded-lg p-6 md:p-12 shadow-2xl overflow-hidden flex flex-col justify-between" dir="ltr">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-50 rounded-bl-full -z-10 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-50 rounded-tr-full -z-10 opacity-50"></div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center text-accent-600">
            <FlaskConical className="w-8 h-8 md:w-12 md:h-12" strokeWidth={1.5} />
            <Droplet className="w-3 h-3 md:w-4 md:h-4 absolute bottom-0 right-0 text-accent-400 fill-current" />
          </div>
          <span className="font-bold tracking-tight text-primary-900 uppercase text-xl md:text-2xl">Tutiba</span>
        </div>
        <div className="text-left" dir="ltr">
          <span className="text-primary-400 text-xs md:text-sm font-bold uppercase tracking-widest block mb-1">Certificate ID</span>
          <p className="text-primary-800 font-mono text-sm md:text-base">{certificateId}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center my-8 md:my-12">
        <h2 className="text-3xl md:text-5xl font-bold text-primary-900 mb-4 md:mb-6">Certificate</h2>
        <p className="text-primary-600 text-sm md:text-lg mb-6 md:mb-8 font-medium">This certifies that</p>
        <h1 className="text-4xl md:text-6xl font-bold text-accent-600 mb-6 md:mb-8 leading-tight">{studentName}</h1>
        <p className="text-primary-600 text-sm md:text-lg mb-4 md:mb-6 font-medium">has successfully completed</p>
        <h3 className="text-2xl md:text-4xl font-bold text-primary-900 leading-snug">{courseName}</h3>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end border-t border-primary-200 pt-6 md:pt-8 mt-auto">
        <div className="text-center w-28 md:w-48">
          <p className="font-bold text-primary-900 text-sm md:text-xl border-b border-primary-300 pb-2 mb-2">{completionDate}</p>
          <span className="text-primary-500 text-xs md:text-sm font-medium">Completion date</span>
        </div>
        <div className="flex items-center justify-center hidden sm:flex">
          <Award className="w-12 h-12 md:w-20 md:h-20 text-warning-400 opacity-20 absolute" />
          <div className="bg-warning-500 text-white rounded-full p-2 md:p-3 shadow-lg z-10 relative">
            <CheckCircle className="w-6 h-6 md:w-10 md:h-10" />
          </div>
        </div>
        <div className="text-center w-28 md:w-48">
          <p className="font-bold text-primary-900 text-base md:text-2xl border-b border-primary-300 pb-2 mb-2 italic font-serif">{instructorName}</p>
          <span className="text-primary-500 text-xs md:text-sm font-medium">Issuer</span>
        </div>
      </div>
    </div>
  );
}
