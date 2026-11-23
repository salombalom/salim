/** ربط ولي الأمر بالطالب وتقارير الخادم (عند تفعيل Supabase وتسجيل الدخول) */
import type { GradeNumber } from '@/config/curriculum';
import { mapServerReport, type ChildReport } from '@/lib/report';
import { supabase } from '@/lib/supabase';

export interface LinkedChild {
  studentId: string;
  displayName: string | null;
  grade: GradeNumber | null;
  points: number;
  streak: number;
  streakBest: number;
  lastActive: string | null;
}

export interface LinkedParent {
  parentId: string;
  displayName: string | null;
  linkedAt: string;
}

function need() {
  if (!supabase) throw new Error('الخدمة غير متاحة في هذه النسخة.');
  return supabase;
}

/** الطالب: رمز ربط جديد صالح 24 ساعة */
export async function createLinkCode(): Promise<{ code: string; expiresAt: string }> {
  const { data, error } = await need().rpc('create_parent_link_code');
  if (error) throw new Error('تعذّر إنشاء الرمز. تأكد من الاتصال وحاول مرة أخرى.');
  return { code: data.code, expiresAt: data.expires_at };
}

/** ولي الأمر: إدخال رمز الطالب */
export async function redeemLinkCode(code: string): Promise<LinkedChild['studentId']> {
  const { data, error } = await need().rpc('redeem_parent_link_code', { p_code: code });
  if (error) throw new Error(error.code === 'P0002' ? 'الرمز غير صحيح أو انتهت صلاحيته. اطلب من ابنك رمزاً جديداً.' : 'تعذّر الربط. حاول مرة أخرى.');
  return data.student_id;
}

export async function removeLink(otherId: string): Promise<void> {
  const { error } = await need().rpc('remove_parent_link', { p_other: otherId });
  if (error) throw new Error('تعذّر إلغاء الربط.');
}

export async function fetchChildren(): Promise<LinkedChild[]> {
  const { data, error } = await need().rpc('my_children');
  if (error) throw new Error('تعذّر تحميل قائمة الأبناء.');
  return (data ?? []).map((r: any) => ({
    studentId: r.student_id,
    displayName: r.display_name,
    grade: r.grade_id,
    points: r.points,
    streak: r.streak_count,
    streakBest: r.streak_best,
    lastActive: r.last_active_date,
  }));
}

export async function fetchParents(): Promise<LinkedParent[]> {
  const { data, error } = await need().rpc('my_parents');
  if (error) throw new Error('تعذّر تحميل أولياء الأمور المرتبطين.');
  return (data ?? []).map((r: any) => ({ parentId: r.parent_id, displayName: r.display_name, linkedAt: r.linked_at }));
}

export async function fetchChildReport(studentId: string, days = 30): Promise<ChildReport> {
  const { data, error } = await need().rpc('child_report', { p_student: studentId, p_days: days });
  if (error) throw new Error('تعذّر تحميل التقرير.');
  return mapServerReport(data);
}
