"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendNotificationToUser } from "@/app/actions/notification";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Trash2,
  Users,
  Calendar,
  Mail,
  Package,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MessageSquare,
  Send
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  approved?: boolean;
  createdAt: string;
  products: Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;
  _count: {
    products: number;
  };
}

interface UsersTableProps {
  users: User[];
  onDeleteUser: (userId: string) => void;
  isDeleting: boolean;
  onApproveUser?: (userId: string) => void;
  approvingUserId?: string | null;
}

export default function UsersTable({ users, onDeleteUser, isDeleting, onApproveUser, approvingUserId }: UsersTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);

  // Message / notification composer state
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleMessageClick = (user: User) => {
    setSelectedUser(user);
    setMessageTitle("");
    setMessageBody("");
    setSendFeedback(null);
    setMessageDialogOpen(true);
  };

  const confirmSendMessage = async () => {
    if (!selectedUser || !messageBody.trim()) return;
    setSending(true);
    setSendFeedback(null);
    const result = await sendNotificationToUser(selectedUser.id, messageBody, messageTitle);
    setSending(false);
    if (result.success) {
      setSendFeedback({ ok: true, text: result.message || "Message sent." });
      setMessageTitle("");
      setMessageBody("");
    } else {
      setSendFeedback({ ok: false, text: result.message || "Failed to send message." });
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewUserDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      onDeleteUser(selectedUser.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.approved ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <Badge variant="secondary">
                        {user._count.products} products
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!user.approved && onApproveUser && (
                        <Button
                          size="sm"
                          onClick={() => onApproveUser(user.id)}
                          disabled={approvingUserId === user.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <ShieldCheck className="w-4 h-4 mr-1" />
                          {approvingUserId === user.id ? "Allowing..." : "Allow"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMessageClick(user)}
                        className="border-[#0097A7] text-[#0097A7] hover:bg-[#0097A7] hover:text-white"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* View User Dialog */}
        <Dialog open={viewUserDialogOpen} onOpenChange={setViewUserDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Complete information about {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="font-semibold">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="font-semibold">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User ID</label>
                    <p className="font-mono text-sm">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Joined Date</label>
                    <p className="font-semibold">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 mb-3 block">
                    Products ({selectedUser.products.length})
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedUser.products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(product.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">Product</Badge>
                      </div>
                    ))}
                    {selectedUser.products.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No products uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewUserDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Message / Notification Dialog */}
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#0097A7]" />
                Send Message
              </DialogTitle>
              <DialogDescription>
                This message will appear in {selectedUser?.name}&apos;s dashboard notifications.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Subject <span className="text-gray-400">(optional)</span>
                </label>
                <Input
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="e.g. Account update"
                  disabled={sending}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Message</label>
                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Write your message to this user..."
                  rows={5}
                  disabled={sending}
                />
              </div>
              {sendFeedback && (
                <p className={`text-sm ${sendFeedback.ok ? "text-green-600" : "text-red-600"}`}>
                  {sendFeedback.text}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMessageDialogOpen(false)}
                disabled={sending}
              >
                Close
              </Button>
              <Button
                onClick={confirmSendMessage}
                disabled={sending || !messageBody.trim()}
                className="bg-[#0097A7] hover:bg-[#007a87] text-white"
              >
                <Send className="w-4 h-4 mr-1" />
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Delete User
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
                {selectedUser && selectedUser._count.products > 0 && (
                  <span className="text-red-600 font-semibold">
                    {" "}This will also delete {selectedUser._count.products} products associated with this user.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="py-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">User to be deleted:</h4>
                  <p><strong>Name:</strong> {selectedUser.name}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Products:</strong> {selectedUser._count.products}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
