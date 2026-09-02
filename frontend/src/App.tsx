import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { ResumeBuilder } from './temp-ui/components/resume/ResumeBuilder';
import SignIn from './temp-ui/pages/SignIn';
import NotFound from './temp-ui/pages/NotFound';
import { Toaster } from './temp-ui/components/ui/toaster';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/builder" element={<ResumeBuilder />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <Analytics />
      </div>
    </BrowserRouter>
  );
}

export default App;
