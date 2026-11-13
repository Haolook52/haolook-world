$root = $PSScriptRoot
$listener = $null
$port = 0

foreach ($p in 9100..9120) {
    $tryListener = [System.Net.HttpListener]::new()
    $tryListener.Prefixes.Add("http://localhost:$p/")
    try {
        $tryListener.Start()
        $listener = $tryListener
        $port = $p
        break
    } catch {
        continue
    }
}

if ($null -eq $listener) {
    Write-Host 'NO FREE PORT'
    exit 1
}

$portFile = Join-Path $env:TEMP 'haolook-port.txt'
$port | Out-File -FilePath $portFile -Encoding ascii
Write-Host "Server running at http://localhost:$port/"

function Get-ContentType($ext) {
    switch ($ext.ToLower()) {
        ".html" { return "text/html" }
        ".css"  { return "text/css" }
        ".js"   { return "application/javascript" }
        ".json" { return "application/json" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif"  { return "image/gif" }
        ".webp" { return "image/webp" }
        ".svg"  { return "image/svg+xml" }
        default { return "application/octet-stream" }
    }
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $url = $context.Request.Url.AbsolutePath
    if ($url -eq "/") { $url = "/index.html" }
    $path = Join-Path $root ($url -replace "/", "\")

    if (Test-Path $path -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($path)
        $ext = [System.IO.Path]::GetExtension($path)
        $context.Response.ContentType = Get-ContentType $ext
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $context.Response.StatusCode = 404
    }
    $context.Response.Close()
}