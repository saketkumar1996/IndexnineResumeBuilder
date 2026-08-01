import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Linkedin } from "lucide-react";
import { Button } from "@/temp-ui/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/Black Logo.svg";
import { apiUrl, authApi } from "@/utils/api";
import {
  decodeLegacyLinkedInResumeData,
  decodeLinkedInAuthPayload,
  getStoredAuthUser,
  setLinkedInResumeData,
  setStoredAuthUser,
} from "@/utils/auth";

export const SignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Handle LinkedIn OAuth redirects before applying the signed-in redirect.
  useEffect(() => {
    const error = searchParams.get("linkedin_error");
    if (error) {
      toast({
        title: "LinkedIn sign-in failed",
        description: searchParams.get("linkedin_error_description") || error,
        variant: "destructive",
      });
      navigate("/signin", { replace: true });
      return;
    }

    const authPayload = searchParams.get("linkedin_auth");
    if (authPayload) {
      const decoded = decodeLinkedInAuthPayload(authPayload);
      if (!decoded) {
        toast({
          title: "Sign-in failed",
          description: "Failed to process LinkedIn sign-in data. Please try again.",
          variant: "destructive",
        });
        navigate("/signin", { replace: true });
        return;
      }

      setStoredAuthUser(decoded.profile);
      setLinkedInResumeData(decoded.resumeData);

      toast({
        title: "Signed in with LinkedIn",
        description: "Your LinkedIn profile is connected.",
      });

      navigate("/builder", { replace: true });
      return;
    }

    const legacyData = searchParams.get("linkedin_data");
    if (legacyData) {
      const decoded = decodeLegacyLinkedInResumeData(legacyData);
      if (!decoded) {
        toast({
          title: "Import failed",
          description: "Failed to process LinkedIn data. Please try again.",
          variant: "destructive",
        });
        navigate("/signin", { replace: true });
        return;
      }

      setLinkedInResumeData(decoded);
      setStoredAuthUser({
        provider: "linkedin",
        name: decoded.header?.fullName || "",
        email: decoded.header?.email || "",
        picture: "",
        signedInAt: new Date().toISOString(),
      });
      toast({
        title: "LinkedIn data imported",
        description: "Redirecting to resume builder...",
      });
      navigate("/builder", { replace: true });
    }
  }, [navigate, searchParams, toast]);

  useEffect(() => {
    const hasLinkedInRedirect =
      searchParams.get("linkedin_auth") ||
      searchParams.get("linkedin_data") ||
      searchParams.get("linkedin_error");

    if (!hasLinkedInRedirect && getStoredAuthUser()) {
      navigate("/builder", { replace: true });
      return;
    }

    if (!hasLinkedInRedirect) {
      authApi.me()
        .then((user) => {
          setStoredAuthUser({
            ...user,
            signedInAt: user.signedInAt || new Date().toISOString(),
          });
          navigate("/builder", { replace: true });
        })
        .catch(() => {
          // Not signed in yet.
        });
    }
  }, [navigate, searchParams]);

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
            asChild
            className="w-full h-12 text-base"
            size="lg"
          >
            <a href={apiUrl("/api/linkedin/auth")}>
              <Linkedin size={20} className="mr-3" />
              Sign in with LinkedIn
            </a>
          </Button>
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
