import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  Cloud,
  Copy,
  Download,
  FileText,
  History,
  LayoutTemplate,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Wand2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  ResumeData,
  defaultResumeData,
  sampleResumeData,
  PROFESSIONAL_EXPERIENCE_BULLET_LIMIT,
  PROJECT_EXPERIENCE_BULLET_LIMIT,
} from "@/types/resume";
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
import { Input } from "@/temp-ui/components/ui/input";
import { Textarea } from "@/temp-ui/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/temp-ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/temp-ui/components/ui/dropdown-menu";
import {
  aiApi,
  authApi,
  exportDocx,
  resumesApi,
  uploadResume,
  type CloudResume,
  type ImproveBulletResult,
  type MatchResult,
  type ResumeVersion,
} from "@/utils/api";
import {
  clearStoredAuthUser,
  consumeLinkedInResumeData,
  consumeUploadedResumeData,
  getInitials,
  getStoredAuthUser,
  getStoredResumeDraft,
  setStoredAuthUser,
  setStoredResumeDraft,
} from "@/utils/auth";

type TemplateId = "indexnine" | "ats" | "modern";
type BuilderMode = "full" | "guided";
type BuilderStep = "header" | "expertise" | "skills" | "experience" | "projects" | "education" | "export";
type UploadedExperienceData = Partial<ResumeData["experiences"][number]> & {
  position?: string;
  role?: string;
  designation?: string;
  employer?: string;
  organization?: string;
  city?: string;
  start_date?: string;
  end_date?: string;
  from?: string;
  to?: string;
  responsibility?: string[] | string;
  bullets?: string[] | string;
  bulletPoints?: string[] | string;
  highlights?: string[] | string;
  achievements?: string[] | string;
  contributions?: string[] | string;
};
type UploadedProjectData = Partial<ResumeData["projects"][number]> & {
  projectName?: string;
  title?: string;
  projectDescription?: string;
  summary?: string;
  overview?: string;
  details?: string;
  technologyStack?: string;
  techStack?: string;
  tools?: string;
  environment?: string;
  development_tools?: string;
  devTools?: string;
  team_size?: string;
  responsibility?: string[] | string;
  bullets?: string[] | string;
  bulletPoints?: string[] | string;
  highlights?: string[] | string;
  achievements?: string[] | string;
  contributions?: string[] | string;
  tasks?: string[] | string;
};
type UploadedResumeData = Omit<Partial<ResumeData>, "skills" | "experiences" | "projects"> & {
  skills?: Partial<ResumeData["skills"]> | string;
  experiences?: UploadedExperienceData[] | UploadedExperienceData;
  experience?: UploadedExperienceData[] | UploadedExperienceData;
  projects?: UploadedProjectData[] | UploadedProjectData;
  project?: UploadedProjectData[] | UploadedProjectData;
};

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "indexnine", label: "Indexnine" },
  { id: "ats", label: "ATS" },
  { id: "modern", label: "Modern" },
];

const STEPS: { id: BuilderStep; label: string }[] = [
  { id: "header", label: "Contact" },
  { id: "expertise", label: "Summary" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "export", label: "Export" },
];

const isAllDataFilled = (data: ResumeData): boolean => {
  if (!data.header?.fullName?.trim() ||
      !data.header?.designation?.trim() ||
      !data.header?.email?.trim() ||
      !data.header?.phone?.trim() ||
      !data.header?.location?.trim()) {
    return false;
  }

  const summaryWordCount = data.expertise?.summary?.split(/\s+/).filter(Boolean).length || 0;
  if (summaryWordCount < 50 || summaryWordCount > 200) return false;
  if (!data.skills?.skills?.trim()) return false;

  const hasValidExperience = data.experiences?.some(exp =>
    exp.company?.trim() && exp.title?.trim() && exp.location?.trim() && exp.startDate?.trim()
  );
  const hasValidProject = data.projects?.some(project =>
    project.name?.trim() && project.description?.trim() && project.technologies?.trim()
  );
  const hasValidEducation = data.education?.some(edu =>
    edu.institution?.trim() && edu.degree?.trim() && edu.location?.trim() && edu.startYear?.trim() && edu.endYear?.trim()
  );

  return !!(hasValidExperience && hasValidProject && hasValidEducation);
};

