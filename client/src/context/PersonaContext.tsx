import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Persona } from "@shared/schema";

interface PersonaContextProps {
  personas: Persona[];
  activePersona: Persona | null;
  setActivePersona: (persona: Persona | null) => void;
  isLoading: boolean;
  error: Error | null;
}

const PersonaContext = createContext<PersonaContextProps>({
  personas: [],
  activePersona: null,
  setActivePersona: () => {},
  isLoading: false,
  error: null,
});

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  
  // Fetch personas
  const { data, isLoading, error } = useQuery<Persona[]>({
    queryKey: ['/api/personas'],
    retry: 1,
  });
  
  const personas = data || [];
  
  // Set the first persona as active if none is selected
  useEffect(() => {
    if (personas.length > 0 && !activePersona) {
      setActivePersona(personas[0]);
    }
  }, [personas, activePersona]);
  
  return (
    <PersonaContext.Provider
      value={{
        personas,
        activePersona,
        setActivePersona,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersonaContext() {
  return useContext(PersonaContext);
}