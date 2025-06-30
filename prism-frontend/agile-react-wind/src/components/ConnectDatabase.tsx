import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Database, Send, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { useDatabaseContext } from '@/contexts/DatabaseContext';

interface TableSchema {
  [tableName: string]: string[];
}

const steps = [
  { id: 1, name: 'Connect Database', status: 'pending' },
  { id: 2, name: 'Extract Schemas', status: 'pending' },
  { id: 3, name: 'Semantic Extraction', status: 'pending' },
  { id: 4, name: 'Vector Data Insert', status: 'pending' }
];

const ConnectDatabase = () => {
  const { toast } = useToast();
  const { setConnectedDatabase } = useDatabaseContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSemanticExtracting, setIsSemanticExtracting] = useState(false);
  const [isVectorInserting, setIsVectorInserting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessComplete, setIsProcessComplete] = useState(false);
  const [tables, setTables] = useState<TableSchema>({});
  const [selectedTables, setSelectedTables] = useState<TableSchema>({});
  const [showSchemaSelection, setShowSchemaSelection] = useState(false);
  const [connectedDbId, setConnectedDbId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    db_type: '',
    database: '',
    username: '',
    password: '',
    host: '',
    port: 5432
  });

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep && !isProcessComplete) return 'current';
    if (isProcessComplete) return 'completed';
    return 'pending';
  };

  const getProgressPercentage = () => {
    if (isProcessComplete) return 100;
    return ((currentStep - 1) / (steps.length - 1)) * 100;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTableSelection = (tableName: string, checked: boolean) => {
    if (checked) {
      setSelectedTables(prev => ({
        ...prev,
        [tableName]: tables[tableName]
      }));
    } else {
      setSelectedTables(prev => {
        const newSelected = { ...prev };
        delete newSelected[tableName];
        return newSelected;
      });
    }
  };

  const handleColumnSelection = (tableName: string, columnName: string, checked: boolean) => {
    setSelectedTables(prev => {
      const currentColumns = prev[tableName] || [];
      if (checked) {
        return {
          ...prev,
          [tableName]: [...currentColumns, columnName]
        };
      } else {
        return {
          ...prev,
          [tableName]: currentColumns.filter(col => col !== columnName)
        };
      }
    });
  };

  const handleConnect = async () => {
    // Validate required fields
    if (!formData.db_type || !formData.database || !formData.username || !formData.password || !formData.host) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get stored tokens
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');

      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "No access token found. Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/connect-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${accessToken}`,
        },
        body: JSON.stringify({
          db_type: formData.db_type,
          database: formData.database,
          username: formData.username,
          password: formData.password,
          host: formData.host,
          port: Number(formData.port)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Database connection response:', data);
        
        // Handle new response format: {"db_tables":db_tables,"db_id":inserted_id}
        if (data.db_tables) {
          setTables(data.db_tables);
          setConnectedDbId(data.db_id);
          
          // Set the connected database in the global context
          setConnectedDatabase({
            database: formData.database,
            db_type: formData.db_type,
            db_id: data.db_id
          });
          
          setShowSchemaSelection(true);
          setCurrentStep(2);
          
          toast({
            title: "Success",
            description: "Database connected successfully! Please select tables and columns.",
          });
        } else {
          toast({
            title: "Connection Error",
            description: "Invalid response format from server.",
            variant: "destructive",
          });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Connection Failed",
          description: errorData.detail || "Failed to connect to database.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Database connection error:', error);
      toast({
        title: "Error",
        description: "An error occurred while connecting to the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractSchemas = async () => {
    if (Object.keys(selectedTables).length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one table with columns.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');

      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "No access token found. Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/extract-schemas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${accessToken}`,
        },
        body: JSON.stringify({
          db_id: connectedDbId,
          selected_tables: selectedTables
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Schema extraction response:', data);
        
        setCurrentStep(3);
        
        toast({
          title: "Success",
          description: "Schemas extracted successfully! Starting semantic extraction...",
        });

        // Automatically trigger semantic extraction
        handleSemanticExtraction();
      } else {
        const errorData = await response.json();
        toast({
          title: "Extraction Failed",
          description: errorData.detail || "Failed to extract schemas.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Schema extraction error:', error);
      toast({
        title: "Error",
        description: "An error occurred while extracting schemas.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSemanticExtraction = async () => {
    setIsSemanticExtracting(true);

    try {
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');

      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "No access token found. Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/semantic-extraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${accessToken}`,
        },
        body: JSON.stringify({
          db_id: connectedDbId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Semantic extraction response:', data);
        
        setCurrentStep(4);
        
        toast({
          title: "Success",
          description: "Semantic extraction completed successfully! Starting vector data insert...",
        });

        // Automatically trigger vector data insert
        handleVectorDataInsert();
      } else {
        const errorData = await response.json();
        toast({
          title: "Semantic Extraction Failed",
          description: errorData.detail || "Failed to perform semantic extraction.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Semantic extraction error:', error);
      toast({
        title: "Error",
        description: "An error occurred during semantic extraction.",
        variant: "destructive",
      });
    } finally {
      setIsSemanticExtracting(false);
    }
  };

  const handleVectorDataInsert = async () => {
    setIsVectorInserting(true);

    try {
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');

      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "No access token found. Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/vector-data-insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${accessToken}`,
        },
        body: JSON.stringify({
          db_id: connectedDbId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Vector data insert response:', data);
        
        // Mark process as complete after vector data insert
        setCurrentStep(5); // Move beyond the last step
        setIsProcessComplete(true);
        
        toast({
          title: "Success",
          description: "Database setup completed successfully! You can now use the KPI and other features.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Vector Data Insert Failed",
          description: errorData.detail || "Failed to perform vector data insert.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Vector data insert error:', error);
      toast({
        title: "Error",
        description: "An error occurred during vector data insert.",
        variant: "destructive",
      });
    } finally {
      setIsVectorInserting(false);
    }
  };

  const resetProcess = () => {
    setShowSchemaSelection(false);
    setTables({});
    setSelectedTables({});
    setCurrentStep(1);
    setIsProcessComplete(false);
  };

  return (
    <div className="p-4 w-full bg-background">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Connect Database
        </h1>
        <p className="text-sm text-gray-600">
          Configure your database connection and extract schemas
        </p>
      </div>

      {/* Progress Indicator */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Progress</CardTitle>
          <CardDescription className="text-sm">
            Follow these steps to complete the database connection process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={getProgressPercentage()} className="w-full h-2" />
            <div className="flex justify-between">
              {steps.map((step) => {
                const status = getStepStatus(step.id);
                return (
                  <div key={step.id} className="flex flex-col items-center space-y-1">
                    <div className="flex items-center justify-center">
                      {status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : status === 'current' ? (
                        isLoading || isExtracting || isSemanticExtracting || isVectorInserting ? (
                          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        ) : (
                          <Circle className="h-5 w-5 text-blue-500 fill-blue-500" />
                        )
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                    <span className={`text-xs text-center ${
                      status === 'completed' ? 'text-green-600' :
                      status === 'current' ? 'text-blue-600' :
                      'text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show completion message when process is complete */}
      {isProcessComplete && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-600 text-lg">
              <CheckCircle className="h-4 w-4" />
              Database Setup Complete
            </CardTitle>
            <CardDescription className="text-sm">
              Your database has been successfully connected and configured. You can now access KPIs and other features from the sidebar.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Show forms only when process is not complete */}
      {!isProcessComplete && (
        <>
          {!showSchemaSelection ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-4 w-4" />
                  Database Configuration
                </CardTitle>
                <CardDescription className="text-sm">
                  Enter your database connection details below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="db_type" className="text-sm">Database Type *</Label>
                  <Select value={formData.db_type} onValueChange={(value) => handleInputChange('db_type', value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select database type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="database" className="text-sm">Database Name *</Label>
                  <Input
                    id="database"
                    type="text"
                    placeholder="postgres"
                    value={formData.database}
                    onChange={(e) => handleInputChange('database', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="username" className="text-sm">Username *</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="postgres"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="host" className="text-sm">Host *</Label>
                  <Input
                    id="host"
                    type="text"
                    placeholder="dev-lawndepot-postgresdb.cd4ecsq627o3.us-east-1.rds.amazonaws.com"
                    value={formData.host}
                    onChange={(e) => handleInputChange('host', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="port" className="text-sm">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="5432"
                    value={formData.port}
                    onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 5432)}
                    className="h-9"
                  />
                </div>

                <Button 
                  onClick={handleConnect} 
                  disabled={isLoading}
                  className="w-full h-9"
                >
                  {isLoading ? 'Connecting...' : 'Connect Database'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Select Tables and Columns</CardTitle>
                  <CardDescription className="text-sm">
                    Choose the tables and columns you want to include in the schema extraction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(tables).map(([tableName, columns]) => (
                      <div key={tableName} className="border rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`table-${tableName}`}
                            checked={tableName in selectedTables}
                            onCheckedChange={(checked) => handleTableSelection(tableName, checked as boolean)}
                            disabled={isExtracting || isSemanticExtracting || isVectorInserting}
                          />
                          <Label htmlFor={`table-${tableName}`} className="text-base font-semibold">
                            {tableName}
                          </Label>
                        </div>
                        
                        {tableName in selectedTables && (
                          <div className="ml-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                            {columns.map((column) => (
                              <div key={column} className="flex items-center space-x-1">
                                <Checkbox
                                  id={`${tableName}-${column}`}
                                  checked={selectedTables[tableName]?.includes(column) || false}
                                  onCheckedChange={(checked) => handleColumnSelection(tableName, column, checked as boolean)}
                                  disabled={isExtracting || isSemanticExtracting || isVectorInserting}
                                />
                                <Label htmlFor={`${tableName}-${column}`} className="text-xs">
                                  {column}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Button 
                      onClick={handleExtractSchemas} 
                      disabled={isExtracting || isSemanticExtracting || isVectorInserting || Object.keys(selectedTables).length === 0}
                      className="flex-1 h-9"
                    >
                      <Send className="h-3 w-3 mr-2" />
                      {isExtracting ? 'Extracting Schemas...' : 
                       isSemanticExtracting ? 'Processing Semantic Extraction...' : 
                       isVectorInserting ? 'Processing Vector Data Insert...' :
                       'Extract Selected Schemas'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowSchemaSelection(false);
                        setTables({});
                        setSelectedTables({});
                        setCurrentStep(1);
                      }}
                      disabled={isExtracting || isSemanticExtracting || isVectorInserting}
                      className="h-9"
                    >
                      Back to Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConnectDatabase;
