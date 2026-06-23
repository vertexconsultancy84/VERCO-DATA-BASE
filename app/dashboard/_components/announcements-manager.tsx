"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Send, Trash2, Eye, EyeOff } from "lucide-react";
import {
  getAllAnnouncements,
  createAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
  type AnnouncementItem,
} from "@/app/actions/announcement";

export default function AnnouncementsManager() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await getAllAnnouncements());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePost = async () => {
    if (!message.trim()) return;
    setPosting(true);
    setFeedback(null);
    const res = await createAnnouncement(message);
    setPosting(false);
    if (res.success) {
      setMessage("");
      setFeedback({ ok: true, text: res.message || "Posted." });
      await load();
    } else {
      setFeedback({ ok: false, text: res.message || "Failed to post." });
    }
  };

  const handleToggle = async (a: AnnouncementItem) => {
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)));
    await toggleAnnouncement(a.id, !a.active);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
    await deleteAnnouncement(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#0097A7]" />
          Home Page Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Composer */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Notify clients & visitors on the home page
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. We're open this holiday season! New industry suppliers added."
            rows={3}
            disabled={posting}
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePost}
              disabled={posting || !message.trim()}
              className="bg-[#0097A7] hover:bg-[#007a87] text-white"
            >
              <Send className="w-4 h-4 mr-1" />
              {posting ? "Posting..." : "Post Announcement"}
            </Button>
            {feedback && (
              <span className={`text-sm ${feedback.ok ? "text-green-600" : "text-red-600"}`}>
                {feedback.text}
              </span>
            )}
          </div>
        </div>

        {/* Existing announcements */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">
            Posted announcements ({items.length})
          </h4>
          {loading ? (
            <p className="text-sm text-gray-400 py-4">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              No announcements yet. Post one above to show it on the home page.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
                    a.active ? "border-cyan-200 bg-cyan-50/50" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={
                          a.active
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-200"
                        }
                      >
                        {a.active ? "Live" : "Hidden"}
                      </Badge>
                      <span className="text-[11px] text-gray-400">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {a.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleToggle(a)}>
                      {a.active ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" /> Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" /> Show
                        </>
                      )}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
