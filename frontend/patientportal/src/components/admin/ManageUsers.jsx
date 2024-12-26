import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  UserPlus, 
  Search, 
  Shield, 
  User,
  Key,
  Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUsers } from '@/hooks/useUsers';
import { useAssignees } from '@/hooks/useAssignees';
import { useNotification } from '@/contexts/NotificationContext';

const ManageUsers = () => {
  // User Store
  const { createUser, deleteUser, users, fetchUsers, isLoading: isUserLoading } = useUsers();
  const { createAssignee, deleteAssignee, assignees, fetchAssignees, isLoading: isAssigneeLoading } = useAssignees();
  const { showNotification } = useNotification();
  
  // State for system users (with login)
  const [newSystemUser, setNewSystemUser] = useState({ 
    username: '', 
    password: '', 
    role: '' 
  });
  
  // State for assignees (simple names)
  const [newAssignee, setNewAssignee] = useState({ full_name: '' });
  
  // Search states for both types
  const [systemUserSearch, setSystemUserSearch] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');

  // Delete confirmation state
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchUsers().catch(error => {
      showNotification(error.response?.data?.detail || "Failed to fetch users", "error");
    });

    fetchAssignees().catch(error => {
      showNotification(error.response?.data?.detail || "Failed to fetch assignees", "error");
    });
  }, []);

  const handleAddSystemUser = async () => {
    if (newSystemUser.username && newSystemUser.password && newSystemUser.role) {
      try {
        await createUser(newSystemUser);
        setNewSystemUser({ username: '', password: '', role: '' });
        showNotification("System user created successfully", "success");
      } catch (error) {
        showNotification(error.response?.data?.detail || "Failed to create system user", "error");
      }
    }
  };

  const handleAddAssignee = async () => {
    if (newAssignee.full_name) {
      try {
        await createAssignee({ full_name: newAssignee.full_name });
        setNewAssignee({ full_name: '' });
        showNotification("Assignee created successfully", "success");
      } catch (error) {
        showNotification(error.response?.data?.detail || "Failed to create assignee", "error");
      }
    }
  };

  const handleDeleteAssignee = async (id) => {
    try {
      await deleteAssignee(id);
      showNotification("Assignee deleted successfully", "success");
    } catch (error) {
      showNotification(error.response?.data?.detail || "Failed to delete assignee", "error");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id);
      showNotification(`User ${userToDelete.username} was deleted successfully`, "success");
      setUserToDelete(null);
    } catch (error) {
      showNotification(error.response?.data?.detail || "Failed to delete user", "error");
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(systemUserSearch.toLowerCase())
  );

  const filteredAssignees = assignees.filter(assignee => 
    assignee.full_name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage system users and assignees
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Shield className="h-4 w-4" />
              {users.length} System Users
            </Button>
            <Button variant="outline" className="gap-2">
              <User className="h-4 w-4" />
              {assignees.length} Assignees
            </Button>
          </div>
        </div>

        <Tabs defaultValue="system-users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="system-users" className="gap-2">
              <Shield className="h-4 w-4" />
              System Users
            </TabsTrigger>
            <TabsTrigger value="assignees" className="gap-2">
              <User className="h-4 w-4" />
              Assignees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system-users" className="space-y-6">
            {/* Add System User Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add New System User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </label>
                    <Input
                      value={newSystemUser.username}
                      onChange={(e) => setNewSystemUser({ 
                        ...newSystemUser, 
                        username: e.target.value 
                      })}
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Password
                    </label>
                    <Input
                      type="password"
                      value={newSystemUser.password}
                      onChange={(e) => setNewSystemUser({ 
                        ...newSystemUser, 
                        password: e.target.value 
                      })}
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Role
                    </label>
                    <Select
                      value={newSystemUser.role}
                      onValueChange={(value) => setNewSystemUser({ 
                        ...newSystemUser, 
                        role: value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inserter">Inserter</SelectItem>
                        <SelectItem value="verifier">Verifier</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={handleAddSystemUser} 
                    className="gap-2"
                    disabled={isUserLoading}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add System User
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Users List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">
                    System Users ({users.length})
                  </CardTitle>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={systemUserSearch}
                      onChange={(e) => setSystemUserSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredUsers.map(user => (
                      <motion.div
                        key={user.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-accent/5 border transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {user.role}
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setUserToDelete(user)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.username}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setUserToDelete(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteUser}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignees" className="space-y-6">
            {/* Add Assignee Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add New Assignee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    value={newAssignee.full_name}
                    onChange={(e) => setNewAssignee({ full_name: e.target.value })}
                    placeholder="Enter assignee name"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddAssignee} 
                    className="gap-2"
                    disabled={isAssigneeLoading}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Assignee
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">
                    Assignees ({assignees.length})
                  </CardTitle>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assignees..."
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredAssignees.map(assignee => (
                      <motion.div
                        key={assignee.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-accent/5 border transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {assignee.full_name[0].toUpperCase()}
                          </div>
                          <p className="font-medium">{assignee.full_name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAssignee(assignee.id)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManageUsers;