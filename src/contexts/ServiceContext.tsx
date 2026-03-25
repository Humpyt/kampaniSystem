import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  estimated_days?: number;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ServiceContextType {
  services: Service[];
  loading: boolean;
  error: string | null;
  addService: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  refreshServices: () => Promise<void>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3000/api/services');

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      setServices(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch services';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const addService = async (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('http://localhost:3000/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(service),
      });

      if (!response.ok) {
        throw new Error('Failed to add service');
      }

      const newService = await response.json();
      setServices(prev => [...prev, newService]);
      toast.success('Service added successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add service';
      toast.error(message);
      throw err;
    }
  };

  const updateService = async (id: string, serviceUpdate: Partial<Service>) => {
    try {
      const response = await fetch(`http://localhost:3000/api/services/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceUpdate),
      });

      if (!response.ok) {
        throw new Error('Failed to update service');
      }

      const updatedService = await response.json();
      setServices(prev =>
        prev.map(service => (service.id === id ? updatedService : service))
      );
      toast.success('Service updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update service';
      toast.error(message);
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/services/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      setServices(prev => prev.filter(service => service.id !== id));
      toast.success('Service deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete service';
      toast.error(message);
      throw err;
    }
  };

  const contextValue: ServiceContextType = {
    services,
    loading,
    error,
    addService,
    updateService,
    deleteService,
    refreshServices: fetchServices,
  };

  return (
    <ServiceContext.Provider value={contextValue}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};
