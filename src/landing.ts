import { deployCommands } from "./commands";
import { Options } from "./options";

export function authorizeResponse(applicationId: string) {
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", applicationId);
  url.searchParams.set("scope", "applications.commands");
  return Response.redirect(url.toString());
}

const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<title>⚔️ Slshx</title>
<style>
body {
  margin: 0;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 14px;
  text-align: center;
  background-color: #36393f;
  color: #fff;
}
h1 { margin: 16px 0; font-size: 128px }
p { line-height: 1.5 }
form { margin-bottom: 8px }
input[type=submit] {
  width: 100%;
  max-width: 250px;
  text-align: center;
  border: none;
  border-radius: 3px;
  height: 32px;
  cursor: pointer;
  color: #fff;
  background-color: #4f545b;
  transition: background-color .17s ease;
}
input[type=submit]:hover { background-color: #5d6269 }
input[type=submit]:active { background-color: #72767d }
input[type=submit].primary { background-color: #5865f2 }
input[type=submit].primary:hover { background-color: #4752c4 }
input[type=submit].primary:active { background-color: #3c45a5 }
</style>
</head>
<body>
<h1>⚔️</h1>
<form method="post" action="?slshx_action=authorize" target="_blank"><input type="submit" value="Add to Server" class="primary"></form>
<form method="post" action="?slshx_action=deploy"><input type="submit" value="Deploy Commands Globally"></form>
<p></p>
<script>
document.querySelectorAll("form")[1].onsubmit = function (e) {
  if(!confirm("⚠️ Are you sure you want to deploy globally? This will update the commands in EVERY server your app (%APP_ID%) has been added to. Changes may take up to an hour to propagate.\\n\\nNote that Slshx instantly deploys to just your test server whenever you change your code.")) e.preventDefault();
};
</script>
</body>
</html>
`;

export async function handleLanding<Env>(
  opts: Options<Env>,
  request: Request
): Promise<Response | void> {
  const applicationId = opts.applicationId;
  if (!applicationId) {
    return Response.redirect("https://discord.com/developers/applications");
  }
  if (request.method === "GET") {
    return new Response(body.replace("%APP_ID%", applicationId), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } else if (request.method === "POST") {
    const url = new URL(request.url);
    const action = url.searchParams.get("slshx_action");
    if (action === "authorize") return authorizeResponse(applicationId);
    if (action === "deploy") {
      // Deploy commands globally
      await deployCommands({ ...opts, testServerId: undefined });
      return new Response(
        body
          .replace("%APP_ID%", applicationId)
          .replace(
            "<p></p>",
            "<p>Deployed! ✅ <br><i>(changes may take up to an hour to propagate)</i></p>"
          ),
        {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
  }
}
