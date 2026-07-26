import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tag, ShieldCheck, Loader2 } from 'lucide-react';

export function OrderSummary() {
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="bg-white border border-primary-200 rounded-2xl shadow-lg overflow-hidden lg:sticky lg:top-28">
      <div className="p-6 md:p-8">
        <h2 className="text-xl font-bold text-primary-900 mb-6">Order</h2>

        {/* Course Info */}
        <div className="flex gap-4 mb-6 pb-6 border-b border-primary-100">
          <img
            src="https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop"
            alt="Course Thumbnail"
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
          <div>
            <h3 className="font-bold text-primary-900 leading-snug mb-1">Learn More</h3>
            <p className="text-sm text-primary-500">Learn More</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4 mb-6 pb-6 border-b border-primary-100">
          <div className="flex items-center justify-between text-primary-600">
            <span>Price</span>
            <span className="font-medium">$249</span>
          </div>
          <div className="flex items-center justify-between text-accent-600">
            <span>Learn More (Learn More)</span>
            <span className="font-medium">-$50</span>
          </div>
          <div className="flex items-center justify-between text-lg font-bold text-primary-900 pt-2 border-t border-primary-50">
            <span>Total</span>
            <span>$199</span>
          </div>
        </div>

        {/* Coupon */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-primary-700 mb-2">Discount</label>
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Input type="text" placeholder="Learn More" className="w-full pl-10 text-left" dir="ltr" />
              <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
            </div>
            <Button variant="secondary" className="px-6 text-sm">Learn More</Button>
          </div>
        </div>

        {/* Pay Button */}
        <Button
          variant="primary"
          className="w-full h-14 text-lg font-bold relative"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing......
            </span>
          ) : (
            'Learn More - $199'
          )}
        </Button>

        {/* Guarantee */}
        <div className="flex items-center justify-center gap-2 text-xs text-primary-500 font-medium mt-6 text-center">
          <ShieldCheck className="w-4 h-4 text-accent-600 flex-shrink-0" />
          <span>Learn More SSL. Learn More.</span>
        </div>
      </div>
    </div>
  );
}
