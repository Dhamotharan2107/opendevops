$dirs = @('src/app/pages', 'src/app/components', 'src/app')
$files = Get-ChildItem -Path $dirs -Filter '*.tsx' -Recurse | Where-Object { $_.Name -notmatch 'NewLandingPage' }

$replacements = @(
  @{ O = 'bg-violet-600/30 border border-white/25'; N = 'bg-white/15 border border-white/25' }
  @{ O = 'hover:bg-white/90/40'; N = 'hover:bg-white/25' }
  @{ O = 'from-violet-500/20 via-transparent to-transparent'; N = 'from-white/[0.06] via-transparent to-transparent' }
  @{ O = 'border-[#0A0A0F]'; N = 'border-black' }
  @{ O = 'to-pink-500/20'; N = 'to-white/10' }
  @{ O = 'from-violet-500/10 via-fuchsia-500/10 to-pink-500/10'; N = 'from-white/10 via-white/5 to-white/10' }
  @{ O = 'from-violet-500/20 to-fuchsia-500/20'; N = 'from-white/10 to-white/10' }
  @{ O = 'bg-[#0A0A0F]'; N = 'bg-black' }
)

foreach ($f in $files) {
  $content = Get-Content $f.FullName -Raw
  $original = $content
  foreach ($r in $replacements) {
    $content = $content.Replace($r.O, $r.N)
  }
  if ($content -ne $original) {
    Set-Content -Path $f.FullName -Value $content -NoNewline
    Write-Host ('Updated: ' + $f.Name)
  }
}
Write-Host 'Done.'
