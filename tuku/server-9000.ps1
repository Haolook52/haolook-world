$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 9000

$code = @'
using System;
using System.Net;
using System.IO;
using System.Threading;
using System.Text;

public class PhotoServer9000
{
    public static void Run(string root, int port)
    {
        HttpListener listener = new HttpListener();
        listener.Prefixes.Add("http://localhost:" + port + "/");
        listener.Start();
        Console.WriteLine("============================================");
        Console.WriteLine("  Haolook World - Photography Portfolio");
        Console.WriteLine("  Local URL: http://localhost:" + port + "/");
        Console.WriteLine("  Root: " + root);
        Console.WriteLine("============================================");

        while (true)
        {
            HttpListenerContext ctx = listener.GetContext();
            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                HttpListenerContext c = (HttpListenerContext)state;
                try
                {
                    string urlPath = c.Request.Url.AbsolutePath.TrimStart('/');
                    if (urlPath == "") urlPath = "index.html";
                    string fullPath = Path.Combine(root, urlPath);

                    if (!File.Exists(fullPath))
                    {
                        c.Response.StatusCode = 404;
                        byte[] nf = Encoding.UTF8.GetBytes("404 Not Found: " + urlPath);
                        c.Response.OutputStream.Write(nf, 0, nf.Length);
                        c.Response.Close();
                        return;
                    }

                    string ext = Path.GetExtension(fullPath).ToLower();
                    string mime = "application/octet-stream";
                    if (ext == ".html") mime = "text/html; charset=utf-8";
                    else if (ext == ".css") mime = "text/css; charset=utf-8";
                    else if (ext == ".js") mime = "application/javascript; charset=utf-8";
                    else if (ext == ".json") mime = "application/json; charset=utf-8";
                    else if (ext == ".jpg" || ext == ".jpeg") mime = "image/jpeg";
                    else if (ext == ".png") mime = "image/png";
                    else if (ext == ".gif") mime = "image/gif";
                    else if (ext == ".webp") mime = "image/webp";
                    else if (ext == ".bmp") mime = "image/bmp";
                    else if (ext == ".svg") mime = "image/svg+xml";
                    else if (ext == ".ico") mime = "image/x-icon";
                    else if (ext == ".woff") mime = "font/woff";
                    else if (ext == ".woff2") mime = "font/woff2";

                    byte[] data = File.ReadAllBytes(fullPath);
                    c.Response.ContentType = mime;
                    c.Response.ContentLength64 = data.Length;
                    c.Response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                    c.Response.OutputStream.Write(data, 0, data.Length);
                    c.Response.Close();
                }
                catch { c.Response.Close(); }
            }, ctx);
        }
    }
}
'@

Add-Type -TypeDefinition $code -Language CSharp
[PhotoServer9000]::Run($dir, $port)
