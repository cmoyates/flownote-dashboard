import { NotionDatabase, NotionPage } from "@/types/notion";
import { RowSelectionState, Updater } from "@tanstack/react-table";
import { create } from "zustand";

interface DatabaseTableStoreState {
  allDatabases: NotionDatabase[];
  activeDatabaseID: string;
  pages: NotionPage[];
  isLoading: boolean;
  error: string | null;
  rowSelection: RowSelectionState;
  selectedRowCount: number;
  setAllDatabases: (allDatabases: NotionDatabase[]) => void;
  setActiveDatabaseID: (id: string) => void;
  setPages: (pages: NotionPage[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
}

export const useDatabaseTableStore = create<DatabaseTableStoreState>(
  (set, get) => {
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

    const setRowSelection = (updater: Updater<RowSelectionState>) => {
      const currentRowSelection = get().rowSelection;

      const newRowSelection =
        typeof updater === "function" ? updater(currentRowSelection) : updater;

      console.log("New row selection:", newRowSelection);
      const selectedRowCount = Object.keys(newRowSelection).filter(
        (key) => newRowSelection[key]
      ).length;
      console.log("Selected row count:", selectedRowCount);

      set({
        rowSelection: newRowSelection,
        selectedRowCount,
      });
    };

    // #endregion Functions

    return {
      allDatabases: [],
      activeDatabaseID: "",
      pages: [],
      isLoading: false,
      error: null,
      rowSelection: {},
      selectedRowCount: 0,
      setAllDatabases,
      setActiveDatabaseID,
      setPages,
      setIsLoading,
      setError,
      setRowSelection,
    };
  }
);
