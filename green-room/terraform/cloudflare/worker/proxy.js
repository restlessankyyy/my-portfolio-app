// Green Room edge proxy Worker.
//
// API Gateway's default (regional) endpoint returns HTTP 403 for any Host
// header other than its own *.execute-api name. Cloudflare's Free plan cannot
// override the origin Host header (Origin Rules Host-header override is
// Enterprise-only), so instead this Worker sits on meet.ankitraj.cloud/* and
// forwards each request straight to the execute-api origin. Because the
// outbound request targets the execute-api hostname, the Host (and SNI) sent to
// AWS are the execute-api name, so API Gateway accepts the request.
//
// ORIGIN_HOST is injected as a plain-text binding (the execute-api host).
export default {
  async fetch(request, env) {
    const origin = env.ORIGIN_HOST;

    const url = new URL(request.url);
    url.hostname = origin;
    url.protocol = "https:";
    url.port = "";

    // Copy method, headers, and body from the incoming request, but retarget it
    // at the execute-api origin. The runtime derives Host/SNI from the URL.
    const proxied = new Request(url.toString(), request);
    proxied.headers.set("Host", origin);

    return fetch(proxied);
  },
};
