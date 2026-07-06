import { isSupabaseConfigured, supabase } from "@/lib/data/supabaseClient";

export type LocalAccount = {
  id: string;
  email: string;
  nickname: string;
  password?: string;
  createdAt: string;
};

const ACCOUNTS_KEY = "pokeauto.accounts";
const SESSION_KEY = "pokeauto.sessionAccountId";

function readAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(ACCOUNTS_KEY);
    return stored ? (JSON.parse(stored) as LocalAccount[]) : [];
  } catch {
    window.localStorage.removeItem(ACCOUNTS_KEY);
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getNicknameFromMetadata(metadata: Record<string, unknown> | undefined, email: string): string {
  const nickname = metadata?.nickname;
  return typeof nickname === "string" && nickname.trim() ? nickname : email.split("@")[0] || "트레이너";
}

export async function getCurrentAccount(): Promise<LocalAccount | undefined> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) return undefined;

    return {
      id: data.user.id,
      email: data.user.email,
      nickname: getNicknameFromMetadata(data.user.user_metadata, data.user.email),
      createdAt: data.user.created_at
    };
  }

  if (typeof window === "undefined") return undefined;
  const accountId = window.localStorage.getItem(SESSION_KEY);
  if (!accountId) return undefined;
  return readAccounts().find((account) => account.id === accountId);
}

export async function signUpLocalAccount(email: string, password: string, nickname: string): Promise<LocalAccount> {
  const normalizedEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    if (!normalizedEmail || !password || !nickname.trim()) {
      throw new Error("이메일, 비밀번호, 닉네임을 모두 입력해주세요.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { nickname: nickname.trim() } }
    });

    if (error) throw new Error(error.message);
    if (!data.user?.email) throw new Error("회원가입을 완료하지 못했습니다.");
    if (!data.session) {
      throw new Error("회원가입 메일 확인이 필요합니다. 이메일 인증을 완료한 뒤 로그인해주세요.");
    }

    return {
      id: data.user.id,
      email: data.user.email,
      nickname: getNicknameFromMetadata(data.user.user_metadata, normalizedEmail),
      createdAt: data.user.created_at
    };
  }

  const accounts = readAccounts();

  if (!normalizedEmail || !password || !nickname.trim()) {
    throw new Error("이메일, 비밀번호, 닉네임을 모두 입력해주세요.");
  }

  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error("이미 가입된 이메일입니다.");
  }

  const account = {
    id: `account-${Date.now()}`,
    email: normalizedEmail,
    nickname: nickname.trim(),
    password,
    createdAt: new Date().toISOString()
  };

  writeAccounts([...accounts, account]);
  window.localStorage.setItem(SESSION_KEY, account.id);
  return account;
}

export async function signInLocalAccount(email: string, password: string): Promise<LocalAccount> {
  const normalizedEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw new Error(error.message);
    if (!data.user?.email) throw new Error("로그인 정보를 확인하지 못했습니다.");

    return {
      id: data.user.id,
      email: data.user.email,
      nickname: getNicknameFromMetadata(data.user.user_metadata, data.user.email),
      createdAt: data.user.created_at
    };
  }

  const account = readAccounts().find((entry) => entry.email === normalizedEmail && entry.password === password);

  if (!account) {
    throw new Error("이메일 또는 비밀번호가 맞지 않습니다.");
  }

  window.localStorage.setItem(SESSION_KEY, account.id);
  return account;
}

export async function signOutLocalAccount() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}
