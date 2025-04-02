import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { WebAccount } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function WebAccounts() {
  const { toast } = useToast();
  const [showNewAccountDialog, setShowNewAccountDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    service: "onlyfans",
    accountName: "",
    accountType: "model",
    profileUrl: "",
    username: "",
    password: "",
    projectId: 3, // We'll default to the FINDOM project (ID: 3)
  });

  // Fetch all web accounts
  const { data: accounts = [], isLoading, refetch } = useQuery<WebAccount[]>({
    queryKey: ["/api/web-accounts"],
    retry: false,
  });

  // Create new account mutation
  const createAccount = useMutation({
    mutationFn: async (accountData: any) => {
      return await apiRequest("/api/web-accounts", { method: "POST", body: accountData });
    },
    onSuccess: () => {
      toast({
        title: "Account added",
        description: "The web account was added successfully",
      });
      setShowNewAccountDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/web-accounts"] });
      setNewAccount({
        service: "onlyfans",
        accountName: "",
        accountType: "model",
        profileUrl: "",
        username: "",
        password: "",
        projectId: 3,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add web account: " + String(error),
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccount = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/web-accounts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "The web account was removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/web-accounts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete web account: " + String(error),
        variant: "destructive",
      });
    },
  });

  // Function to handle account creation
  const handleCreateAccount = () => {
    if (!newAccount.accountName) {
      toast({
        title: "Error",
        description: "Account name is required",
        variant: "destructive",
      });
      return;
    }
    createAccount.mutate(newAccount);
  };

  // Function to format date
  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Web Accounts Management</h1>
          <p className="text-gray-400 mt-1">
            Manage the web accounts used by the FINDOM autonomous agent
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => setShowNewAccountDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Account
          </Button>
        </div>
      </div>

      {/* Activity Card */}
      <Card className="mb-6 border border-gray-800">
        <CardHeader>
          <CardTitle>Autonomous Agent Status</CardTitle>
          <CardDescription>
            Current status of the FINDOM autonomous agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Status</span>
              <span className="text-xl font-semibold flex items-center">
                <Badge variant="outline" className="bg-green-900/30 text-green-400 hover:bg-green-900/30">
                  Active
                </Badge>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Accounts Monitored</span>
              <span className="text-xl font-semibold">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  accounts?.length || 0
                )}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">Last Check</span>
              <span className="text-xl font-semibold">
                {formatDate(new Date())}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card className="border border-gray-800">
        <CardHeader>
          <CardTitle>Web Accounts</CardTitle>
          <CardDescription>
            Platforms where the FINDOM agent operates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : accounts?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account: WebAccount) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.service}
                    </TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          account.status === "active" ? "outline" : "secondary"
                        }
                        className={
                          account.status === "active"
                            ? "bg-green-900/30 text-green-400 hover:bg-green-900/30"
                            : "bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/30"
                        }
                      >
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(account.lastActivity)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAccount.mutate(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No web accounts found.</p>
              <p className="mt-2">
                Add an account to get started with the FINDOM autonomous agent.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Web Account</DialogTitle>
            <DialogDescription>
              Add a new web account for the FINDOM agent to use.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service" className="text-right">
                Platform
              </Label>
              <Select
                value={newAccount.service}
                onValueChange={(value) =>
                  setNewAccount({ ...newAccount, service: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onlyfans">OnlyFans</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account-name" className="text-right">
                Account Name
              </Label>
              <Input
                id="account-name"
                value={newAccount.accountName}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, accountName: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account-type" className="text-right">
                Account Type
              </Label>
              <Select
                value={newAccount.accountType}
                onValueChange={(value) =>
                  setNewAccount({ ...newAccount, accountType: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="model">Model</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="profile-url" className="text-right">
                Profile URL
              </Label>
              <Input
                id="profile-url"
                value={newAccount.profileUrl}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, profileUrl: e.target.value })
                }
                className="col-span-3"
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={newAccount.username}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, username: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={newAccount.password}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, password: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewAccountDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAccount} disabled={createAccount.isPending}>
              {createAccount.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}