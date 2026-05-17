"use client";

import { Pause, Play, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteModel, setModelStatus } from "@/app/actions/models";
import { ModelForm } from "@/components/features/ModelForm";
import { Card, CardContent } from "@/components/ui/Card";
import {
  modelColorClasses,
  toModelColor,
  type Model,
} from "@/lib/models";
import { cn } from "@/lib/utils";

interface ModelsListProps {
  models: Model[];
  owners: { id: string; display_name: string | null }[];
  currentUserId: string;
}

export function ModelsList({
  models,
  owners,
  currentUserId,
}: ModelsListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const ownerById = new Map(
    owners.map((o) => [o.id, o.display_name ?? "?"]),
  );

  if (models.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune model pour l&apos;instant.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-0">
        <ul className="flex flex-col">
          {models.map((m) => {
            const color = toModelColor(m.color);
            const cls = modelColorClasses[color];
            const isEditing = editingId === m.id;
            return (
              <li
                key={m.id}
                className="flex flex-col gap-3 border-b border-border/60 py-4 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className={cn("size-3 rounded-full", cls.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-foreground">
                      {m.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.owner_user_id
                        ? `Owner : ${ownerById.get(m.owner_user_id) ?? "?"}`
                        : "Pas d'owner défini"}
                      {m.status !== "active" && (
                        <>
                          {" · "}
                          <span className="uppercase tracking-wider">
                            {m.status === "paused" ? "En pause" : "Drop"}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.status === "active" ? (
                      <button
                        type="button"
                        aria-label="Mettre en pause"
                        onClick={() =>
                          startTransition(async () => {
                            await setModelStatus(m.id, "paused");
                            router.refresh();
                          })
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pause size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Réactiver"
                        onClick={() =>
                          startTransition(async () => {
                            await setModelStatus(m.id, "active");
                            router.refresh();
                          })
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Play size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Modifier"
                      onClick={() => setEditingId(isEditing ? null : m.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Supprimer"
                      onClick={() => {
                        if (
                          !confirm(
                            `Supprimer la model "${m.name}" ? Les rappels associés perdront le lien (ils ne seront pas supprimés).`,
                          )
                        )
                          return;
                        startTransition(async () => {
                          await deleteModel(m.id);
                          router.refresh();
                        });
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                    <ModelForm
                      model={m}
                      owners={owners}
                      currentUserId={currentUserId}
                      onDone={() => setEditingId(null)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
