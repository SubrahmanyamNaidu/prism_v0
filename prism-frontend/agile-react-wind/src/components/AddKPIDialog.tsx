
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useDatabaseContext } from '@/contexts/DatabaseContext';

interface AddKPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKPIAdded: () => void;
}

const AddKPIDialog = ({ open, onOpenChange, onKPIAdded }: AddKPIDialogProps) => {
  const [kpiName, setKpiName] = useState('');
  const [kpiFormula, setKpiFormula] = useState('');
  const [kpiDescription, setKpiDescription] = useState('');
  const [formulaType, setFormulaType] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { connectedDatabaseId } = useDatabaseContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!kpiName || !kpiFormula || !kpiDescription || !formulaType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!connectedDatabaseId) {
      toast({
        title: "Database Error",
        description: "Please connect a database first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');
      
      if (!accessToken) {
        toast({
          title: "Error",
          description: "No access token found. Please sign in.",
          variant: "destructive"
        });
        return;
      }

      const kpiData = {
        name: kpiName,
        formula: kpiFormula,
        description: kpiDescription,
        formula_type: formulaType
      };

      const requestBody = {
        kpiData,
        db_id: connectedDatabaseId
      };

      const response = await fetch('http://127.0.0.1:8000/kpi', {
        method: 'POST',
        headers: {
          'Authorization': `${tokenType} ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to create KPI');
      }

      toast({
        title: "Success",
        description: "KPI created successfully!",
      });

      // Reset form
      setKpiName('');
      setKpiFormula('');
      setKpiDescription('');
      setFormulaType('');
      
      onOpenChange(false);
      onKPIAdded();
    } catch (error) {
      console.error('Error creating KPI:', error);
      toast({
        title: "Error",
        description: "Failed to create KPI. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Add New KPI</DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new Key Performance Indicator to track your business metrics.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              KPI Name *
            </Label>
            <Input
              id="name"
              value={kpiName}
              onChange={(e) => setKpiName(e.target.value)}
              placeholder="e.g., Total Revenue"
              required
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="formula" className="text-sm font-medium text-gray-700">
              Formula *
            </Label>
            <Textarea
              id="formula"
              value={kpiFormula}
              onChange={(e) => setKpiFormula(e.target.value)}
              placeholder="e.g., SUM(revenue) or COUNT(*)"
              required
              rows={3}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description *
            </Label>
            <Textarea
              id="description"
              value={kpiDescription}
              onChange={(e) => setKpiDescription(e.target.value)}
              placeholder="Brief description of the KPI"
              required
              rows={3}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="formula_type" className="text-sm font-medium text-gray-700">
              Formula Type *
            </Label>
            <Select value={formulaType} onValueChange={setFormulaType} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select formula type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="aggregation">Aggregation</SelectItem>
                <SelectItem value="calculation">Calculation</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Creating...' : 'Create KPI'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddKPIDialog;
