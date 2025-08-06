import { NotionDatabase, NotionPage } from "@/types/notion";
import { create } from "zustand";

interface DatabaseTableStoreState {
  allDatabases: NotionDatabase[];
  activeDatabaseID: string;
  pages: NotionPage[];
  isLoading: boolean;
  error: string | null;
  setAllDatabases: (allDatabases: NotionDatabase[]) => void;
  setActiveDatabaseID: (id: string) => void;
  setPages: (pages: NotionPage[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDatabaseTableStore = create<DatabaseTableStoreState>((set) => {
  // #region Functions

  const setAllDatabases = (databases: NotionDatabase[]) => {
    set({ allDatabases: databases });
  };

  const setActiveDatabaseID = (id: string) => {
    set({ activeDatabaseID: id });
  };

  const setPages = (pages: NotionPage[]) => {
    set({ pages });
  };

  const setIsLoading = (loading: boolean) => {
    set({ isLoading: loading });
  };

  const setError = (error: string | null) => {
    set({ error });
  };

  // #endregion Functions

  return {
    allDatabases: [],
    activeDatabaseID: "",
    pages: [],
    isLoading: false,
    error: null,
    setAllDatabases,
    setActiveDatabaseID,
    setPages,
    setIsLoading,
    setError,
  };
});
