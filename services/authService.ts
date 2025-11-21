export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    location?: string;
    ecoPoints: number;
    totalCarbon: number;
    streak: number;
    avatarOptions?: {
      seed?: string;
      style?: string;
      mood?: string;
      color?: string;
    };
  };
}


export const register = async (payload: {
  email: string;
  password: string;
  name: string;
  location?: string;
}): Promise<AuthResponse> => {
  const res = await fetch("http://localhost:4000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const contentType = res.headers.get('content-type') || '';
  let body: any = null;
  try {
    if (contentType.includes('application/json')) body = await res.json();
    else body = await res.text();
  } catch (e) {
    body = null;
  }

  if (!res.ok) {
    const msg = body && body.error ? body.error : (typeof body === 'string' ? body : `Status ${res.status}`);
    throw new Error(`Register failed: ${msg}`);
  }

  return body as AuthResponse;
};

export const login = async (payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await fetch("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const contentType = res.headers.get('content-type') || '';
  let body: any = null;
  try {
    if (contentType.includes('application/json')) body = await res.json();
    else body = await res.text();
  } catch (e) {
    body = null;
  }

  if (!res.ok) {
    const msg = body && body.error ? body.error : (typeof body === 'string' ? body : `Status ${res.status}`);
    throw new Error(`Login failed: ${msg}`);
  }

  return body as AuthResponse;
};

export const getProfile = async (email: string) => {
  const res = await fetch(
    `http://localhost:4000/api/auth/profile?email=${encodeURIComponent(email)}`
  );
  if (!res.ok) throw new Error("Profile fetch failed");
  return res.json();
};
