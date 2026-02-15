export type TransferProvider = 'nequi' | 'daviplata' | 'bancolombia';
export type UserRole = 'admin' | 'collaborator';

// Row types matching the Supabase schema.
// Once the local DB is running, regenerate with:
//   npx supabase gen types typescript --local > types/database.generated.ts

export interface Business {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessUser {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  last_branch_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessUserBranch {
  id: string;
  business_user_id: string;
  branch_id: string;
  created_at: string;
}

export interface Invite {
  id: string;
  business_id: string;
  created_by: string;
  role: UserRole;
  branch_ids: string[];
  token: string;
  claimed_by: string | null;
  expires_at: string;
  created_at: string;
}

export interface Transfer {
  id: string;
  branch_id: string;
  created_by: string;
  amount: number;
  provider: TransferProvider;
  transaction_id: string | null;
  receipt_path: string | null;
  occurred_at: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
