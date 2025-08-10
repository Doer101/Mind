"use client";
import { useActionState } from "react";
import { updatePreferences } from "./actions";

const DEFAULT_TYPES = [
  "creative",
  "journal",
  "mindset",
  "reflection",
  "challenge",
];

const initialState = { error: "" };

export default function ClientForm({
  selected,
  custom,
}: {
  selected: string[];
  custom: string;
}) {
  const [formState, formAction] = useActionState(
    updatePreferences,
    initialState
  );
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block mb-2 font-medium">Default Quest Types:</label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="quest_type"
                value={type}
                defaultChecked={selected.includes(type)}
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block mb-2 font-medium">Custom Quest Type:</label>
        <input
          type="text"
          name="custom"
          defaultValue={custom}
          className="w-full border rounded px-3 py-2 bg-white text-black placeholder-black/60"
          placeholder="Enter your own type (optional)"
        />
      </div>
      {"error" in formState && formState.error && (
        <p className="text-red-600 text-sm">{formState.error}</p>
      )}
      {"success" in formState && formState.success && (
        <p className="text-green-600 text-sm">{formState.success}</p>
      )}
      <button
        type="submit"
        className="w-full mt-4 bg-black/70 text-white py-2 rounded border border-white/20 hover:bg-white hover:text-black"
      >
        Save Preferences
      </button>
    </form>
  );
}
