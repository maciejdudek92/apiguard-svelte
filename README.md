#Svelte ApiGuard 🛡️

**Svelte ApiGuard** is a lightweight, security-focused library for SvelteKit applications. It protects your API routes from unauthorized access and data scraping by implementing transparent **AES-256-GCM encryption** and synchronized token validation.

## Key Features

-   🔒 **Automatic Response Encryption**: Encrypts JSON responses from your API routes on-the-fly using AES-256-GCM.
-   🛡️ **Request Validation**: Prevents direct API access from external tools (Postman, curl, or bots) by requiring a session-bound token.
-   ⚡ **Seamless Developer Experience**: Includes a `secureFetch` wrapper that handles decryption and token injection automatically.
-   🚀 **Svelte 5 & Kit Ready**: Built to work perfectly with Svelte 5 snippets, runes, and SvelteKit's standard hooks.
-   🌐 **SSR & CSR Compatible**: Works during both Server-Side Rendering and client-side navigation.

---

## How it works

1.  **Server Side**: A middleware (Hook) intercepts requests to your `/api` routes. It ensures the request contains a valid `x-api-guard-token` matching a secure, HttpOnly cookie. If valid, it encrypts the JSON response before sending it to the client.
2.  **Client Side**: The `secureFetch` utility automatically retrieves the token from your page data, attaches it to the request headers, and decrypts the encrypted payload once it arrives.

---

Installation

```bash
npm install apiguard-svelte

---

Quick Setup

### 1. Server-side Hook
Add the guard to your `src/hooks.server.ts`:

```typescript
import { createApiGuard } from 'apiguard-svelte';
import { dev } from '$app/environment';

const guard = createApiGuard({
    dev: dev, // Disables encryption in dev mode if needed
    apiPrefix: '/api'
});

export const handle = async ({ event, resolve }) => {
    return await guard(event, resolve);
};
```

### 2. Pass the Token to the Client
In your root `src/routes/+layout.server.ts`, pass the generated token to the frontend:

```typescript
export const load = ({ locals }) => {
    return {
        apiToken: locals.apiToken // Automatically injected by ApiGuard
    };
};
```


3. Usage in Components
Use `secureFetch` instead of the native `fetch` to automatically handle security:

```svelte
<script lang="ts">
    import { secureFetch } from 'apiguard-svelte';

    async function fetchData() {
        const { success, data, error } = await secureFetch('/api/protected-route');
        
        if (success) {
            console.log('Decrypted data:', data);
        } else {
            console.error('Error:', error);
        }
    }
</script>
'''

---

Security Requirements

-   **Secure Context (HTTPS)**: This library relies on the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). Browsers only allow access to `crypto.subtle` in **Secure Contexts** (HTTPS or `localhost`).
-   **Local Testing**: When testing on local network IPs (e.g., `192.168.1.x`), ensure you are using HTTPS, otherwise, decryption will fail.

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiPrefix` | `string` | `/api` | The path prefix to protect. |
| `cookieName` | `string` | `x-api-guard-token` | Name of the HttpOnly cookie. |
| `headerName` | `string` | `x-api-guard-token` | Header used for token transmission. |
| `dev` | `boolean` | `false` | If true, disables encryption for easier debugging. |
