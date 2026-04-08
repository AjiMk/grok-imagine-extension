"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type AttachedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type GeneratedFile = {
  id: string;
  name: string;
  createdAt: string;
  createdAtMs: number;
  size: string;
  previewUrl: string;
};

type ViewMode = "grid" | "list" | "table";
type SortMode = "newest" | "oldest" | "name-asc" | "name-desc";

const suggestedPrompts = ["Cinematic product photo", "Dreamy sci-fi skyline", "Soft editorial portrait"];

function makeSeedFiles(attachments: AttachedImage[]): GeneratedFile[] {
  const items = [
    { name: "concept-01.png", previewUrl: "linear-gradient(135deg, #1e293b, #64748b)" },
    { name: "concept-02.png", previewUrl: "linear-gradient(135deg, #312e81, #a855f7)" },
    { name: "concept-03.png", previewUrl: "linear-gradient(135deg, #064e3b, #14b8a6)" }
  ];
  const now = Date.now();

  return items.map((item, index) => ({
    id: `${now}-${index}-${Math.random().toString(16).slice(2)}`,
    name: item.name,
    createdAtMs: now - index * 60_000,
    createdAt: new Date(now - index * 60_000).toLocaleString(),
    size: `${2 + index}.${attachments.length + 4} MB`,
    previewUrl: item.previewUrl
  }));
}

const initialFiles = makeSeedFiles([]);

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<AttachedImage[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>(initialFiles);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(initialFiles[0]?.id ?? null);
  const attachmentUrls = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      attachmentUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const sortedFiles = useMemo(() => {
    return [...generatedFiles].sort((a, b) => {
      if (sortMode === "name-asc") return a.name.localeCompare(b.name);
      if (sortMode === "name-desc") return b.name.localeCompare(a.name);
      if (sortMode === "oldest") return a.createdAtMs - b.createdAtMs;
      return b.createdAtMs - a.createdAtMs;
    });
  }, [generatedFiles, sortMode]);

  const selectedPreview = useMemo(
    () => generatedFiles.find((file) => file.id === selectedPreviewId) ?? null,
    [generatedFiles, selectedPreviewId]
  );

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const nextImages = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    attachmentUrls.current.push(...nextImages.map((image) => image.previewUrl));
    setAttachments((current) => [...current, ...nextImages]);
  }

  function handleGenerate() {
    const nextFiles = makeSeedFiles(attachments);
    setGeneratedFiles((current) => [...nextFiles, ...current]);
    setSelectedIds(nextFiles.map((item) => item.id));
    setSelectedPreviewId(nextFiles[0]?.id ?? null);
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
    setSelectedPreviewId(id);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Card className="sidebar-card">
          <div className="sidebar-title">
            <p className="eyebrow">grok imagine</p>
            <h1>Generate</h1>
          </div>

          <div className="composer">
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Prompt"
              className="prompt-box"
            />

            <div className="chips">
              {suggestedPrompts.map((item) => (
                <Button key={item} type="button" variant="secondary" size="sm" onClick={() => setPrompt(item)}>
                  {item}
                </Button>
              ))}
            </div>

            <Button type="button" variant="outline" className="full-width" onClick={() => fileInputRef.current?.click()}>
              Add images
            </Button>
            <input
              ref={fileInputRef}
              id="reference-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => handleFiles(event.target.files)}
              className="hidden-input"
            />

            {attachments.length > 0 && (
              <div className="attachment-grid">
                {attachments.map((image) => (
                  <figure key={image.id} className="attachment-card">
                    <img src={image.previewUrl} alt={image.file.name} className="attachment-image" />
                    <figcaption className="attachment-caption">{image.file.name}</figcaption>
                  </figure>
                ))}
              </div>
            )}

            <Button type="button" className="full-width" onClick={handleGenerate} disabled={!prompt.trim()}>
              Search
            </Button>
          </div>
        </Card>
      </aside>

      <section className="content">
        <Card className="toolbar-card">
          <TabsList>
            {(["grid", "list", "table"] as ViewMode[]).map((mode) => (
              <TabsTrigger key={mode} active={mode === viewMode} onClick={() => setViewMode(mode)}>
                {mode}
              </TabsTrigger>
            ))}
          </TabsList>

          <Select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </Select>
        </Card>

        <div className="content-grid">
          <Card className="results-card">
            {viewMode === "table" ? (
              <div className="table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th className="col-check" />
                      <th>Name</th>
                      <th>Created</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFiles.map((file) => (
                      <tr
                        key={file.id}
                        className={selectedPreviewId === file.id ? "is-selected" : ""}
                        onClick={() => toggleSelection(file.id)}
                      >
                        <td>
                          <Checkbox
                            checked={selectedIds.includes(file.id)}
                            onChange={() => toggleSelection(file.id)}
                          />
                        </td>
                        <td className="file-name">{file.name}</td>
                        <td className="muted">{file.createdAt}</td>
                        <td className="muted">{file.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid-view" : "list-view"}>
                {sortedFiles.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    className={selectedPreviewId === file.id ? "result-tile is-selected" : "result-tile"}
                    onClick={() => toggleSelection(file.id)}
                  >
                    <div className="tile-art" style={{ background: file.previewUrl }} />
                    <div className="tile-meta">
                      <div className="file-name">{file.name}</div>
                      <Badge>New</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="preview-card">
            {selectedPreview ? (
              <>
                <div className="preview-art-wrap">
                  <div className="preview-art" style={{ background: selectedPreview.previewUrl }} />
                </div>
                <div className="preview-meta">
                  <span className="muted">{selectedPreview.createdAt}</span>
                  <span className="muted">{selectedPreview.size}</span>
                </div>
              </>
            ) : (
              <div className="preview-empty">Select a file</div>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
}
