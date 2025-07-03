'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Plus, Edit, Trash2, MessageSquare, Target, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface TrainingData {
  id: string;
  data_type: string;
  content: string;
  is_active: boolean;
  version: number;
  created_at: string;
}

export default function TrainingPage() {
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TrainingData | null>(null);
  const [formData, setFormData] = useState({
    data_type: '',
    content: '',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) return;

      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching training data:', error);
      } else {
        setTrainingData(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) return;

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('training_data')
          .update({
            content: formData.content,
          })
          .eq('id', editingItem.id);

        if (error) {
          toast.error('Error updating training data');
        } else {
          toast.success('Training data updated successfully');
        }
      } else {
        // Create new item
        const { error } = await supabase
          .from('training_data')
          .insert({
            organization_id: userProfile.organization_id,
            data_type: formData.data_type,
            content: formData.content,
          });

        if (error) {
          toast.error('Error creating training data');
        } else {
          toast.success('Training data created successfully');
        }
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({ data_type: '', content: '' });
      fetchTrainingData();
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: TrainingData) => {
    setEditingItem(item);
    setFormData({
      data_type: item.data_type,
      content: item.content,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training data?')) return;

    const { error } = await supabase
      .from('training_data')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error deleting training data');
    } else {
      toast.success('Training data deleted successfully');
      fetchTrainingData();
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('training_data')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast.error('Error updating status');
    } else {
      toast.success('Status updated successfully');
      fetchTrainingData();
    }
  };

  const getDataTypeInfo = (type: string) => {
    switch (type) {
      case 'sales_script':
        return { icon: MessageSquare, label: 'Sales Script', color: 'bg-blue-100 text-blue-800' };
      case 'objection_handling':
        return { icon: Shield, label: 'Objection Handling', color: 'bg-red-100 text-red-800' };
      case 'qualification_criteria':
        return { icon: Target, label: 'Qualification Criteria', color: 'bg-green-100 text-green-800' };
      default:
        return { icon: BookOpen, label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const groupedData = {
    sales_script: trainingData.filter(item => item.data_type === 'sales_script'),
    objection_handling: trainingData.filter(item => item.data_type === 'objection_handling'),
    qualification_criteria: trainingData.filter(item => item.data_type === 'qualification_criteria'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Data</h1>
          <p className="text-muted-foreground">
            Configure Claude's conversation behavior with custom training data
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Training Data
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Training Data' : 'Add Training Data'}
              </DialogTitle>
              <DialogDescription>
                Provide specific instructions or scripts for Claude to follow during conversations.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data_type">Type</Label>
                <Select
                  value={formData.data_type}
                  onValueChange={(value) => setFormData({ ...formData, data_type: value })}
                  disabled={!!editingItem}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select training data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_script">Sales Script</SelectItem>
                    <SelectItem value="objection_handling">Objection Handling</SelectItem>
                    <SelectItem value="qualification_criteria">Qualification Criteria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your training content here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="sales_script" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales_script">Sales Scripts</TabsTrigger>
          <TabsTrigger value="objection_handling">Objection Handling</TabsTrigger>
          <TabsTrigger value="qualification_criteria">Qualification Criteria</TabsTrigger>
        </TabsList>

        {Object.entries(groupedData).map(([type, items]) => (
          <TabsContent key={type} value={type}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {(() => {
                    const { icon: Icon, label } = getDataTypeInfo(type);
                    return (
                      <>
                        <Icon className="mr-2 h-5 w-5" />
                        {label}
                      </>
                    );
                  })()}
                </CardTitle>
                <CardDescription>
                  {type === 'sales_script' && 'Define how Claude should approach and engage with leads'}
                  {type === 'objection_handling' && 'Provide responses for common objections and concerns'}
                  {type === 'qualification_criteria' && 'Set criteria for qualifying leads as sales-ready'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {items.length > 0 ? (
                  <div className="space-y-4">
                    {items.map((item) => {
                      const { color } = getDataTypeInfo(item.data_type);
                      return (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge className={color}>
                                Version {item.version}
                              </Badge>
                              <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleActive(item.id, item.is_active)}
                              >
                                {item.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">
                            {item.content.substring(0, 200)}
                            {item.content.length > 200 && '...'}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            Created: {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {getDataTypeInfo(type).label.toLowerCase()} data
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Add training data to improve Claude's conversation abilities
                    </p>
                    <Button onClick={() => {
                      setFormData({ data_type: type, content: '' });
                      setIsDialogOpen(true);
                    }}>
                      Add {getDataTypeInfo(type).label}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}