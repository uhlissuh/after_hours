import { cookie } from "../../_lib/auth.js";
export async function onRequestPost() {
  return new Response(null, { status: 204, headers: { "Set-Cookie": cookie("ah_session", "", 0) } });
}