const textFromUpload = (value: unknown): string => String(value || "").replace(/\s+/g, " ").trim();

const firstTextFromUpload = (source: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = source[key];
    const text = Array.isArray(value) ? textFromUpload(value.find(item => textFromUpload(item))) : textFromUpload(value);
    if (text) return text;
  }
  return "";
};

const listFromUpload = (value: unknown): string[] => {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string" && (value.includes("\n") || value.includes("•"))
      ? value.split(/[\n•]+/)
      : value
        ? [value]
        : [];

  return items
    .map(item => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        return firstTextFromUpload(item as Record<string, unknown>, ["text", "description", "summary", "responsibility", "title"]);
      }
      return textFromUpload(item);
    })
    .map(item => item.replace(/^[\s\-•*]+/, ""))
    .filter(Boolean);
};

const firstListFromUpload = (source: Record<string, unknown>, keys: string[]): string[] => {
  for (const key of keys) {
    const items = listFromUpload(source[key]);
    if (items.length) return items;
  }
  return [];
};

const itemArrayFromUpload = <T,>(value: T[] | T | undefined): T[] => {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
};

const normalizeUploadedExperience = (experience: UploadedExperienceData): ResumeData["experiences"][number] => {
  const source = experience as Record<string, unknown>;
  return {
    company: firstTextFromUpload(source, ["company", "employer", "organization"]),
    title: firstTextFromUpload(source, ["title", "position", "role", "designation"]),
    location: firstTextFromUpload(source, ["location", "city"]),
    startDate: firstTextFromUpload(source, ["startDate", "start_date", "from"]),
    endDate: firstTextFromUpload(source, ["endDate", "end_date", "to"]),
    responsibilities: firstListFromUpload(source, ["responsibilities", "responsibility", "bullets", "bulletPoints", "achievements", "highlights", "contributions"])
      .slice(0, PROFESSIONAL_EXPERIENCE_BULLET_LIMIT),
  };
};

const normalizeUploadedProject = (project: UploadedProjectData): ResumeData["projects"][number] => {
  const source = project as Record<string, unknown>;
  let responsibilities = firstListFromUpload(source, ["responsibilities", "responsibility", "bullets", "bulletPoints", "highlights", "achievements", "contributions", "tasks"]);
  let description = firstTextFromUpload(source, ["description", "projectDescription", "summary", "overview", "details"]);
  if (!description && responsibilities.length) {
    [description, ...responsibilities] = responsibilities;
  }
  responsibilities = responsibilities.slice(0, PROJECT_EXPERIENCE_BULLET_LIMIT);

  return {
    name: firstTextFromUpload(source, ["name", "projectName", "title"]),
    client: firstTextFromUpload(source, ["client", "clientName", "product"]),
    description,
    technologies: firstTextFromUpload(source, ["technologies", "technologyStack", "techStack", "tools", "environment"]),
    developmentTools: firstTextFromUpload(source, ["developmentTools", "development_tools", "devTools"]),
    teamSize: firstTextFromUpload(source, ["teamSize", "team_size"]),
    responsibilities,
    link: firstTextFromUpload(source, ["link", "url"]),
  };
};

export const normalizeUploadedResumeData = (extractedData: UploadedResumeData): ResumeData => ({
  header: {
    fullName: extractedData.header?.fullName || "",
    designation: extractedData.header?.designation || "",
    email: extractedData.header?.email || "",
    phone: extractedData.header?.phone || "",
    location: extractedData.header?.location || "",
    linkedin: extractedData.header?.linkedin || "",
    github: extractedData.header?.github || "",
    portfolio: extractedData.header?.portfolio || "",
  },
  expertise: {
    summary: extractedData.expertise?.summary || "",
    bulletPoints: listFromUpload(extractedData.expertise?.bulletPoints),
  },
  skills: { skills: typeof extractedData.skills === "string" ? extractedData.skills : extractedData.skills?.skills || "" },
  experiences: itemArrayFromUpload(extractedData.experiences ?? extractedData.experience).map(normalizeUploadedExperience),
  projects: itemArrayFromUpload(extractedData.projects ?? extractedData.project).map(normalizeUploadedProject),
  education: itemArrayFromUpload(extractedData.education),
  awards: itemArrayFromUpload(extractedData.awards),
});

