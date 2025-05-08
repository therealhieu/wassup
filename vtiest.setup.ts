import fetch from "cross-fetch";
(global as unknown as { fetch: typeof fetch }).fetch = fetch;
