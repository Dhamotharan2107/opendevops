$dirs = @('src/app/pages', 'src/app/components', 'src/app')
$files = Get-ChildItem -Path $dirs -Filter '*.tsx' -Recurse | Where-Object { $_.Name -notmatch 'NewLandingPage' }

$replacements = @(
  @{ O = 'border-t-fuchsia-500'; N = 'border-t-white' }
  @{ O = 'from-purple-500/10 to-blue-500/10'; N = 'from-white/10 to-white/5' }
  @{ O = 'from-violet-500 via-fuchsia-500 to-pink-500'; N = 'from-white via-white to-white/80' }
  @{ O = 'shadow-violet-500/25'; N = 'shadow-white/25' }
  @{ O = 'shadow-violet-500/40'; N = 'shadow-white/40' }
  @{ O = 'from-fuchsia-500/15 via-transparent to-transparent'; N = 'from-white/[0.05] via-transparent to-transparent' }
  @{ O = 'focus-visible:border-white/60/50 focus-visible:ring-violet-500/20'; N = 'focus-visible:border-white/40 focus-visible:ring-white/20' }
  @{ O = 'from-violet-500/10 via-fuchsia-500/5'; N = 'from-white/[0.06] via-white/[0.03]' }
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
