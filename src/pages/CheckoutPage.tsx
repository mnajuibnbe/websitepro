import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { AccountDetails } from '../components/checkout/AccountDetails';
import { PaymentMethod } from '../components/checkout/PaymentMethod';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { resolveCoursePrice } from '../lib/pricing';
import { usePricingContext } from '../contexts/PricingContext';
import { PageContainer } from '../components/layout/PageContainer';

export function CheckoutPage() {
  const location = useLocation();
  const pricing = usePricingContext();
  const checkoutState = location.state as { courseId?: string; course?: Record<string, unknown> } | null;
  const course = checkoutState?.course || {};
  const localizedPrice = resolveCoursePrice(course, pricing);
  const title = typeof course.title === 'string' ? course.title : 'Selected course';
  const thumbnail = typeof course.thumbnail === 'string' ? course.thumbnail : undefined;
  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      <MarketingNavbar />

      <main id="main-content" className="flex-grow pt-24 md:pt-32 pb-24">
        <PageContainer>

          <div className="mb-8 lg:mb-12">
            <nav className="flex items-center gap-2 text-sm text-primary-500 font-medium mb-4">
              <Link to="/courses" className="hover:text-accent-600 transition-colors">Courses</Link>
              <span aria-hidden="true">/</span>
              <span>Course Details</span>
              <span aria-hidden="true">/</span>
              <span className="text-primary-900 font-bold">Payment</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-900">
              Payment
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
              <OrderSummary courseId={checkoutState?.courseId} title={title} thumbnail={thumbnail} price={localizedPrice.formatted} available={localizedPrice.available} />
            </div>

          </div>

        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}
