"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Trash2, Loader2, CheckCircle, AlertCircle, ImagePlus } from "lucide-react";
import {
  saveItemName,
  getItemNames,
  deleteItemName,
  type ItemName,
} from "@/app/actions/industry";

// Read an image file into a base64 data URL (JPEG/PNG/GIF/WebP, max 2MB).
function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      reject(new Error("Use a JPEG, PNG, GIF or WebP image."));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("Image must be under 2MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

// Register the product/item names (with an optional photo) that the Industry
// Price Calculator picks from. Saving a name that already exists only updates
// it (no duplicates).
export default function ItemNameManager() {
  const [names, setNames] = useState<ItemName[]>([]);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { type: "added" | "updated" | "error"; text: string } | null
  >(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => getItemNames().then((rows) => { setNames(rows); setLoading(false); });

  useEffect(() => { load(); }, []);

  const handleImage = async (file?: File) => {
    if (!file) return;
    try {
      setImageUrl(await readImageFile(file));
      setFeedback(null);
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Could not read image." });
    }
  };

  const handleSave = async () => {
    const name = value.trim();
    if (!name) return;
    setSaving(true);
    setFeedback(null);
    const res = await saveItemName(name, imageUrl);
    setSaving(false);
    if (res.success) {
      setValue("");
      setImageUrl("");
      setFeedback(
        res.created
          ? { type: "added", text: `"${name}" registered.` }
          : { type: "updated", text: `"${name}" already existed — updated.` }
      );
      await load();
    } else {
      setFeedback({ type: "error", text: res.message || "Failed to save." });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from item names?`)) return;
    setDeletingId(id);
    const res = await deleteItemName(id);
    setDeletingId(null);
    if (res.success) setNames((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white">
      <div className="bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Register Item Names</h2>
          <p className="text-white/80 text-xs">
            Names and photos saved here appear in the Industry Price Calculator&apos;s product dropdown
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Register form */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
          {/* Image picker with preview */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <label
              className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#0097A7] transition-colors"
              title="Add product image"
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-6 h-6 text-gray-300" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
            </label>
            {imageUrl ? (
              <button onClick={() => setImageUrl("")} className="text-[11px] text-red-500 hover:text-red-700">
                Remove
              </button>
            ) : (
              <span className="text-[10px] text-gray-400">Photo (optional)</span>
            )}
          </div>

          {/* Name + save */}
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }}
              placeholder="e.g. Mango Juice"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0097A7]"
            />
            <button
              onClick={handleSave}
              disabled={saving || !value.trim()}
              className="flex items-center justify-center gap-1.5 bg-[#0097A7] hover:bg-[#023E4A] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
              feedback.type === "error"
                ? "text-red-600 bg-red-50 border-red-200"
                : feedback.type === "updated"
                ? "text-amber-700 bg-amber-50 border-amber-200"
                : "text-green-700 bg-green-50 border-green-200"
            }`}
          >
            {feedback.type === "error" ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            {feedback.text}
          </div>
        )}

        {/* Registered names */}
        {loading ? (
          <p className="text-sm text-gray-500 py-4 text-center">Loading…</p>
        ) : names.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center border border-dashed border-gray-300">
            <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No item names yet. Add one above.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {names.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center gap-2 bg-teal-50 text-teal-800 border border-teal-200 text-sm font-medium pl-1.5 pr-2 py-1 rounded-full"
              >
                {n.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.imageUrl} alt={n.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <Tag className="w-3.5 h-3.5 text-teal-500" />
                  </span>
                )}
                {n.name}
                <button
                  onClick={() => handleDelete(n.id, n.name)}
                  disabled={deletingId === n.id}
                  className="text-teal-500 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === n.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
