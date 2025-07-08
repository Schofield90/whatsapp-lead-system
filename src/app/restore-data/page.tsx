'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function RestoreDataPage() {
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);
  const [checkingData, setCheckingData] = useState(false);
  const [currentData, setCurrentData] = useState<any>(null);

  const checkCurrentData = async () => {
    setCheckingData(true);
    try {
      const response = await fetch('/api/check-training-data');
      const data = await response.json();
      
      if (response.ok) {
        setCurrentData(data);
        toast.success(`Found ${data.totalItems} training items`);
      } else {
        toast.error('Unable to check current data: ' + data.error);
      }
    } catch (error) {
      toast.error('Error checking current data');
    } finally {
      setCheckingData(false);
    }
  };

  const restoreTrainingData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/restore-training-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setRestored(true);
        toast.success(`Successfully restored ${data.restoredCount} training items!`);
        // Refresh current data check
        await checkCurrentData();
      } else {
        toast.error('Failed to restore data: ' + data.error);
      }
    } catch (error) {
      toast.error('Error restoring training data');
    } finally {
      setLoading(false);
    }
  };

  const trainingDataTypes = [
    { 
      type: 'business_info', 
      label: 'Business Information', 
      description: 'Atlas Fitness locations, pricing, and brand positioning'
    },
    { 
      type: 'sales_script', 
      label: 'Sales Scripts', 
      description: 'Opening approaches, qualification questions, and conversation frameworks'
    },
    { 
      type: 'objection_handling', 
      label: 'Objection Handling', 
      description: 'Responses to pricing concerns, intimidation, time constraints'
    },
    { 
      type: 'qualification_criteria', 
      label: 'Qualification Criteria', 
      description: 'Lead scoring, qualification questions, booking triggers'
    },
    { 
      type: 'sop', 
      label: 'Standard Operating Procedures', 
      description: 'Response times, conversation flow, follow-up sequences'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Atlas Fitness Data Restoration</h1>
          <p className="text-muted-foreground">
            Restore your AI training data and business information
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Current Data Status
            </CardTitle>
            <CardDescription>
              Check what training data currently exists in your system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={checkCurrentData} 
              disabled={checkingData}
              variant="outline"
              className="w-full"
            >
              {checkingData && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Check Current Data
            </Button>
            
            {currentData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Total Training Items:</span>
                  <Badge variant={currentData.totalItems > 0 ? "default" : "destructive"}>
                    {currentData.totalItems}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Types:</span>
                  <Badge variant="outline">
                    {currentData.dataTypes.length}
                  </Badge>
                </div>
                {currentData.dataTypes.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Types: {currentData.dataTypes.join(', ')}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restoration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Restore Atlas Fitness Data
            </CardTitle>
            <CardDescription>
              Restore complete Atlas Fitness training data and business information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!restored ? (
              <Button 
                onClick={restoreTrainingData} 
                disabled={loading}
                className="w-full"
              >
                {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Restore All Training Data
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Data successfully restored!
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              This will restore all Atlas Fitness business information, sales scripts, 
              objection handling, qualification criteria, and SOPs.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>What Will Be Restored</CardTitle>
          <CardDescription>
            Complete Atlas Fitness training data package
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trainingDataTypes.map((item) => (
              <div key={item.type} className="border rounded-lg p-4 space-y-2">
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-muted-foreground">
                  {item.description}
                </div>
                <Badge variant="outline" className="text-xs">
                  {item.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            After Restoration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <strong>1. Test the AI:</strong> Go to the AI Test page to verify the AI now responds with Atlas Fitness information
          </div>
          <div className="text-sm">
            <strong>2. Send a WhatsApp message:</strong> Test your WhatsApp webhook to confirm the AI uses your business data
          </div>
          <div className="text-sm">
            <strong>3. Check responses:</strong> The AI should now mention Atlas Fitness, correct pricing, and locations
          </div>
          <div className="text-sm">
            <strong>4. Add call recordings:</strong> Use the Training page to upload and process sales call recordings
          </div>
        </CardContent>
      </Card>
    </div>
  );
}