import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseError(error) {
  if (error?.code === '23505') {
    return 'Este e-mail já está cadastrado. Entre na sua conta ou recupere sua senha.';
  }

  if (error?.message?.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (error?.code === 'email_not_confirmed' || error?.message?.includes('Email not confirmed')) {
    return 'Confirme seu e-mail pelo link enviado antes de entrar.';
  }

  if (error?.message?.includes('captcha') || error?.message?.includes('CAPTCHA')) {
    return 'Não foi possível validar a proteção antirobô. Conclua novamente a verificação e tente entrar.';
  }

  return error?.message || 'Não foi possível concluir a operação. Tente novamente.';
}
