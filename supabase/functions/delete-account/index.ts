import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

function resolveAllowedOrigin(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return '';
  try {
    const url = new URL(candidate);
    const isLocalHttp = url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol === 'https:' || isLocalHttp) && url.origin === candidate) {
      return url.origin;
    }
  } catch {
    return '';
  }
  return '';
}

const allowedOrigin = resolveAllowedOrigin(Deno.env.get('ALLOWED_ORIGIN'));
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'Retry-After',
  'Vary': 'Origin',
};

function respond(body: Record<string, unknown>, status = 200, extraHeaders: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...corsHeaders, ...extraHeaders } });
}

Deno.serve(async (request) => {
  try {
    const origin = request.headers.get('Origin');
    if (origin && origin !== allowedOrigin) {
      return respond({ error: 'Origem não permitida.' }, 403);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return respond({ error: 'Método não permitido.' }, 405);
    }
    if (request.body !== null) {
      return respond({ error: 'Esta operação não aceita corpo na solicitação.' }, 400);
    }

    const authorization = request.headers.get('Authorization') || '';
    const bearer = /^Bearer\s+([^\s]+)$/i.exec(authorization);
    if (!bearer || bearer[1].length > 8192) {
      return respond({ error: 'Autenticação necessária.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return respond({ error: 'Serviço temporariamente indisponível.' }, 503);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser(bearer[1]);
    if (userError || !user) {
      return respond({ error: 'Sessão inválida ou expirada.' }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: rateLimitData, error: rateLimitError } = await adminClient.rpc(
      'consume_user_rate_limit',
      { p_user_id: user.id, p_limit: 5, p_window_seconds: 60 },
    );
    const rateLimit = Array.isArray(rateLimitData) ? rateLimitData[0] : null;
    if (rateLimitError || !rateLimit || typeof rateLimit.allowed !== 'boolean') {
      console.error('delete-account rate limit check failed', rateLimitError);
      return respond({ error: 'Serviço temporariamente indisponível.' }, 503);
    }
    if (!rateLimit.allowed) {
      const retryAfter = Math.max(1, Number(rateLimit.retry_after) || 1);
      return respond(
        { error: 'Muitas solicitações. Tente novamente mais tarde.' },
        429,
        { 'Retry-After': String(retryAfter) },
      );
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return respond({ error: 'Não foi possível concluir a exclusão da conta.' }, 500);
    }

    return respond({ success: true });
  } catch (error) {
    console.error('delete-account request failed', error);
    return respond({ error: 'Serviço temporariamente indisponível.' }, 500);
  }
});
