import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Sparkles, AlertCircle, CheckCircle, ZoomIn, ZoomOut, Upload } from "lucide-react";
import { ResumeData, defaultResumeData, sampleResumeData } from "@/types/resume";
import logoImage from "@/Black Logo.svg";
import { ResumeSchema } from "@/schemas/resume";
import { generatePDF } from "./ResumePDF";
import { FormSection } from "./FormSection";
import { HeaderSection } from "./HeaderSection";
import { ExpertiseSection } from "./ExpertiseSection";
import { SkillsSection } from "./SkillsSection";
import { ExperienceSection } from "./ExperienceSection";
import { EducationSection } from "./EducationSection";
import { ProjectsSection } from "./ProjectsSection";
import { AwardsSection } from "./AwardsSection";
import { ResumePreview } from "./ResumePreview";
import { Button } from "@/temp-ui/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Helper function to check if all required data is filled
const isAllDataFilled = (data: ResumeData): boolean => {
  // Check header - required fields: fullName, designation, email, phone, location
  if (!data.header?.fullName?.trim() || 
      !data.header?.designation?.trim() ||
      !data.header?.email?.trim() || 
      !data.header?.phone?.trim() || 
      !data.header?.location?.trim()) {
    return false;
  }

  // Check expertise - required: summary (must be 80-120 words)
  if (!data.expertise?.summary?.trim()) {
    return false;
  }
  const wordCount = data.expertise.summary.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount < 80 || wordCount > 120) {
    return false;
  }

  // Check skills - must have skills string
  if (!data.skills?.skills?.trim()) {
    return false;
  }

  // Check experiences - at least one experience with all required fields
  if (!data.experiences || data.experiences.length === 0) {
    return false;
  }
  const hasValidExperience = data.experiences.some(exp => {
    return exp.company?.trim() && 
           exp.title?.trim() && 
           exp.location?.trim() && 
           exp.startDate?.trim();
  });
  if (!hasValidExperience) {
    return false;
  }

  // Check projects - at least one project with name, description, technologies
  if (!data.projects || data.projects.length === 0) {
    return false;
  }
  const hasValidProject = data.projects.some(proj => 
    proj.name?.trim() && 
    proj.description?.trim() && 
    proj.technologies?.trim()
  );
  if (!hasValidProject) {
    return false;
  }

  // Check education - at least one education entry with required fields
  if (!data.education || data.education.length === 0) {
    return false;
  }
  const hasValidEducation = data.education.some(edu => 
    edu.institution?.trim() && 
    edu.degree?.trim() && 
    edu.location?.trim() && 
    edu.startYear?.trim() &&
    edu.endYear?.trim()
  );
  if (!hasValidEducation) {
    return false;
  }

  return true;
};

