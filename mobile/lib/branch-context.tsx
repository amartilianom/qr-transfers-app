import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Branch } from '@/types/database';

interface BranchContextValue {
  branches: Branch[];
  currentBranch: Branch | null;       // null when "Todas" is selected
  isAllBranches: boolean;
  selectedBranchIds: string[];        // all IDs when "Todas", else [currentBranch.id]
  selectBranch: (branchId: string) => Promise<void>;
  selectAllBranches: () => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { currentBusinessUser: businessUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [isAllBranches, setIsAllBranches] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranches = useCallback(async () => {
    if (!businessUser) return;

    setIsLoading(true);
    const { data } = await supabase
      .from('branch')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true })
      .returns<Branch[]>();

    const branchList = data ?? [];
    setBranches(branchList);

    if (branchList.length === 1) {
      setCurrentBranch(branchList[0]);
      setIsAllBranches(false);
    } else if (branchList.length > 1) {
      if (businessUser.last_branch_id) {
        const last = branchList.find((b) => b.id === businessUser.last_branch_id);
        if (last) {
          setCurrentBranch(last);
          setIsAllBranches(false);
        } else {
          // Last branch not found — collaborators default to first, admins to "Todas"
          if (businessUser.role !== 'admin') {
            setCurrentBranch(branchList[0]);
            setIsAllBranches(false);
          } else {
            setCurrentBranch(null);
            setIsAllBranches(true);
          }
        }
      } else {
        // Collaborators must always have a specific branch — default to first
        if (businessUser.role !== 'admin') {
          setCurrentBranch(branchList[0]);
          setIsAllBranches(false);
        } else {
          setCurrentBranch(null);
          setIsAllBranches(true);
        }
      }
    }

    setIsLoading(false);
  }, [businessUser]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const selectBranch = useCallback(
    async (branchId: string) => {
      const branch = branches.find((b) => b.id === branchId);
      if (!branch || !businessUser) return;

      setCurrentBranch(branch);
      setIsAllBranches(false);

      await supabase
        .from('business_user')
        .update({ last_branch_id: branchId })
        .eq('id', businessUser.id);
    },
    [branches, businessUser],
  );

  const selectAllBranches = useCallback(() => {
    setCurrentBranch(null);
    setIsAllBranches(true);
  }, []);

  const selectedBranchIds = useMemo(
    () => (isAllBranches ? branches.map((b) => b.id) : currentBranch ? [currentBranch.id] : []),
    [isAllBranches, branches, currentBranch],
  );

  return (
    <BranchContext.Provider
      value={{ branches, currentBranch, isAllBranches, selectedBranchIds, selectBranch, selectAllBranches, isLoading }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
}
