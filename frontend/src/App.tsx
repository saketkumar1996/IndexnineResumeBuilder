import React, { useState, useCallback, useRef } from 'react';
import { ResumeBuilder } from './temp-ui/components/resume/ResumeBuilder';
import { Toaster } from './temp-ui/components/ui/toaster';
import { ResumeData } from './types/resume';
import { PreviewResponse } from './types/resume';

function App() {
  return (
    <div className="min-h-screen">
      <ResumeBuilder />
      <Toaster />
    </div>
  );
}

export default App;