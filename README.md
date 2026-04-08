```typescript
//src/hooks.server.ts
import { createApiGuard } from 'apiguard';
import type { Handle } from '@sveltejs/kit';

const guard = createApiGuard();

export const handle: Handle = async ({ event, resolve }) => {
  guard(event);
  return resolve(event);
};
```

```typescript
// src/routes/+layout.server.ts
export const load = ({ cookies }) => {
  return {
    apiToken: cookies.get('x-api-guard-token')
  };
};
```

```svelte
// src/routes/+page.svelte
<script lang="ts">
  import { createSecureFetch } from 'svelte-apiguard';
  import { page } from '$app/stores';

  // Tworzymy zabezpieczony fetch używając tokena z danych strony
  const secureFetch = createSecureFetch($page.data.apiToken);

  async function getData() {
    const res = await secureFetch('/api/protected-route');
    const json = await res.json();
    console.log(json);
  }
</script>

<button on:click={getData}>Pobierz dane</button>
```


```
npm run build
npm link
npm link svelte-apiguard
```