const navigateToSignIn = () => {
  window.history.pushState({}, "", "/signin");
  window.dispatchEvent(new Event("popstate"));
};

const templateFromResume = (resume: CloudResume): TemplateId => {
  const template = resume.templateId || resume.template_id || "indexnine";
  return TEMPLATES.some(item => item.id === template) ? template as TemplateId : "indexnine";
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const safeFileName = (name: string, extension: string) => {
  const base = name.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_-]/g, "") || "resume";
  return `${base}.${extension}`;
};

const buildChecklist = (data: ResumeData) => {
  const summaryWordCount = data.expertise.summary.split(/\s+/).filter(Boolean).length;
  return [
    {
      id: "header" as BuilderStep,
      label: "Contact",
      done: !!(data.header.fullName && data.header.designation && data.header.email && data.header.phone && data.header.location),
    },
    {
      id: "expertise" as BuilderStep,
      label: "Summary",
      done: summaryWordCount >= 50 && summaryWordCount <= 200,
    },
    {
      id: "skills" as BuilderStep,
      label: "Skills",
      done: !!data.skills.skills.trim(),
    },
    {
      id: "experience" as BuilderStep,
      label: "Experience",
      done: data.experiences.some(exp => exp.company && exp.title && exp.location && exp.startDate),
    },
    {
      id: "projects" as BuilderStep,
      label: "Projects",
      done: data.projects.some(project => project.name && project.description && project.technologies),
    },
    {
      id: "education" as BuilderStep,
      label: "Education",
      done: data.education.some(edu => edu.institution && edu.degree && edu.location && edu.startYear && edu.endYear),
    },
  ];
};

