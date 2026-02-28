import { supabase } from '@/lib/supabase';
import { Transfer, Branch, BusinessUser, Invite, TransferProvider, UserRole } from '@/types/database';

// ============================================================
// Transfers
// ============================================================

export async function getTransferHistory(branchId: string) {
  return supabase
    .from('transfer')
    .select('*')
    .eq('branch_id', branchId)
    .eq('active', true)
    .order('occurred_at', { ascending: false })
    .returns<Transfer[]>();
}

export async function getTodayTransfers(branchId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return supabase
    .from('transfer')
    .select('*')
    .eq('branch_id', branchId)
    .gte('occurred_at', startOfDay.toISOString())
    .eq('active', true)
    .order('occurred_at', { ascending: false })
    .returns<Transfer[]>();
}

export async function createTransfer(data: {
  branch_id: string;
  created_by: string;
  amount: number;
  provider: TransferProvider;
  transaction_id?: string | null;
  receipt_path?: string | null;
  occurred_at?: string;
}) {
  return supabase.from('transfer').insert(data).select().single<Transfer>();
}

export async function checkDuplicateTransactionId(txnId: string, branchId: string) {
  return supabase
    .from('transfer')
    .select('id, amount, provider, occurred_at')
    .eq('transaction_id', txnId)
    .eq('branch_id', branchId)
    .eq('active', true);
}

// ============================================================
// Receipt upload
// ============================================================

export async function uploadReceipt(localUri: string, storagePath: string) {
  const response = await fetch(localUri);
  const blob = await response.blob();

  return supabase.storage.from('receipts').upload(storagePath, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
}

// ============================================================
// Branches
// ============================================================

export async function getBranches() {
  return supabase
    .from('branch')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })
    .returns<Branch[]>();
}

export async function createBranch(businessId: string, name: string) {
  return supabase
    .from('branch')
    .insert({ business_id: businessId, name })
    .select()
    .single<Branch>();
}

export async function updateBranch(branchId: string, updates: { name?: string; active?: boolean }) {
  return supabase.from('branch').update(updates).eq('id', branchId);
}

// ============================================================
// Business User
// ============================================================

export async function getBusinessUser(userId: string) {
  return supabase
    .from('business_user')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .limit(1)
    .single<BusinessUser>();
}

export async function updateLastBranch(businessUserId: string, branchId: string) {
  return supabase
    .from('business_user')
    .update({ last_branch_id: branchId })
    .eq('id', businessUserId);
}

// ============================================================
// Invites
// ============================================================

export async function createInvite(
  businessId: string,
  createdBy: string,
  role: UserRole,
  branchIds: string[],
) {
  return supabase
    .from('invite')
    .insert({
      business_id: businessId,
      created_by: createdBy,
      role,
      branch_ids: branchIds,
    })
    .select()
    .single<Invite>();
}
