// GitHub OAuth helper for Decap CMS, run as a free Cloudflare Worker.
// GitHub Pages can't run server code, so this tiny service swaps the
// GitHub login code for an access token and hands it back to /admin.
//
// Secrets (wrangler secret put …): GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
// Var (wrangler.toml): ALLOWED_ORIGINS — comma-separated site origins

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      const state = crypto.randomUUID();
      const authorize = new URL('https://github.com/login/oauth/authorize');
      authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      authorize.searchParams.set('scope', url.searchParams.get('scope') || 'repo,user');
      authorize.searchParams.set('state', state);
      authorize.searchParams.set('redirect_uri', `${url.origin}/callback`);
      return new Response(null, {
        status: 302,
        headers: {
          Location: authorize.toString(),
          'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        },
      });
    }

    if (url.pathname === '/callback') {
      const cookieState = /(?:^|;\s*)oauth_state=([^;]+)/.exec(request.headers.get('Cookie') || '')?.[1];
      const state = url.searchParams.get('state');
      let status = 'error';
      let content = { error: 'Login could not be verified. Please try again.' };

      if (state && cookieState && state === cookieState) {
        const res = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code: url.searchParams.get('code'),
          }),
        });
        const data = await res.json();
        if (data.access_token) {
          status = 'success';
          content = { token: data.access_token, provider: 'github' };
        } else {
          content = { error: data.error_description || 'GitHub did not return a token.' };
        }
      }

      const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
      const message = `authorization:github:${status}:${JSON.stringify(content)}`;
      const html = `<!doctype html><html><body><script>
        (function () {
          var allowed = ${JSON.stringify(allowed)};
          function receive(e) {
            if (allowed.indexOf(e.origin) === -1) return;
            window.opener.postMessage(${JSON.stringify(message)}, e.origin);
            window.removeEventListener('message', receive);
          }
          window.addEventListener('message', receive);
          window.opener.postMessage('authorizing:github', '*');
        })();
      </script></body></html>`;
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Set-Cookie': 'oauth_state=; Path=/; Max-Age=0',
        },
      });
    }

    return new Response('MindSuite CMS auth helper', { status: 200 });
  },
};
