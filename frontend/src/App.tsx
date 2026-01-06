import React, { useState, useCallback, useRef } from 'react';
import { ResumeForm } from './components/ResumeForm';
import { ResumeFormData } from './schemas/resume';
import { PreviewResponse } from './types/resume';

function App() {
  const [previewHtml, setPreviewHtml] = useState<string>(`
    <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center; color: #666;">
      <h3 style="color: #2196f3; margin-bottom: 16px;">🚀 Preview Ready</h3>
      <p>Start typing in the form to see your resume appear here!</p>
      <p style="font-size: 14px; margin-top: 16px;">
        Preview updates automatically as you type.
      </p>
    </div>
  `);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  
  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  // Iframe ref to control scroll behavior
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Loader timer ref for minimum display time
  const loaderTimer = useRef<NodeJS.Timeout | null>(null);

  const generatePreview = useCallback(async (data: ResumeFormData) => {
    try {
      setIsValidating(true);
      
      // Only show loader if request takes longer than 200ms
      const loaderTimeout = setTimeout(() => {
        setShowLoader(true);
      }, 200);
      
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Clear the loader timeout since request completed
      clearTimeout(loaderTimeout);
      
      if (response.ok) {
        const result: PreviewResponse = await response.json();
        
        if (result.html) {
          setPreviewHtml(result.html);
        }
      }
    } catch (error) {
      const errorHtml = `
        <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
          <h3 style="color: #d32f2f;">Preview Error</h3>
          <p>Unable to generate preview. Please check your connection and try again.</p>
          <p style="font-size: 12px; color: #666;">Error: ${error}</p>
        </div>
      `;
      setPreviewHtml(errorHtml);
    } finally {
      setIsValidating(false);
      
      // If loader was shown, keep it visible for at least 500ms to prevent flickering
      if (showLoader) {
        loaderTimer.current = setTimeout(() => {
          setShowLoader(false);
        }, 500);
      }
    }
  }, [showLoader]);

  const handleFormChange = useCallback((data: ResumeFormData, isValid: boolean) => {
    // This is called on every form change, regardless of validity
    // Always try to generate preview, even with partial data
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced preview generation
    debounceTimer.current = setTimeout(() => {
      generatePreview(data);
    }, 600); // Increased to 600ms for better UX
  }, [generatePreview]);

  const handleExport = async (data: ResumeFormData) => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.docx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      // Export failed silently
    } finally {
      setIsExporting(false);
    }
  };

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (loaderTimer.current) {
        clearTimeout(loaderTimer.current);
      }
    };
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex flex-col lg:flex-row overflow-hidden">
      {/* Form Section - Scrollable */}
      <div className="flex-1 overflow-y-auto form-container lg:w-1/2">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <ResumeForm
            onFormChange={handleFormChange}
            onExport={handleExport}
            isValidating={isValidating}
            isExporting={isExporting}
          />
        </div>
      </div>

      {/* Preview Section - Fixed */}
      <div className="lg:w-1/2 bg-white border-l border-gray-200 flex flex-col preview-container h-1/2 lg:h-full">
        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
              <p className="text-sm text-gray-600">
                Updates automatically as you type
              </p>
            </div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full status-indicator ${
                showLoader 
                  ? 'bg-blue-500 updating' 
                  : 'bg-green-500'
              }`}></div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4 preview-iframe relative">
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            className="border border-gray-300 rounded"
            title="Resume Preview"
            style={{ 
              position: 'absolute',
              top: '16px',
              left: '16px',
              right: '16px',
              bottom: '16px',
              width: 'calc(100% - 32px)',
              height: 'calc(100% - 32px)'
            }}
            scrolling="auto"
            sandbox="allow-same-origin allow-scripts"
            onLoad={() => {
              // Prevent auto-scrolling by keeping iframe at top when content loads
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.scrollTo(0, 0);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;