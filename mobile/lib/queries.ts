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

export async function getTransfersByDateRange(branchIds: string | string[], start: Date, end: Date) {
  const ids = Array.isArray(branchIds) ? branchIds : [branchIds];
  return supabase
    .from('transfer')
    .select('*')
    .in('branch_id', ids)
    .eq('active', true)
    .gte('occurred_at', start.toISOString())
    .lte('occurred_at', end.toISOString())
    .order('occurred_at', { ascending: false })
    .returns<Transfer[]>();
}

export async function getTodayTransfers(branchIds: string | string[]) {
  const ids = Array.isArray(branchIds) ? branchIds : [branchIds];
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return supabase
    .from('transfer')
    .select('*')
    .in('branch_id', ids)
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

export async function createBranch(businessId: string, name: string, address?: string) {
  return supabase.rpc('create_branch', { p_business_id: businessId, p_name: name, p_address: address ?? null });
}

export async function updateBranch(branchId: string, updates: { name?: string; address?: string | null; active?: boolean }) {
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
  name?: string,
  phone?: string,
) {
  return supabase
    .from('invite')
    .insert({
      business_id: businessId,
      created_by: createdBy,
      role,
      branch_ids: branchIds,
      name: name ?? '',
      phone: phone ?? '',
    })
    .select()
    .single<Invite>();
}

// ============================================================
// Team
// ============================================================

export async function getTeamCollaborators(businessId: string) {
  return supabase
    .from('business_user')
    .select('*')
    .eq('business_id', businessId)
    .eq('role', 'collaborator')
    .eq('active', true)
    .order('created_at', { ascending: true })
    .returns<BusinessUser[]>();
}

export async function getPendingInvites(businessId: string) {
  return supabase
    .from('invite')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .returns<Invite[]>();
}

export async function updateTeamMember(buId: string, updates: { name?: string; whatsapp?: string }) {
  return supabase.from('business_user').update(updates).eq('id', buId);
}

export async function removeTeamMember(buId: string) {
  return supabase.from('business_user').update({ active: false }).eq('id', buId);
}

export async function updateInviteMember(inviteId: string, updates: { name?: string; phone?: string }) {
  return supabase.from('invite').update(updates).eq('id', inviteId);
}

export async function cancelInvite(inviteId: string) {
  return supabase.from('invite').update({ status: 'rejected' }).eq('id', inviteId);
}
