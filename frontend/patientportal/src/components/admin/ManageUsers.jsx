import React, { useState } from 'react';
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
import { Alert, AlertDescription } from "@/components/ui/alert";

const ManageUsers = () => {
  // State for system users (with login)
  const [newSystemUser, setNewSystemUser] = useState({ 
    username: '', 
    password: '', 
    role: '' 
  });
  
  // State for assignees (simple names)
  const [newAssignee, setNewAssignee] = useState({ name: '' });
  
  // Search states for both types
  const [systemUserSearch, setSystemUserSearch] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  
  // Mock data - replace with your actual data
  const [systemUsers, setSystemUsers] = useState([
    { id: 1, username: 'john.doe', role: 'verifier' },
    { id: 2, username: 'jane.smith', role: 'insertron' },
  ]);
  
  const [assignees, setAssignees] = useState([
    { id: 1, name: 'Dr. John Miller' },
    { id: 2, name: 'Dr. Sarah Wilson' },
  ]);

  const handleAddSystemUser = () => {
    if (newSystemUser.username && newSystemUser.password && newSystemUser.role) {
      setSystemUsers([...systemUsers, { 
        id: Date.now(), 
        ...newSystemUser 
      }]);
      setNewSystemUser({ username: '', password: '', role: '' });
    }
  };

  const handleAddAssignee = () => {
    if (newAssignee.name) {
      setAssignees([...assignees, { 
        id: Date.now(), 
        ...newAssignee 
      }]);
      setNewAssignee({ name: '' });
    }
  };

  const handleDeleteSystemUser = (id) => {
    setSystemUsers(systemUsers.filter(user => user.id !== id));
  };

  const handleDeleteAssignee = (id) => {
    setAssignees(assignees.filter(assignee => assignee.id !== id));
  };

  const filteredSystemUsers = systemUsers.filter(user => 
    user.username.toLowerCase().includes(systemUserSearch.toLowerCase())
  );

  const filteredAssignees = assignees.filter(assignee => 
    assignee.name.toLowerCase().includes(assigneeSearch.toLowerCase())
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
              {systemUsers.length} System Users
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
                        <SelectItem value="insertron">Insertron</SelectItem>
                        <SelectItem value="verifier">Verifier</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleAddSystemUser} className="gap-2">
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
                    System Users ({systemUsers.length})
                  </CardTitle>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search system users..."
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
                    {filteredSystemUsers.map(user => (
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSystemUser(user.id)}
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
                    value={newAssignee.name}
                    onChange={(e) => setNewAssignee({ name: e.target.value })}
                    placeholder="Enter assignee name"
                    className="flex-1"
                  />
                  <Button onClick={handleAddAssignee} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Assignee
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Assignees List */}
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
                            {assignee.name[0].toUpperCase()}
                          </div>
                          <p className="font-medium">{assignee.name}</p>
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