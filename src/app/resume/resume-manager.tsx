"use client";

import { FileText, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Field,
  Input,
  ProgressBar,
  Spinner,
  Textarea,
} from "~/app/_components/ui";
import { sanitizeResumeText, timeAgo } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";

type UploadResult = RouterOutputs["resume"]["upload"];

export function ResumeManager() {
  const utils = api.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const resumes = api.resume.list.useQuery();

  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [applyToProfile, setApplyToProfile] = useState(true);
  const [result, setResult] = useState<UploadResult | null>(null);

  const upload = api.resume.upload.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setContent("");
      setFileName("");
      void utils.resume.list.invalidate();
      void utils.profile.mine.invalidate();
    },
  });
  const setPrimary = api.resume.setPrimary.useMutation({
    onSuccess: () => void utils.resume.list.invalidate(),
  });
  const remove = api.resume.delete.useMutation({
    onSuccess: () => void utils.resume.list.invalidate(),
  });

  async function onFile(file: File) {
    setFileName(file.name);
    // Read as text — reliable for .txt/.md. For PDF/DOC a real extractor slots in here.
    const text = sanitizeResumeText(await file.text());
    setContent(text);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resume &amp; ATS</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload a resume — we parse your skills and score it against ATS best
          practices.
        </p>
      </div>

      {/* Upload */}
      <Card>
        <CardBody className="space-y-4">
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 py-8 text-center hover:border-indigo-400"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={24} className="text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              Click to choose a file
            </p>
            <p className="text-xs text-slate-500">
              PDF, DOC, or TXT — or paste your resume text below
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </div>

          <Field label="File name">
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="jane-doe-resume.pdf"
            />
          </Field>
          <Field label="Resume text">
            <Textarea
              value={content}
              onChange={(e) => setContent(sanitizeResumeText(e.target.value))}
              placeholder="Paste your resume content here…"
              className="min-h-40"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={applyToProfile}
              onChange={(e) => setApplyToProfile(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Apply parsed skills &amp; experience to my profile
          </label>
          <div className="flex justify-end">
            <Button
              disabled={upload.isPending || !content.trim() || !fileName.trim()}
              onClick={() =>
                upload.mutate({
                  fileName,
                  content: sanitizeResumeText(content),
                  applyToProfile,
                })
              }
            >
              {upload.isPending ? "Analyzing…" : "Upload & analyze"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Analysis result */}
      {result && (
        <Card className="border-indigo-200">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">ATS analysis</h2>
              <Badge color={result.ats.score >= 70 ? "green" : "amber"}>
                {result.ats.score}/100
              </Badge>
            </div>
            <div className="space-y-2">
              {result.ats.breakdown.map((b) => (
                <div key={b.label}>
                  <div className="mb-1 flex justify-between text-xs text-slate-600">
                    <span>{b.label}</span>
                    <span>
                      {b.score}/{b.max}
                    </span>
                  </div>
                  <ProgressBar value={(b.score / b.max) * 100} />
                </div>
              ))}
            </div>
            {result.ats.suggestions.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-700">
                  Suggestions
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  {result.ats.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.parsed.skills.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-700">
                  Extracted skills
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.parsed.skills.map((s) => (
                    <Badge key={s} color="indigo">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Existing resumes */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Your resumes</h2>
        {resumes.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="text-indigo-600" />
          </div>
        ) : resumes.data && resumes.data.length > 0 ? (
          <div className="space-y-2">
            {resumes.data.map((r) => (
              <Card key={r.id}>
                <CardBody className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-slate-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {r.fileName}
                        </span>
                        {r.isPrimary && <Badge color="indigo">Primary</Badge>}
                      </div>
                      <p className="text-xs text-slate-500">
                        {r.atsScore != null ? `ATS ${r.atsScore}/100 · ` : ""}
                        {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!r.isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrimary.mutate({ id: r.id })}
                        title="Set as primary"
                      >
                        <Star size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove.mutate({ id: r.id })}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Alert variant="info">No resumes yet. Upload one above.</Alert>
        )}
      </div>
    </div>
  );
}