export const ResumeBuilder = () => {
  const { toast } = useToast();
  const [signedInUser, setSignedInUser] = useState(() => getStoredAuthUser());
  const [isHydrated, setIsHydrated] = useState(false);
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
  const [isDocxExporting, setIsDocxExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.6);
  const [isUploading, setIsUploading] = useState(false);
  const [cloudResumes, setCloudResumes] = useState<CloudResume[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<number | null>(null);
  const [resumeTitle, setResumeTitle] = useState("Untitled Resume");
  const [templateId, setTemplateId] = useState<TemplateId>("indexnine");
  const [saveStatus, setSaveStatus] = useState("Loading workspace...");
  const [isCreatingResume, setIsCreatingResume] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [builderMode, setBuilderMode] = useState<BuilderMode>("full");
  const [activeStep, setActiveStep] = useState<BuilderStep>("header");
  const [jobDescription, setJobDescription] = useState("");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [bulletText, setBulletText] = useState("");
  const [bulletOptions, setBulletOptions] = useState<ImproveBulletResult["options"]>([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasBootstrappedRef = useRef(false);
  const suppressCloudSaveRef = useRef(false);

  const form = useForm<ResumeData>({
    resolver: zodResolver(ResumeSchema),
    defaultValues: defaultResumeData,
    mode: "onChange",
  });

  const { watch, formState: { errors, isValid }, reset, trigger } = form;
  const watchedData = watch();

  const checklist = useMemo(() => buildChecklist(watchedData), [watchedData]);
  const completedItems = checklist.filter(item => item.done).length;

  const handleZoomIn = () => setPreviewScale(prev => Math.min(prev + 0.1, 1.2));
  const handleZoomOut = () => setPreviewScale(prev => Math.max(prev - 0.1, 0.3));
  const toggleSection = (section: string) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  const applyResume = (resume: CloudResume) => {
    suppressCloudSaveRef.current = true;
    setActiveResumeId(resume.id);
    setResumeTitle(resume.title || "Untitled Resume");
    setTemplateId(templateFromResume(resume));
    reset(resume.data || defaultResumeData);
    setStoredResumeDraft(resume.data || defaultResumeData);
    setTimeout(() => {
      suppressCloudSaveRef.current = false;
      trigger();
    }, 0);
  };

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      if (width < 1024) setPreviewScale(0.45);
      else if (width < 1280) setPreviewScale(0.55);
      else setPreviewScale(0.65);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    if (hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;

    const bootstrap = async () => {
      try {
        const user = await authApi.me();
        const normalizedUser = {
          ...user,
          signedInAt: user.signedInAt || new Date().toISOString(),
        };
        setSignedInUser(normalizedUser);
        setStoredAuthUser(normalizedUser);

        let initialData = getStoredResumeDraft() || defaultResumeData;
        const linkedinData = consumeLinkedInResumeData();
        if (linkedinData) {
          initialData = linkedinData;
          toast({
            title: "LinkedIn data imported",
            description: "Review and complete any missing fields before exporting.",
          });
        }

        const uploadedData = consumeUploadedResumeData();
        if (uploadedData) {
          initialData = normalizeUploadedResumeData(uploadedData);
          toast({
            title: "Resume uploaded successfully",
            description: "Review and adjust any fields as needed.",
          });
        }

        const resumes = await resumesApi.list();
        let selectedResume = resumes[0];

        if (!selectedResume || linkedinData || uploadedData) {
          selectedResume = await resumesApi.create({
            title: linkedinData ? "LinkedIn Resume" : "Untitled Resume",
            templateId: "indexnine",
            data: initialData,
          });
          setCloudResumes([selectedResume, ...resumes]);
        } else {
          setCloudResumes(resumes);
        }

        applyResume(selectedResume);
        setIsHydrated(true);
        setSaveStatus("Saved to cloud");
      } catch (error) {
        clearStoredAuthUser();
        setSignedInUser(null);
        setSaveStatus("Sign in required");
        navigateToSignIn();
      }
    };

    void bootstrap();
  }, [reset, toast, trigger]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredResumeDraft(watchedData);
  }, [isHydrated, watchedData]);

  useEffect(() => {
    if (!isHydrated || !activeResumeId || suppressCloudSaveRef.current) return;

    setSaveStatus("Saving...");
    const timeout = window.setTimeout(() => {
      resumesApi.update(activeResumeId, {
        title: resumeTitle,
        templateId,
        data: watchedData,
      }).then((updated) => {
        setCloudResumes(prev => prev.map(resume => resume.id === updated.id ? updated : resume));
        setSaveStatus("Saved to cloud");
      }).catch((error) => {
        setSaveStatus("Save failed");
        toast({
          title: "Autosave failed",
          description: error instanceof Error ? error.message : "Please check your connection and try again.",
          variant: "destructive",
        });
      });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [activeResumeId, isHydrated, resumeTitle, templateId, toast, watchedData]);

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
      const extractedData = await uploadResume(formData);
      const uploadedResumeData = normalizeUploadedResumeData(extractedData);
      reset(uploadedResumeData);
      setStoredResumeDraft(uploadedResumeData);
      trigger();
      toast({
        title: "Resume uploaded successfully",
        description: "Review and adjust any fields as needed.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to extract data from resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleExportPdf = async () => {
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
      const blob = await generatePDF(watchedData, templateId);
      downloadBlob(blob, safeFileName(watchedData.header.fullName || resumeTitle, "pdf"));
      toast({
        title: "Resume exported",
        description: "Your PDF is ready.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "There was an error generating your PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocx = async () => {
    setIsDocxExporting(true);
    try {
      const blob = await exportDocx(watchedData);
      downloadBlob(blob, safeFileName(watchedData.header.fullName || resumeTitle, "docx"));
      toast({
        title: "DOCX exported",
        description: "Your editable resume has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "DOCX export failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDocxExporting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout should still proceed if the network request fails.
    }
    clearStoredAuthUser();
    setSignedInUser(null);
    toast({
      title: "Logged out",
      description: "Your current browser draft is still available in this session.",
    });
    navigateToSignIn();
  };

  const handleSelectResume = (id: number) => {
    const resume = cloudResumes.find(item => item.id === id);
    if (resume) applyResume(resume);
  };

  const handleCreateResume = async () => {
    setIsCreatingResume(true);
    try {
      const created = await resumesApi.create({
        title: "Untitled Resume",
        templateId: "indexnine",
        data: defaultResumeData,
      });
      setCloudResumes(prev => [created, ...prev]);
      applyResume(created);
      toast({ title: "Resume created", description: "Your new draft is ready." });
    } catch (error) {
      toast({
        title: "Could not create resume",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingResume(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!activeResumeId || !window.confirm("Delete this resume? This cannot be undone.")) return;
    try {
      await resumesApi.delete(activeResumeId);
      const remaining = cloudResumes.filter(resume => resume.id !== activeResumeId);
      setCloudResumes(remaining);
      if (remaining[0]) {
        applyResume(remaining[0]);
      } else {
        await handleCreateResume();
      }
      toast({ title: "Resume deleted", description: "The resume was removed from your workspace." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadVersions = async () => {
    if (!activeResumeId) return;
    setIsLoadingVersions(true);
    try {
      setVersions(await resumesApi.versions(activeResumeId));
    } catch (error) {
      toast({
        title: "Could not load versions",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!activeResumeId) return;
    setIsSavingVersion(true);
    try {
      const version = await resumesApi.saveVersion(activeResumeId, `Launch snapshot ${new Date().toLocaleString()}`);
      setVersions(prev => [version, ...prev]);
      toast({ title: "Version saved", description: `Saved version ${version.version_number}.` });
    } catch (error) {
      toast({
        title: "Version save failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleToggleVersions = () => {
    const next = !showVersions;
    setShowVersions(next);
    if (next) void loadVersions();
  };

  const handleRestoreVersion = async (versionId: number) => {
    if (!activeResumeId) return;
    try {
      const restored = await resumesApi.restoreVersion(activeResumeId, versionId);
      setCloudResumes(prev => prev.map(resume => resume.id === restored.id ? restored : resume));
      applyResume(restored);
      toast({ title: "Version restored", description: "The selected snapshot is now active." });
    } catch (error) {
      toast({
        title: "Restore failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChecklistJump = (step: BuilderStep) => {
    setBuilderMode("guided");
    setActiveStep(step);
    setExpandedSections(prev => ({ ...prev, [step]: true }));
    window.setTimeout(() => {
      document.getElementById(`section-${step}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleAnalyzeJob = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Paste a job description", description: "Add the role details before running the match." });
      return;
    }
    setIsMatching(true);
    try {
      setMatchResult(await aiApi.jobMatch({ resumeData: watchedData, jobDescription }));
    } catch (error) {
      toast({
        title: "Job match failed",
        description: error instanceof Error ? error.message : "Please check AI configuration and try again.",
        variant: "destructive",
      });
    } finally {
      setIsMatching(false);
    }
  };

  const handleImproveBullet = async () => {
    if (!bulletText.trim()) {
      toast({ title: "Add a bullet", description: "Paste the bullet you want to improve." });
      return;
    }
    setIsImproving(true);
    try {
      const result = await aiApi.improveBullet({ bullet: bulletText, jobDescription, resumeData: watchedData });
      setBulletOptions(result.options);
    } catch (error) {
      toast({
        title: "Bullet improvement failed",
        description: error instanceof Error ? error.message : "Please check AI configuration and try again.",
        variant: "destructive",
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Paste a job description", description: "Add the role details before generating a cover letter." });
      return;
    }
    setIsGeneratingLetter(true);
    try {
      const result = await aiApi.coverLetter({
        resumeId: activeResumeId || undefined,
        resumeData: watchedData,
        jobDescription,
      });
      setCoverLetter(result.content);
      toast({ title: "Cover letter generated", description: result.saved ? "Saved in your workspace." : "Ready to copy." });
    } catch (error) {
      toast({
        title: "Cover letter failed",
        description: error instanceof Error ? error.message : "Please check AI configuration and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, description: "Ready to paste." });
  };

  const hasErrors = Object.keys(errors).length > 0;
  const errorCount = Object.keys(errors).reduce((count, key) => {
    const sectionErrors = errors[key as keyof typeof errors];
    if (Array.isArray(sectionErrors)) return count + sectionErrors.filter(Boolean).length;
    return count + (sectionErrors ? 1 : 0);
  }, 0);

  const allDataFilled = isAllDataFilled(watchedData);
  const readyToExport = isValid && allDataFilled;
  const sectionVisible = (section: BuilderStep) => builderMode === "full" || activeStep === section;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Indexnine Logo" className="h-8" style={{ maxHeight: "32px" }} />
            <p className="hidden text-xs text-muted-foreground sm:block">Professional Resume Builder</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {hasErrors && (
              <div className="hidden items-center gap-2 text-sm text-destructive sm:flex">
                <AlertCircle size={16} />
                <span>{errorCount} {errorCount === 1 ? "error" : "errors"}</span>
              </div>
            )}
            {readyToExport && (
              <div className="hidden items-center gap-2 text-sm text-success sm:flex">
                <CheckCircle size={16} />
                <span>Ready</span>
              </div>
            )}
            {signedInUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 px-2" aria-label="LinkedIn profile menu">
                    <Avatar className="h-8 w-8">
                      {signedInUser.picture && (
                        <AvatarImage src={signedInUser.picture} alt={`${signedInUser.name || "LinkedIn"} profile`} />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitials(signedInUser.name, signedInUser.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-32 truncate text-sm font-medium md:inline">
                      {signedInUser.name || signedInUser.email || "LinkedIn"}
                    </span>
                    <ChevronDown size={16} className="hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="space-y-1">
                      <p className="truncate text-sm font-medium">{signedInUser.name || "LinkedIn user"}</p>
                      {signedInUser.email && (
                        <p className="truncate text-xs font-normal text-muted-foreground">{signedInUser.email}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" onClick={navigateToSignIn}>
                <LogIn size={16} className="mr-2" />
                Sign in
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="hidden sm:flex">
              {isUploading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
              {isUploading ? "Uploading" : "Upload"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleFillSampleData} className="hidden sm:flex">
              <Sparkles size={16} className="mr-2" />
              Sample
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportDocx} disabled={isDocxExporting}>
              {isDocxExporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <FileText size={16} className="mr-2" />}
              DOCX
            </Button>
            <Button
              onClick={handleExportPdf}
              disabled={!readyToExport || isExporting}
              className={readyToExport && !isExporting ? "bg-accent text-accent-foreground hover:bg-accent/90" : "cursor-not-allowed bg-muted text-muted-foreground"}
            >
              {isExporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
              PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5">
        <section className="mb-5 rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[220px] flex-1 items-center gap-2">
              <Cloud size={16} className="text-muted-foreground" />
              <select
                value={activeResumeId || ""}
                onChange={(event) => handleSelectResume(Number(event.target.value))}
                className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
              >
                {cloudResumes.map(resume => (
                  <option key={resume.id} value={resume.id}>{resume.title || "Untitled Resume"}</option>
                ))}
              </select>
              <Input
                value={resumeTitle}
                onChange={(event) => setResumeTitle(event.target.value)}
                className="h-9 min-w-[180px] flex-1"
                aria-label="Resume title"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value as TemplateId)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Template"
              >
                {TEMPLATES.map(template => (
                  <option key={template.id} value={template.id}>{template.label}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={handleCreateResume} disabled={isCreatingResume}>
                {isCreatingResume ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Plus size={16} className="mr-2" />}
                New
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteResume} disabled={!activeResumeId || cloudResumes.length === 0}>
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveVersion} disabled={!activeResumeId || isSavingVersion}>
                {isSavingVersion ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                Save Version
              </Button>
              <Button variant="outline" size="sm" onClick={handleToggleVersions} disabled={!activeResumeId}>
                <History size={16} className="mr-2" />
                Versions
              </Button>
              <div className="flex rounded-md border border-input">
                <Button variant={builderMode === "full" ? "secondary" : "ghost"} size="sm" onClick={() => setBuilderMode("full")} className="rounded-r-none">
                  Full
                </Button>
                <Button variant={builderMode === "guided" ? "secondary" : "ghost"} size="sm" onClick={() => setBuilderMode("guided")} className="rounded-l-none">
                  Guided
                </Button>
              </div>
              <span className="min-w-[96px] text-right text-xs text-muted-foreground">{saveStatus}</span>
            </div>
          </div>

          {showVersions && (
            <div className="mt-3 border-t border-border pt-3">
              {isLoadingVersions ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  Loading versions
                </div>
              ) : versions.length ? (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {versions.map(version => (
                    <div key={version.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{version.label || `Version ${version.version_number}`}</p>
                        <p className="text-xs text-muted-foreground">Version {version.version_number}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRestoreVersion(version.id)}>
                        <RotateCcw size={16} className="mr-2" />
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No saved versions yet.</p>
              )}
            </div>
          )}
        </section>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="mb-8 space-y-4 lg:mb-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl font-semibold text-foreground">Resume Details</h2>
              <div className="flex gap-2 sm:hidden">
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <Upload size={16} className="mr-2" />
                  {isUploading ? "..." : "Upload"}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleFillSampleData}>
                  <Sparkles size={16} className="mr-2" />
                  Sample
                </Button>
              </div>
            </div>

            {builderMode === "guided" && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {STEPS.map(step => (
                  <Button
                    key={step.id}
                    variant={activeStep === step.id ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setActiveStep(step.id)}
                    className="shrink-0"
                  >
                    {step.label}
                  </Button>
                ))}
              </div>
            )}

            <section className="rounded-lg border border-border bg-card p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare size={16} className="text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Completion</h3>
                </div>
                <span className="text-xs text-muted-foreground">{completedItems}/{checklist.length}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {checklist.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleChecklistJump(item.id)}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>{item.label}</span>
                    {item.done ? <CheckCircle size={16} className="text-success" /> : <AlertCircle size={16} className="text-muted-foreground" />}
                  </button>
                ))}
              </div>
            </section>

            {(builderMode === "full" || activeStep === "export") && (
              <section className="rounded-lg border border-border bg-card p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Job Match And AI Tools</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <LayoutTemplate size={16} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{TEMPLATES.find(template => template.id === templateId)?.label}</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Textarea
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    placeholder="Paste job description"
                    className="min-h-[110px]"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleAnalyzeJob} disabled={isMatching}>
                      {isMatching ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Target size={16} className="mr-2" />}
                      Match
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleGenerateCoverLetter} disabled={isGeneratingLetter}>
                      {isGeneratingLetter ? <Loader2 size={16} className="mr-2 animate-spin" /> : <FileText size={16} className="mr-2" />}
                      Cover Letter
                    </Button>
                  </div>

                  {matchResult && (
                    <div className="grid gap-3 rounded-md border border-border p-3 text-sm md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Match Score</p>
                        <p className="text-2xl font-semibold">{matchResult.matchScore}%</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Missing Keywords</p>
                        <p>{matchResult.missingKeywords.join(", ") || "None"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Strengths</p>
                        <ul className="list-disc pl-4">
                          {matchResult.strengths.slice(0, 3).map(item => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Risks</p>
                        <ul className="list-disc pl-4">
                          {matchResult.risks.slice(0, 3).map(item => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <Textarea
                      value={bulletText}
                      onChange={(event) => setBulletText(event.target.value)}
                      placeholder="Paste a bullet to improve"
                      className="min-h-[76px]"
                    />
                    <Button variant="outline" size="sm" onClick={handleImproveBullet} disabled={isImproving} className="md:self-start">
                      {isImproving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wand2 size={16} className="mr-2" />}
                      Improve
                    </Button>
                  </div>

                  {bulletOptions.length > 0 && (
                    <div className="grid gap-2">
                      {bulletOptions.map(option => (
                        <button
                          key={option.style}
                          type="button"
                          onClick={() => setBulletText(option.text)}
                          className="rounded-md border border-border p-3 text-left text-sm hover:bg-muted"
                        >
                          <span className="mb-1 block text-xs uppercase text-muted-foreground">{option.style}</span>
                          {option.text}
                        </button>
                      ))}
                    </div>
                  )}

                  {coverLetter && (
                    <div className="rounded-md border border-border p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">Cover Letter</p>
                        <Button variant="ghost" size="sm" onClick={() => copyText(coverLetter, "Cover letter")}>
                          <Copy size={16} className="mr-2" />
                          Copy
                        </Button>
                      </div>
                      <Textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} className="min-h-[220px]" />
                    </div>
                  )}
                </div>
              </section>
            )}

            <div className="max-h-[calc(100vh-245px)] space-y-4 overflow-y-auto pr-2 scrollbar-thin">
              {sectionVisible("header") && (
                <div id="section-header">
                  <FormSection
                    title="Contact Information"
                    description="Your personal and professional contact details"
                    isExpanded={expandedSections.header}
                    onToggle={() => toggleSection("header")}
                    error={!!errors.header}
                  >
                    <HeaderSection form={form} />
                  </FormSection>
                </div>
              )}

              {sectionVisible("expertise") && (
                <div id="section-expertise">
                  <FormSection
                    title="Professional Summary"
                    description="A compelling overview of your expertise"
                    isExpanded={expandedSections.expertise}
                    onToggle={() => toggleSection("expertise")}
                    error={!!errors.expertise}
                  >
                    <ExpertiseSection form={form} />
                  </FormSection>
                </div>
              )}

              {sectionVisible("skills") && (
                <div id="section-skills">
                  <FormSection
                    title="Technical Skills"
                    description="Organize your skills by category"
                    isExpanded={expandedSections.skills}
                    onToggle={() => toggleSection("skills")}
                    error={!!errors.skills}
                  >
                    <SkillsSection form={form} />
                  </FormSection>
                </div>
              )}

              {sectionVisible("experience") && (
                <div id="section-experience">
                  <FormSection
                    title="Work Experience"
                    description="Your professional history and achievements"
                    isExpanded={expandedSections.experience}
                    onToggle={() => toggleSection("experience")}
                    error={!!errors.experiences}
                  >
                    <ExperienceSection form={form} />
                  </FormSection>
                </div>
              )}

              {sectionVisible("projects") && (
                <div id="section-projects">
                  <FormSection
                    title="Projects"
                    description="Notable projects you've contributed to"
                    isExpanded={expandedSections.projects}
                    onToggle={() => toggleSection("projects")}
                    error={!!errors.projects}
                  >
                    <ProjectsSection form={form} />
                  </FormSection>
                </div>
              )}

              {sectionVisible("education") && (
                <div id="section-education">
                  <FormSection
                    title="Education"
                    description="Your academic background"
                    isExpanded={expandedSections.education}
                    onToggle={() => toggleSection("education")}
                    error={!!errors.education}
                  >
                    <EducationSection form={form} />
                  </FormSection>
                </div>
              )}

              {builderMode === "full" && (
                <div id="section-awards">
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
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold text-foreground">Live Preview</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={previewScale <= 0.3} className="h-8 w-8">
                    <ZoomOut size={16} />
                  </Button>
                  <span className="min-w-[45px] text-center text-sm text-muted-foreground">
                    {Math.round(previewScale * 100)}%
                  </span>
                  <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={previewScale >= 1.2} className="h-8 w-8">
                    <ZoomIn size={16} />
                  </Button>
                </div>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-auto rounded-lg bg-preview-bg p-6">
                <ResumePreview data={watchedData} scale={previewScale} templateId={templateId} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
