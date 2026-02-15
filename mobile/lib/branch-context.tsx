import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Branch } from '@/types/database';

interface BranchContextValue {
  branches: Branch[];
  currentBranch: Branch | null;
  selectBranch: (branchId: string) => Promise<void>;
  isLoading: boolean;
  needsPicker: boolean;
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { businessUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsPicker, setNeedsPicker] = useState(false);

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
      // Auto-select the only branch
      setCurrentBranch(branchList[0]);
      setNeedsPicker(false);
    } else if (businessUser.last_branch_id) {
      // Try to restore last selected branch
      const last = branchList.find((b) => b.id === businessUser.last_branch_id);
      if (last) {
        setCurrentBranch(last);
        setNeedsPicker(false);
      } else {
        setNeedsPicker(true);
      }
    } else if (branchList.length > 1) {
      setNeedsPicker(true);
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
      setNeedsPicker(false);

      // Persist selection
      await supabase
        .from('business_user')
        .update({ last_branch_id: branchId })
        .eq('id', businessUser.id);
    },
    [branches, businessUser],
  );

  return (
    <BranchContext.Provider value={{ branches, currentBranch, selectBranch, isLoading, needsPicker }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
}