export const ResumeBuilder = () => {
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    header: true,
    expertise: true,
    skills: true,
    experience: true,
    projects: false,
    education: true,
    awards: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.6);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ResumeData>({
    resolver: zodResolver(ResumeSchema),
    defaultValues: defaultResumeData,
    mode: "onChange",
  });

  const { watch, formState: { errors, isValid }, reset, trigger } = form;
  const watchedData = watch();

  const handleZoomIn = () => {
    setPreviewScale(prev => Math.min(prev + 0.1, 1.2));
  };

  const handleZoomOut = () => {
    setPreviewScale(prev => Math.max(prev - 0.1, 0.3));
  };

  // Update preview scale based on container width
  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      if (width < 1024) {
        setPreviewScale(0.45);
      } else if (width < 1280) {
        setPreviewScale(0.55);
      } else {
        setPreviewScale(0.65);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Handle LinkedIn OAuth redirect with imported data from sessionStorage
  useEffect(() => {
    // Check for LinkedIn data from sign-in page
    const linkedinData = sessionStorage.getItem("linkedin_data");
    if (linkedinData) {
      try {
        const imported = JSON.parse(linkedinData) as ResumeData;
        reset(imported);
        setTimeout(() => {
          trigger();
        }, 0);
        toast({
          title: "LinkedIn data imported",
          description: "Review and complete any missing fields before exporting.",
        });
        sessionStorage.removeItem("linkedin_data");
      } catch (err) {
        console.error("Failed to import LinkedIn data", err);
        sessionStorage.removeItem("linkedin_data");
      }
    }

    // Check for uploaded resume data from sign-in page
    const uploadedData = sessionStorage.getItem("uploaded_resume_data");
    if (uploadedData) {
      try {
        const extractedData = JSON.parse(uploadedData) as Partial<ResumeData>;
        const current = watchedData;
        const merged: ResumeData = {
          ...defaultResumeData,
          header: {
            ...current.header,
            ...(extractedData.header || {}),
            fullName: (extractedData.header?.fullName || current.header.fullName) || "",
            designation: (extractedData.header?.designation || current.header.designation) || "",
            email: (extractedData.header?.email || current.header.email) || "",
            phone: (extractedData.header?.phone || current.header.phone) || "",
            location: (extractedData.header?.location || current.header.location) || "",
          },
          expertise: {
            summary: (extractedData.expertise?.summary || current.expertise.summary) || "",
            bulletPoints: (extractedData.expertise?.bulletPoints?.length ? extractedData.expertise.bulletPoints : current.expertise.bulletPoints) || [],
          },
          skills: { skills: (extractedData.skills?.skills || current.skills.skills) || "" },
          experiences: (extractedData.experiences?.length ? extractedData.experiences : current.experiences) || [],
          projects: (extractedData.projects?.length ? extractedData.projects : current.projects) || [],
          education: (extractedData.education?.length ? extractedData.education : current.education) || [],
          awards: (extractedData.awards?.length ? extractedData.awards : current.awards) || [],
        };
        reset(merged);
        trigger();
        toast({
          title: "Resume uploaded successfully",
          description: "Review and adjust any fields as needed.",
        });
        sessionStorage.removeItem("uploaded_resume_data");
      } catch (err) {
        console.error("Failed to import uploaded resume data", err);
        sessionStorage.removeItem("uploaded_resume_data");
      }
    }
  }, [reset, trigger, toast, watchedData]);

  const handleFillSampleData = () => {
    reset(sampleResumeData);
    trigger();
    toast({
      title: "Sample data loaded",
      description: "Review and customize the sample resume to match your experience.",
    });
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

      const extractedData = (await res.json()) as Partial<ResumeData>;
      const current = watchedData;
      const merged: ResumeData = {
        ...defaultResumeData,
        header: {
          ...current.header,
          ...(extractedData.header || {}),
          fullName: (extractedData.header?.fullName || current.header.fullName) || "",
          designation: (extractedData.header?.designation || current.header.designation) || "",
          email: (extractedData.header?.email || current.header.email) || "",
          phone: (extractedData.header?.phone || current.header.phone) || "",
          location: (extractedData.header?.location || current.header.location) || "",
        },
        expertise: {
          summary: (extractedData.expertise?.summary || current.expertise.summary) || "",
          bulletPoints: (extractedData.expertise?.bulletPoints?.length ? extractedData.expertise.bulletPoints : current.expertise.bulletPoints) || [],
        },
        skills: { skills: (extractedData.skills?.skills || current.skills.skills) || "" },
        experiences: (extractedData.experiences?.length ? extractedData.experiences : current.experiences) || [],
        projects: (extractedData.projects?.length ? extractedData.projects : current.projects) || [],
        education: (extractedData.education?.length ? extractedData.education : current.education) || [],
        awards: (extractedData.awards?.length ? extractedData.awards : current.awards) || [],
      };
      reset(merged);
      trigger();
      toast({
        title: "Resume uploaded successfully",
        description: "Review and adjust any fields as needed.",
      });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Failed to extract data from resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleExport = async () => {
    const isFormValid = await trigger();
    
    if (!isFormValid) {
      toast({
        title: "Validation errors",
        description: "Please fix all errors before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Use frontend PDF generation to match preview exactly
      const blob = await generatePDF(watchedData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${watchedData.header.fullName.replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Resume exported!",
        description: "Your resume has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Export failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;
  const errorCount = Object.keys(errors).reduce((count, key) => {
    const sectionErrors = errors[key as keyof typeof errors];
    if (Array.isArray(sectionErrors)) {
      return count + sectionErrors.filter(Boolean).length;
    }
    return count + (sectionErrors ? 1 : 0);
  }, 0);

  // Check if all required data is filled (not just validation passing)
  const allDataFilled = isAllDataFilled(watchedData);
  const readyToExport = isValid && allDataFilled;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Indexnine Logo" 
              className="h-8"
              style={{ maxHeight: '32px' }}
            />
            <div>
              <p className="text-xs text-muted-foreground font-sans">Professional Resume Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasErrors && (
              <div className="hidden sm:flex items-center gap-2 text-destructive text-sm">
                <AlertCircle size={16} />
                <span>{errorCount} {errorCount === 1 ? "error" : "errors"}</span>
              </div>
            )}
            {readyToExport && (
              <div className="hidden sm:flex items-center gap-2 text-success text-sm">
                <CheckCircle size={16} />
                <span>Ready to export</span>
              </div>
            )}
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
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="hidden sm:flex"
            >
              <Upload size={16} className="mr-2" />
              {isUploading ? "Uploading..." : "Upload Resume"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFillSampleData}
              className="hidden sm:flex"
            >
              <Sparkles size={16} className="mr-2" />
              Fill Sample Data
            </Button>
            <Button
              onClick={handleExport}
              disabled={!readyToExport || isExporting}
              className={`${
                readyToExport && !isExporting
                  ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Download size={16} className="mr-2" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Form Panel */}
          <div className="space-y-4 mb-8 lg:mb-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-semibold text-foreground">
                Resume Details
              </h2>
              <div className="flex gap-2 sm:hidden">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload size={16} className="mr-2" />
                  {isUploading ? "..." : "Upload"}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleFillSampleData}>
                  <Sparkles size={16} className="mr-2" />
                  Sample
                </Button>
              </div>
            </div>

            <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin pr-2">
              <FormSection
                title="Contact Information"
                description="Your personal and professional contact details"
                isExpanded={expandedSections.header}
                onToggle={() => toggleSection("header")}
                error={!!errors.header}
              >
                <HeaderSection form={form} />
              </FormSection>

              <FormSection
                title="Professional Summary"
                description="A compelling overview of your expertise"
                isExpanded={expandedSections.expertise}
                onToggle={() => toggleSection("expertise")}
                error={!!errors.expertise}
              >
                <ExpertiseSection form={form} />
              </FormSection>

              <FormSection
                title="Technical Skills"
                description="Organize your skills by category"
                isExpanded={expandedSections.skills}
                onToggle={() => toggleSection("skills")}
                error={!!errors.skills}
              >
                <SkillsSection form={form} />
              </FormSection>

              <FormSection
                title="Work Experience"
                description="Your professional history and achievements"
                isExpanded={expandedSections.experience}
                onToggle={() => toggleSection("experience")}
                error={!!errors.experiences}
              >
                <ExperienceSection form={form} />
              </FormSection>

              <FormSection
                title="Projects"
                description="Notable projects you've contributed to"
                isExpanded={expandedSections.projects}
                onToggle={() => toggleSection("projects")}
                error={!!errors.projects}
              >
                <ProjectsSection form={form} />
              </FormSection>

              <FormSection
                title="Education"
                description="Your academic background"
                isExpanded={expandedSections.education}
                onToggle={() => toggleSection("education")}
                error={!!errors.education}
              >
                <EducationSection form={form} />
              </FormSection>

              <FormSection
                title="Awards & Certifications"
                description="Recognition and professional certifications"
                isExpanded={expandedSections.awards}
                onToggle={() => toggleSection("awards")}
                error={!!errors.awards}
              >
                <AwardsSection form={form} />
              </FormSection>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  Live Preview
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={previewScale <= 0.3}
                    className="h-8 w-8"
                  >
                    <ZoomOut size={16} />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[45px] text-center">
                    {Math.round(previewScale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={previewScale >= 1.2}
                    className="h-8 w-8"
                  >
                    <ZoomIn size={16} />
                  </Button>
                </div>
              </div>
              <div className="bg-preview-bg rounded-lg p-6 overflow-auto max-h-[calc(100vh-200px)]">
                <ResumePreview data={watchedData} scale={previewScale} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
