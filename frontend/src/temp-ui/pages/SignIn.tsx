import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Linkedin, FileText, Sparkles } from "lucide-react";
import { Button } from "@/temp-ui/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/Black Logo.svg";

export const SignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle LinkedIn OAuth redirect with imported data
  useEffect(() => {
    const encoded = searchParams.get("linkedin_data");
    if (!encoded) return;

    try {
      const padded = encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (encoded.length % 4)) % 4);
      const json = atob(padded);
      const imported = JSON.parse(json);
      
      // Store the data in sessionStorage to pass to ResumeBuilder
      sessionStorage.setItem("linkedin_data", json);
      
      toast({
        title: "LinkedIn data imported",
        description: "Redirecting to resume builder...",
      });
      
      // Redirect immediately using window.location to ensure it works
      window.location.href = "/builder";
    } catch (err) {
      console.error("Failed to import LinkedIn data", err);
      toast({
        title: "Import failed",
        description: "Failed to process LinkedIn data. Please try again.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleSignInWithLinkedIn = () => {
    window.location.href = "/api/linkedin/auth";
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const validExtensions = [".pdf", ".docx"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail));
      }

      const extractedData = await res.json();
      
      // Store the data in sessionStorage to pass to ResumeBuilder
      sessionStorage.setItem("uploaded_resume_data", JSON.stringify(extractedData));
      
      toast({
        title: "Resume uploaded successfully",
        description: "Redirecting to resume builder...",
      });
      
      // Redirect to resume builder using window.location to ensure it works
      window.location.href = "/builder";
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Failed to extract data from resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={logoImage} 
              alt="Indexnine Logo" 
              className="h-12"
              style={{ maxHeight: '48px' }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to start building your professional resume
            </p>
          </div>
        </div>

        {/* Sign In Options */}
        <div className="space-y-4">
          {/* LinkedIn Sign In */}
          <Button
            onClick={handleSignInWithLinkedIn}
            className="w-full h-12 text-base"
            size="lg"
          >
            <Linkedin size={20} className="mr-3" />
            Sign in with LinkedIn
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Upload Resume */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-12 text-base"
              size="lg"
            >
              <FileText size={20} className="mr-3" />
              {isUploading ? "Uploading..." : "Upload Resume (PDF/DOCX)"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Upload your existing resume to auto-fill the form
            </p>
          </div>

          {/* Continue without sign in */}
          <div className="pt-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/builder")}
              className="w-full"
            >
              <Sparkles size={16} className="mr-2" />
              Continue without signing in
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>By continuing, you agree to our terms of service</p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
