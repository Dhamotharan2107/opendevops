$dirs = @('src/app/pages', 'src/app/components')
$files = Get-ChildItem -Path $dirs -Filter '*.tsx' -Recurse | Where-Object { $_.Name -notmatch 'NewLandingPage|LandingPage' }

$replacements = @(
  @{ O = 'from-violet-500 via-fuchsia-500 to-pink-500'; N = 'from-white via-white to-white/80' }
  @{ O = 'from-violet-500/20 via-fuchsia-500/10'; N = 'from-white/10 via-white/5' }
  @{ O = 'from-violet-500/20 to-fuchsia-500/10'; N = 'from-white/10 to-white/5' }
  @{ O = 'from-violet-500 to-fuchsia-500'; N = 'from-white to-white/90' }
  @{ O = 'from-pink-500 to-purple-500'; N = 'from-white to-white/90' }
  @{ O = 'from-violet-500/20 to-purple-500/10'; N = 'from-white/10 to-white/5' }
  @{ O = 'from-indigo-500/20 via-purple-500/10'; N = 'from-white/10 via-white/5' }
  @{ O = 'from-purple-500 to-pink-500'; N = 'from-white to-white/90' }
  @{ O = 'from-purple-500/20 to-pink-500/5'; N = 'from-white/10 to-white/5' }

  @{ O = 'bg-[#0A0A0F]/80'; N = 'bg-black/70' }
  @{ O = 'bg-[#0A0A0F]/60'; N = 'bg-black/60' }
  @{ O = 'bg-[#0A0A0F]'; N = 'bg-black' }
  @{ O = 'bg-[#0F0F14]'; N = 'bg-[#080808]' }
  @{ O = 'bg-[#060608]'; N = 'bg-[#080808]' }
  @{ O = 'bg-[#161616]'; N = 'bg-[#080808]' }

  @{ O = "background: '#0A0A0F'"; N = "background: '#000'" }
  @{ O = "background: '#7c3aed'"; N = "background: '#fff'" }
  @{ O = "color: '#fff'"; N = "color: '#000'" }

  @{ O = 'border-white/[0.06]'; N = 'border-white/[0.08]' }
  @{ O = 'border-white/[0.07]'; N = 'border-white/[0.08]' }
  @{ O = 'divide-white/[0.04]'; N = 'divide-white/[0.06]' }

  @{ O = 'hover:border-violet-500/20'; N = 'hover:border-white/20' }
  @{ O = 'focus:border-violet-500/50'; N = 'focus:border-white/40' }
  @{ O = 'focus:border-violet-500/40'; N = 'focus:border-white/30' }
  @{ O = 'focus:ring-violet-500/20'; N = 'focus:ring-white/20' }
  @{ O = 'focus:ring-violet-500'; N = 'focus:ring-white/40' }
  @{ O = 'border-violet-500/20'; N = 'border-white/20' }
  @{ O = 'border-violet-500/30'; N = 'border-white/25' }
  @{ O = 'border-violet-500/15'; N = 'border-white/10' }

  @{ O = 'bg-violet-500/30'; N = 'bg-white/20' }
  @{ O = 'bg-violet-500/20'; N = 'bg-white/15' }
  @{ O = 'bg-violet-500/10'; N = 'bg-white/10' }
  @{ O = 'bg-violet-500/5'; N = 'bg-white/5' }

  @{ O = 'hover:text-violet-300'; N = 'hover:text-white' }
  @{ O = 'hover:text-violet-200'; N = 'hover:text-white' }
  @{ O = 'text-violet-400'; N = 'text-white' }
  @{ O = 'text-violet-300'; N = 'text-white' }
  @{ O = 'text-violet-200'; N = 'text-white' }

  @{ O = 'shadow-violet-500/40'; N = 'shadow-white/40' }
  @{ O = 'shadow-violet-500/25'; N = 'shadow-white/25' }
  @{ O = 'shadow-violet-500/20'; N = 'shadow-white/20' }
  @{ O = 'shadow-violet-500/10'; N = 'shadow-white/10' }
  @{ O = 'shadow-violet-500/5'; N = 'shadow-white/5' }

  @{ O = 'text-purple-400'; N = 'text-white' }
  @{ O = 'text-purple-500'; N = 'text-white' }
  @{ O = 'bg-purple-500/10'; N = 'bg-white/10' }
  @{ O = 'border-purple-500/30'; N = 'border-white/25' }

  @{ O = 'hover:bg-gray-100'; N = 'hover:bg-white/90' }
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
