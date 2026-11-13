$dir = "d:\桌面\tuku"
$port = 8000

Add-Type -TypeDefinition @"
using System;
using System.Net;
using System.IO;
using System.Text;
using System.Threading;

public class PhotoServer {
    public static void Start(string dir, int port) {
        HttpListener listener = new HttpListener();
        listener.Prefixes.Add("http://localhost:" + port + "/");
        listener.Start();
        Console.WriteLine("========================================");
        Console.WriteLine("  Haolook World - Photo Portfolio");
        Console.WriteLine("  Server: http://localhost:" + port);
        Console.WriteLine("========================================");
        while (true) {
            HttpListenerContext ctx = listener.GetContext();
            ThreadPool.QueueUserWorkItem((_) => Handle(ctx, dir));
        }
    }
    static void Handle(HttpListenerContext ctx, string root) {
        string path = ctx.Request.Url.AbsolutePath.TrimStart('/');
        if (path == "") path = "index.html";
        string fullPath = Path.Combine(root, path);
        if (!File.Exists(fullPath)) {
            ctx.Response.StatusCode = 404;
            ctx.Response.Close();
            return;
        }
        string ext = Path.GetExtension(fullPath).ToLower();
        string mime = "application/octet-stream";
        switch(ext) {
            case ".html": mime = "text/html; charset=utf-8"; break;
            case ".css": mime = "text/css; charset=utf-8"; break;
            case ".js": mime = "application/javascript; charset=utf-8"; break;
            case ".json": mime = "application/json; charset=utf-8"; break;
            case ".jpg": case ".jpeg": mime = "image/jpeg"; break;
            case ".png": mime = "image/png"; break;
            case ".gif": mime = "image/gif"; break;
            case ".webp": mime = "image/webp"; break;
            case ".bmp": mime = "image/bmp"; break;
            case ".svg": mime = "image/svg+xml"; break;
            case ".ico": mime = "image/x-icon"; break;
            case ".woff": mime = "font/woff"; break;
            case ".woff2": mime = "font/woff2"; break;
        }
        byte[] data = File.ReadAllBytes(fullPath);
        ctx.Response.ContentType = mime;
        ctx.Response.ContentLength64 = data.Length;
        ctx.Response.AddHeader("Cache-Control", "no-cache, no-store");
        ctx.Response.AddHeader("Access-Control-Allow-Origin", "*");
        ctx.Response.OutputStream.Write(data, 0, data.Length);
        ctx.Response.Close();
    }
}
"@ -Language CSharp -ErrorAction Stop

[PhotoServer]::Start($dir, $port)
