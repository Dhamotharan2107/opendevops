$dirs = @('src/app/pages', 'src/app/components', 'src/app')
$files = Get-ChildItem -Path $dirs -Filter '*.tsx' -Recurse | Where-Object { $_.Name -notmatch 'NewLandingPage' }

$replacements = @(
  # Landing-page style animated orbs: violet-600 -> white
  @{ O = 'bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl'; N = 'bg-white/[0.05] rounded-full blur-[120px]' }
  @{ O = 'bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl'; N = 'bg-white/[0.04] rounded-full blur-[120px]' }

  # Remaining violet accents
  @{ O = 'from-purple-600 to-blue-600'; N = 'from-white to-white/90' }
  @{ O = 'from-fuchsia-500/20 to-pink-500/10'; N = 'from-white/10 to-white/5' }
  @{ O = 'from-violet-500 to-fuchsia-600'; N = 'from-white to-white/90' }
  @{ O = 'from-rose-500/20 via-pink-500/10'; N = 'from-white/10 via-white/5' }
  @{ O = 'border-violet-500/40'; N = 'border-white/30' }
  @{ O = 'ring-violet-500/30'; N = 'ring-white/20' }
  @{ O = 'border-violet-500'; N = 'border-white/60' }
  @{ O = 'caret-violet-400'; N = 'caret-white' }
  @{ O = 'bg-violet-500'; N = 'bg-white' }
  @{ O = 'bg-violet-400'; N = 'bg-white' }
  @{ O = 'text-fuchsia-400'; N = 'text-white' }
  @{ O = 'shadow-white/20'; N = 'shadow-white/20' }
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
