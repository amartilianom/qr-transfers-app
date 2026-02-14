export type TransferProvider = 'nequi' | 'daviplata' | 'bancolombia';
export type UserRole = 'admin' | 'collaborator';

// ============================================================
// Row types (what you get back from SELECT)
// ============================================================

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

// ============================================================
// Insert types
// ============================================================

export interface TransferInsert {
  branch_id: string;
  created_by: string;
  amount: number;
  provider: TransferProvider;
  transaction_id?: string | null;
  receipt_path?: string | null;
  occurred_at?: string;
}

export interface BranchInsert {
  business_id: string;
  name: string;
}

export interface InviteInsert {
  business_id: string;
  created_by: string;
  role: UserRole;
  branch_ids: string[];
}

// ============================================================
// Database type for Supabase client
// ============================================================

export interface Database {
  public: {
    Tables: {
      business: {
        Row: Business;
        Insert: Omit<Business, 'id' | 'created_at' | 'updated_at' | 'active'> & { active?: boolean };
        Update: Partial<Omit<Business, 'id' | 'created_at' | 'updated_at'>>;
      };
      branch: {
        Row: Branch;
        Insert: BranchInsert & { active?: boolean };
        Update: Partial<Omit<Branch, 'id' | 'business_id' | 'created_at' | 'updated_at'>>;
      };
      business_user: {
        Row: BusinessUser;
        Insert: Omit<BusinessUser, 'id' | 'created_at' | 'updated_at' | 'active'> & { active?: boolean };
        Update: Partial<Pick<BusinessUser, 'role' | 'last_branch_id' | 'active'>>;
      };
      business_user_branch: {
        Row: BusinessUserBranch;
        Insert: Omit<BusinessUserBranch, 'id' | 'created_at'>;
        Update: never;
      };
      invite: {
        Row: Invite;
        Insert: InviteInsert;
        Update: Partial<Pick<Invite, 'claimed_by'>>;
      };
      transfer: {
        Row: Transfer;
        Insert: TransferInsert;
        Update: Partial<Omit<Transfer, 'id' | 'branch_id' | 'created_by' | 'created_at' | 'updated_at'>>;
      };
    };
    Enums: {
      transfer_provider: TransferProvider;
      user_role: UserRole;
    };
    Functions: {
      bootstrap_business: {
        Args: { p_business_name: string; p_branch_name: string };
        Returns: {
          business: Business;
          branch: Branch;
          business_user: BusinessUser;
        };
      };
      my_branch_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
  };
}
