$dirs = @('src/app/pages', 'src/app/components', 'src/app')
$files = Get-ChildItem -Path $dirs -Filter '*.tsx' -Recurse | Where-Object { $_.Name -notmatch 'NewLandingPage' }

$replacements = @(
  @{ O = 'from-purple-500/30 to-blue-500/30'; N = 'from-white/20 to-white/10' }
  @{ O = 'from-violet-600/30 via-fuchsia-500/20 to-pink-500/10'; N = 'from-white/20 via-white/10 to-white/5' }
  @{ O = 'from-violet-500 to-pink-600'; N = 'from-white to-white/90' }
  @{ O = 'from-violet-600 to-fuchsia-600'; N = 'from-white to-white/90' }
  @{ O = 'from-rose-500 to-pink-500'; N = 'from-white to-white/90' }
  @{ O = 'from-white via-violet-200 to-fuchsia-200'; N = 'from-white via-white to-white/70' }
  @{ O = 'hover:bg-violet-600'; N = 'hover:bg-white/90' }
  @{ O = 'focus-within:ring-violet-500/20'; N = 'focus-within:ring-white/20' }
  @{ O = 'from-violet-500/5 via-transparent to-transparent'; N = 'from-white/[0.04] via-transparent to-transparent' }
  @{ O = 'from-fuchsia-500/5 via-transparent to-transparent'; N = 'from-white/[0.03] via-transparent to-transparent' }
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
