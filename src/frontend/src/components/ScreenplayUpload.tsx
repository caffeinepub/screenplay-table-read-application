import { ScreenplayList } from "@/components/ScreenplayList";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddScreenplay, useListScreenplays } from "@/hooks/useQueries";
import { FileText, Loader2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface ScreenplayUploadProps {
  onScreenplaySelect: (id: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "it-IT", label: "Italian" },
  { value: "pt-PT", label: "Portuguese" },
  { value: "ja-JP", label: "Japanese" },
  { value: "ko-KR", label: "Korean" },
  { value: "zh-CN", label: "Chinese (Mandarin)" },
];

export function ScreenplayUpload({
  onScreenplaySelect,
}: ScreenplayUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>("en-US");
  const [isDragging, setIsDragging] = useState(false);

  const addScreenplay = useAddScreenplay();
  const { data: screenplays = [], isLoading: isLoadingScreenplays } =
    useListScreenplays();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.name.endsWith(".fountain") || file.name.endsWith(".txt"))
    ) {
      setSelectedFile(file);
    } else {
      toast.error("Please upload a .fountain or .txt file");
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setSelectedFile(file);
    },
    [],
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const text = await selectedFile.text();
      const title = selectedFile.name.replace(/\.(fountain|txt)$/i, "");
      const id = await addScreenplay.mutateAsync({
        title,
        language,
        content: text,
      });
      toast.success(`"${title}" uploaded!`);
      setSelectedFile(null);
      onScreenplaySelect(id);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload screenplay");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <Card className="border-2 border-dashed border-primary/20 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-2xl">
            <FileText className="w-5 h-5 text-primary" />
            Upload Screenplay
          </CardTitle>
          <CardDescription>
            Upload a Fountain-formatted screenplay file to start your table read
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <input
              type="file"
              accept=".fountain,.txt"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={addScreenplay.isPending}
              data-ocid="file-upload-input"
            />
            <div className="flex flex-col items-center gap-4 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {selectedFile
                    ? selectedFile.name
                    : "Drop your screenplay here"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse — .fountain or .txt files
                </p>
              </div>
            </div>
          </div>

          {/* Language selector */}
          <div className="space-y-2">
            <Label htmlFor="language">Primary Language</Label>
            <Select
              value={language}
              onValueChange={setLanguage}
              disabled={addScreenplay.isPending}
            >
              <SelectTrigger id="language" data-ocid="language-select">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || addScreenplay.isPending}
            className="w-full"
            size="lg"
            data-ocid="upload-submit"
          >
            {addScreenplay.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & Start Table Read
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <ScreenplayList
        screenplays={screenplays}
        isLoading={isLoadingScreenplays}
        onSelect={onScreenplaySelect}
      />
    </div>
  );
}
