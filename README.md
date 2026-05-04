# Svelte ApiGuard

**Svelte ApiGuard** is a lightweight security library for SvelteKit. It protects API routes from unauthorized access by implementing synchronized token validation and optional **AES-256-GCM response encryption**.

## How it works

1. **Server side**: A hook intercepts every request. For API routes (`/api/*`), it requires a `x-api-guard-token` header matching an HttpOnly cookie bound to the session. Mismatches are rejected with `403 Access Denied`. Optionally encrypts JSON responses with AES-256-GCM.
2. **Client side**: `secureFetch` attaches the token from your page data to every request header and transparently decrypts encrypted responses.

---

## Installation

```bash
npm install apiguard-svelte
```

---

## Setup

### 1. `vite.config.ts` — bundle for SSR

Because the package uses SvelteKit virtual modules, it must be included in the SSR bundle:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    ssr: {
        noExternal: ['apiguard-svelte']
    }
});
```

### 2. `src/hooks.server.ts` — protect your API

```typescript
import { createApiGuard } from 'apiguard-svelte';
import { dev } from '$app/environment';

const guard = createApiGuard({
    dev: dev,       // disables encryption and relaxes cookie in dev
    apiPrefix: '/api'
});

export const handle = async ({ event, resolve }) => {
    return await guard(event, resolve);
};
```

### 3. `src/routes/+layout.server.ts` — pass the token to the client

```typescript
export const load = ({ locals }) => {
    return {
        apiToken: locals.apiToken
    };
};
```

### 4. Client-side wrapper — reliable token injection

`secureFetch` reads the token internally from `$app/state`. In some production environments (e.g. Appwrite, Vercel Edge) this can fail silently because the module resolves in a separate bundle context. The recommended pattern is a thin project-level wrapper that reads the token explicitly via `$app/stores`:

```typescript
// src/lib/apiguard.ts
import { secureFetch as _secureFetch } from 'apiguard-svelte';
import { get } from 'svelte/store';
import { page } from '$app/stores';

type SecureFetchInit = Parameters<typeof _secureFetch>[1] & { token?: string };

export const secureFetch = <T = any>(
    input: RequestInfo | URL,
    init?: SecureFetchInit
): Promise<T> => {
    const token = init?.token ?? (get(page).data as Record<string, string>).apiToken;
    return _secureFetch<T>(input, { ...init, token });
};
```

Then import `secureFetch` from `$lib/apiguard` instead of `apiguard-svelte` in your components.

### 5. Usage in components

```svelte
<script lang="ts">
    import { secureFetch } from '$lib/apiguard';

    async function loadData() {
        const { success, data, error } = await secureFetch('/api/protected');
        if (success) {
            console.log(data);
        }
    }
</script>
```

---

## Configuration

### `createApiGuard(options)`

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiPrefix` | `string` | `/api` | URL prefix to protect. |
| `cookieName` | `string` | `x-api-guard-token` | Name of the HttpOnly session cookie. |
| `headerName` | `string` | `x-api-guard-token` | Header name used for token validation. |
| `dev` | `boolean` | `false` | Disables AES-256-GCM encryption and sets `secure: false` on the cookie. Pass `dev` from `$app/environment`. |

### `secureFetch<T>(input, init?)`

Drop-in replacement for `fetch`. Additional options in `init`:

| Option | Type | Description |
| :--- | :--- | :--- |
| `token` | `string` | Explicit token override. Skips the automatic `page.data` lookup when set. |
| `fetch` | `typeof fetch` | Custom fetch implementation (e.g. SvelteKit's `event.fetch`). |

Returns a normalized result object:

```typescript
{ success: true,  data: T }
{ success: false, data: null, error: string, status: number }
```

---

## Security notes

- **HTTPS required for encryption**: `crypto.subtle` (used for client-side decryption) is only available in [Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). On plain HTTP, set `dev: true` to disable encryption.
- **What it protects against**: direct API calls from curl/Postman/bots that don't have the session cookie.
- **What it does NOT protect against**: a malicious script running in the same browser session (it has access to the same cookies).
- **Cookie flags**: `HttpOnly`, `SameSite: Strict`, `Secure` (unless `dev: true`).
