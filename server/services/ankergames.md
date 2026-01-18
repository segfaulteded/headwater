# search modal
```typescript
interface SearchLivewireResponse {
  assets: [];
  components: [{
    snapshot: unknown;
    effects: {
      html: string;
      returns: [];
    };
  }];
}

    let cookies: string | undefined;
    const htmlRaw = await $fetch<string>(this.baseURL, {
      async onResponse({ response }) {
        const cookieString = response.headers
          .entries()
          .filter((v) => v[0] == "set-cookie")
          .map((v) => v[1].split(";").at(0)!.toString())
          .toArray()
          .join("; ");
        cookies = cookieString;
      },
    });
    const html = parse(htmlRaw);
    const tokenEl = html.querySelector('meta[name="csrf-token"]');
    if (!tokenEl) throw new Error("No CSRF token present in request");
    const token = tokenEl.attributes["content"];

    const searchElement = html.querySelector("body > div:nth-child(7)");
    if (!searchElement) throw new Error("No search element");

    const snapshot = searchElement.attributes["wire:snapshot"];

    const requestPayload = {
      _token: token,
      components: [
        {
          snapshot,
          updates: { q: opts.name },
          calls: [],
        },
      ],
    };

    const headers = new Headers();
    headers.set("X-Livewire", "");
    if (cookies) {
      headers.set("cookie", cookies);
    }
    console.log(headers);

    const response = await $fetch<SearchLivewireResponse>(`${this.baseURL}/livewire/update`, {
      method: "POST",
      body: requestPayload,
      headers,
    });

    const htmlResponse = response.components[0].effects.html;

```
