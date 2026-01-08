import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileText, Sparkles, AlertCircle, CheckCircle, ZoomIn, ZoomOut } from "lucide-react";
import { ResumeData, defaultResumeData, sampleResumeData } from "@/types/resume";
import { ResumeSchema } from "@/schemas/resume";
import { transformToBackend } from "@/utils/dataTransform";
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

  const handleFillSampleData = () => {
    reset(sampleResumeData);
    trigger();
    toast({
      title: "Sample data loaded",
      description: "Review and customize the sample resume to match your experience.",
    });
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
      // Transform frontend data to backend format
      const backendData = transformToBackend(watchedData);
      
      // Use backend API for PDF generation to maintain consistency
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      if (response.ok) {
        const blob = await response.blob();
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
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-foreground">Indexnine</h1>
              <p className="text-xs text-muted-foreground">Professional Resume Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasErrors && (
              <div className="hidden sm:flex items-center gap-2 text-destructive text-sm">
                <AlertCircle size={16} />
                <span>{errorCount} {errorCount === 1 ? "error" : "errors"}</span>
              </div>
            )}
            {isValid && (
              <div className="hidden sm:flex items-center gap-2 text-success text-sm">
                <CheckCircle size={16} />
                <span>Ready to export</span>
              </div>
            )}
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
              disabled={isExporting}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFillSampleData}
                className="sm:hidden"
              >
                <Sparkles size={16} className="mr-2" />
                Sample
              </Button>
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
