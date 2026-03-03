import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ResumeBuilder } from './temp-ui/components/resume/ResumeBuilder';
import SignIn from './temp-ui/pages/SignIn';
import NotFound from './temp-ui/pages/NotFound';
import { Toaster } from './temp-ui/components/ui/toaster';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/builder" element={<ResumeBuilder />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;