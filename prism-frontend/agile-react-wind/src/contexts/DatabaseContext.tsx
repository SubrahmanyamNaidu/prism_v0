
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ConnectedDatabase {
  database: string;
  db_type: string;
  db_id: string;
}

interface DatabaseContextType {
  connectedDatabaseId: string | null;
  setConnectedDatabaseId: (id: string | null) => void;
  connectedDatabase: ConnectedDatabase | null;
  setConnectedDatabase: (db: ConnectedDatabase | null) => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider = ({ children }: DatabaseProviderProps) => {
  const [connectedDatabaseId, setConnectedDatabaseId] = useState<string | null>(
    localStorage.getItem('connected_database_id')
  );
  const [connectedDatabase, setConnectedDatabase] = useState<ConnectedDatabase | null>(
    localStorage.getItem('connected_database') 
      ? JSON.parse(localStorage.getItem('connected_database')!)
      : null
  );
  const { toast } = useToast();

  // Save to localStorage whenever the connected database changes
  useEffect(() => {
    if (connectedDatabaseId) {
      localStorage.setItem('connected_database_id', connectedDatabaseId);
    } else {
      localStorage.removeItem('connected_database_id');
    }
  }, [connectedDatabaseId]);

  useEffect(() => {
    if (connectedDatabase) {
      localStorage.setItem('connected_database', JSON.stringify(connectedDatabase));
    } else {
      localStorage.removeItem('connected_database');
    }
  }, [connectedDatabase]);

  const handleSetConnectedDatabase = (db: ConnectedDatabase | null) => {
    if (db) {
      setConnectedDatabaseId(db.db_id);
      setConnectedDatabase(db);
      toast({
        title: "Database Connected",
        description: `Connected to ${db.database}`,
      });
    } else {
      setConnectedDatabaseId(null);
      setConnectedDatabase(null);
      toast({
        title: "Database Disconnected",
        description: "Database connection removed",
      });
    }
  };

  return (
    <DatabaseContext.Provider
      value={{
        connectedDatabaseId,
        setConnectedDatabaseId,
        connectedDatabase,
        setConnectedDatabase: handleSetConnectedDatabase,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
