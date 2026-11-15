$root = $PSScriptRoot
$photos = Join-Path $root 'photos'

# "系列作品" and "旅行风光" built from code points so the script stays ASCII-only
$seriesName = -join ([char]0x7CFB, [char]0x5217, [char]0x4F5C, [char]0x54C1)
$travelName = -join ([char]0x65C5, [char]0x884C, [char]0x98CE, [char]0x5149)

$seriesDir = Join-Path $photos $seriesName
$travelDir = Join-Path $photos $travelName
$imgExt = @('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp')

$series = @()
if (Test-Path $seriesDir) {
    Get-ChildItem $seriesDir -Directory | Sort-Object Name | ForEach-Object {
        $folderName = $_.Name
        $files = Get-ChildItem $_.FullName -File |
            Where-Object { $imgExt -contains $_.Extension.ToLower() } |
            Sort-Object Name
        if ($files.Count -gt 0) {
            $series += [ordered]@{
                name   = $folderName
                folder = 'photos/' + $seriesName + '/' + $folderName
                images = @($files | ForEach-Object { $_.Name })
            }
        }
    }
}

$travel = @()
if (Test-Path $travelDir) {
    $travel = @(Get-ChildItem $travelDir -File -Recurse |
        Where-Object { $imgExt -contains $_.Extension.ToLower() } |
        Sort-Object FullName |
        ForEach-Object { $_.FullName.Substring($travelDir.Length + 1).Replace('\', '/') })
}

$data = [ordered]@{ travel = $travel; series = $series }
$json = $data | ConvertTo-Json -Depth 6

$outFile = Join-Path $root 'data.json'
[System.IO.File]::WriteAllText($outFile, $json, (New-Object System.Text.UTF8Encoding -ArgumentList $false))

Write-Host ("Done. series=" + $series.Count + ", travel=" + $travel.Count)
