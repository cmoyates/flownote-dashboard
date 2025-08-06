import { NotionDatabase } from "@/types/notion";
import { create } from "zustand";

interface APIKeyStoreState {
  allDatabases: NotionDatabase[];
  activeDatabaseID: string;
  setAllDatabases: (allDatabases: NotionDatabase[]) => void;
  setActiveDatabaseID: (id: string) => void;
}

export const useDatabaseTableStore = create<APIKeyStoreState>((set, get) => {
  // #region Functions

  const setAllDatabases = (databases: NotionDatabase[]) => {
    set({ allDatabases: databases });
  };

  const setActiveDatabaseID = (id: string) => {
    set({ activeDatabaseID: id });
  };

  // #endregion Functions

  return {
    allDatabases: [],
    activeDatabaseID: "",
    setAllDatabases,
    setActiveDatabaseID,
  };
});
