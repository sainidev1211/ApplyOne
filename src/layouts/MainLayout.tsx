import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-300 text-text-primary-light dark:text-text-primary-dark">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
