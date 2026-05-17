"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createModel,
  updateModel,
  type ModelFormState,
} from "@/app/actions/models";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  MODEL_COLORS,
  modelColorClasses,
  type Model,
  type ModelColor,
  type ModelStatus,
  toModelColor,
} from "@/lib/models";
import { cn } from "@/lib/utils";

interface ModelFormProps {
  model?: Model | null;
  owners: { id: string; display_name: string | null }[];
  currentUserId: string;
  onDone?: () => void;
}

const initialState: ModelFormState = { error: null };

export function ModelForm({
  model,
  owners,
  currentUserId,
  onDone,
}: ModelFormProps) {
  const router = useRouter();
  const isEdit = Boolean(model);
  const action = isEdit
    ? updateModel.bind(null, model!.id)
    : createModel;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [name, setName] = useState(model?.name ?? "");
  const [color, setColor] = useState<ModelColor>(toModelColor(model?.color));
  const [status, setStatus] = useState<ModelStatus>(
    (model?.status as ModelStatus) ?? "active",
  );
  const [ownerUserId, setOwnerUserId] = useState<string>(
    model?.owner_user_id ?? currentUserId,
  );

  return (
    <form
      action={async (fd) => {
        await formAction(fd);
        if (!state.error) {
          setName("");
          setColor("violet");
          onDone?.();
          router.refresh();
        }
      }}
      className="flex flex-col gap-4"
    >
      <Input
        name="name"
        label="Nom de la model"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={50}
        autoFocus={!isEdit}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Couleur</label>
        <div className="flex flex-wrap gap-2">
          {MODEL_COLORS.map((c) => {
            const active = color === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                aria-pressed={active}
                className={cn(
                  "size-8 rounded-full border-2 transition-all cursor-pointer",
                  modelColorClasses[c].dot,
                  active
                    ? "border-foreground scale-110"
                    : "border-transparent hover:border-muted-foreground",
                )}
              />
            );
          })}
        </div>
        <input type="hidden" name="color" value={color} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Owner principal
        </label>
        <div className="flex flex-wrap gap-2">
          {owners.map((o) => {
            const active = ownerUserId === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setOwnerUserId(o.id)}
                aria-pressed={active}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-sm cursor-pointer transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-transparent text-foreground hover:border-muted-foreground",
                )}
              >
                {o.display_name ?? "?"}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="ownerUserId" value={ownerUserId} />
      </div>

      {isEdit && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Statut</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "active", label: "Active" },
              { value: "paused", label: "En pause" },
              { value: "dropped", label: "Drop" },
            ].map((s) => {
              const active = status === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value as ModelStatus)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-sm cursor-pointer transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-transparent text-foreground hover:border-muted-foreground",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="status" value={status} />
        </div>
      )}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
      </Button>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
