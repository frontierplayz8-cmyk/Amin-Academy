Add-Type -AssemblyName System.Drawing
$inPath = "c:\Users\talha\Downloads\New folder (2)\boltvelocity\public\academy-logo.png"
$outPath = "c:\Users\talha\Downloads\New folder (2)\boltvelocity\public\academy-logo-transparent.png"
$img = New-Object System.Drawing.Bitmap($inPath)
$img.MakeTransparent([System.Drawing.Color]::White)
$img.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
Write-Host "Done"
