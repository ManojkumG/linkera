"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Badge, Input } from "~/app/_components/ui";

export function SkillsInput({
  value,
  onChange,
  placeholder = "Type a skill and press Enter",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const skill = raw.trim();
    if (!skill) return;
    if (value.some((s) => s.toLowerCase() === skill.toLowerCase())) return;
    onChange([...value, skill]);
    setDraft("");
  }

  return (
    <div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        placeholder={placeholder}
      />
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((skill) => (
            <Badge key={skill} color="indigo">
              {skill}
              <button
                type="button"
                onClick={() => onChange(value.filter((s) => s !== skill))}
                className="ml-0.5 rounded-full hover:text-indigo-900"
                aria-label={`Remove ${skill}`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
