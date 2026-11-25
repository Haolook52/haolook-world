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
        // 监听所有网卡，手机等局域网设备可通过本机 IP 访问
        listener.Prefixes.Add("http://+:" + port + "/");
        listener.Start();
        Console.WriteLine("============================================");
        Console.WriteLine("  Haolook World - Photography Portfolio");
        Console.WriteLine("  Local URL:   http://localhost:" + port + "/");
        Console.WriteLine("  Root: " + root);
        Console.WriteLine("--------------------------------------------");
        Console.WriteLine("  LAN URL (手机访问用以下地址):");
        foreach (IPAddress ip in Dns.GetHostAddresses(Dns.GetHostName()))
        {
            if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork
                && !IPAddress.IsLoopback(ip))
            {
                Console.WriteLine("    http://" + ip + ":" + port + "/");
            }
        }
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

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "提示: 当前非管理员运行。若启动报 '拒绝访问'(HttpListener 需要 URL 保留权限)，" -ForegroundColor Yellow
    Write-Host "      请右键 PowerShell 选择『以管理员身份运行』后重新执行本脚本。" -ForegroundColor Yellow
}

try {
    [PhotoServer9000]::Run($dir, $port)
} catch [System.Net.HttpListenerException] {
    Write-Host ""
    Write-Host "启动失败: 无法监听 http://+:$port/ (错误: $($_.Exception.Message))" -ForegroundColor Red
    Write-Host "解决办法(任选其一):" -ForegroundColor Yellow
    Write-Host "  1. 以管理员身份运行本脚本"
    Write-Host "  2. 或者在管理员 PowerShell 中执行: netsh http add urlacl url=http://+:$port/ user=Everyone"
    exit 1
}
