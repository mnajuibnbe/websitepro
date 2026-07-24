import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { AccountDetails } from '../components/checkout/AccountDetails';
import { PaymentMethod } from '../components/checkout/PaymentMethod';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { ChevronLeft } from 'lucide-react';

export function CheckoutPage() {
  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      <MarketingNavbar />
      
      <main className="flex-grow pt-24 md:pt-32 pb-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          
          <div className="mb-8 lg:mb-12">
            <nav className="flex items-center gap-2 text-sm text-primary-500 font-medium mb-4">
              <Link to="/courses" className="hover:text-accent-600 transition-colors">الكورسات</Link>
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <Link to="/course" className="hover:text-accent-600 transition-colors">دبلومة العناية بالبشرة</Link>
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span className="text-primary-900 font-bold">إتمام الدفع</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-900">
              إتمام الدفع
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Main Form (8 columns) */}
            <div className="lg:col-span-8 order-2 lg:order-1">
              <AccountDetails />
              <PaymentMethod />
            </div>

            {/* Order Summary (4 columns) */}
            <div className="lg:col-span-4 order-1 lg:order-2">
              <OrderSummary />
            </div>
            
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
}
