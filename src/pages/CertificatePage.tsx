import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, Share2, ShieldCheck, Linkedin } from 'lucide-react';
import { CelebrationStats } from '../components/certificate/CelebrationStats';
import { NameConfirmation } from '../components/certificate/NameConfirmation';
import { CertificatePreview } from '../components/certificate/CertificatePreview';
import { Button } from '../components/ui/Button';

type CertificateState = 'celebration' | 'name_confirmation' | 'issued';

export function CertificatePage() {
  const [step, setStep] = useState<CertificateState>('celebration');
  const [studentName, setStudentName] = useState('Learn More. Learn More');

  const handleIssueCertificate = (confirmedName: string) => {
    setStudentName(confirmedName);
    setStep('issued');
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-primary-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2 text-primary-600 hover:text-accent-600 transition-colors group min-h-[44px]">
          <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform motion-reduce:transition-none motion-reduce:transform-none" />
          <span className="font-bold text-sm hidden sm:block">Dashboard</span>
        </Link>
        <div className="font-bold text-primary-900 text-sm md:text-base">
          Certificate
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-grow py-12 px-4 sm:px-8 flex items-center justify-center">
        <div className="w-full max-w-[1200px] mx-auto">

          {step === 'celebration' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none motion-reduce:transform-none">
              <CelebrationStats onNext={() => setStep('name_confirmation')} />
            </div>
          )}

          {step === 'name_confirmation' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none motion-reduce:transform-none">
              <NameConfirmation
                defaultName={studentName}
                onConfirm={handleIssueCertificate}
              />
            </div>
          )}

          {step === 'issued' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 motion-reduce:animate-none motion-reduce:transform-none">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">Learn More!</h1>
                <p className="text-lg text-primary-600">Congratulations. Your verified certificate is ready..</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Certificate Preview - 8 Cols */}
                <div className="lg:col-span-8">
                  <CertificatePreview
                    studentName={studentName}
                    courseName="Learn More"
                    completionDate="23 Learn More 2026"
                    certificateId="TUT-2026-98765"
                    instructorName="Learn More. Learn More"
                  />
                </div>

                {/* Actions - 4 Cols */}
                <div className="lg:col-span-4 bg-white border border-primary-200 rounded-2xl p-6 md:p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-primary-900 mb-6">Certificate</h3>

                  <div className="space-y-4 mb-8">
                    <Button variant="primary" className="w-full h-12 font-bold" icon={<Download className="w-5 h-5" />}>
                      Download PDF
                    </Button>
                    <Button variant="secondary" className="w-full h-12 font-bold !bg-[#0A66C2] !text-white hover:opacity-90 !border-none" icon={<Linkedin className="w-5 h-5" />}>
                      Share LinkedIn
                    </Button>
                    <Button variant="secondary" className="w-full h-12 font-bold" icon={<Share2 className="w-5 h-5" />}>
                      Copy Link
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-primary-100">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-6 h-6 text-success-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-primary-900 text-sm mb-1">Learn More</h4>
                        <p className="text-xs text-primary-500 leading-relaxed">
                          Your verified certificate is ready. (ID) Learn More (QR Code).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
