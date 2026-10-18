<#
  RESTAURACIÓN DE LA BASE bar_app A PARTIR DE UN RESGUARDO
  --------------------------------------------------------
  1) Muestra los últimos resguardos y pide elegir uno (o se pasa con -Archivo).
  2) Verifica la integridad del archivo (SHA256) y que esté completo.
  3) Pide confirmación (se reemplazan los datos actuales).
  4) Hace un resguardo de seguridad del estado actual, por si hay que deshacer.
  5) Restaura y muestra un conteo de registros para comprobar el resultado.

  Uso (desde la carpeta del proyecto):
    powershell -ExecutionPolicy Bypass -File .\resguardo\restore.ps1
    powershell -ExecutionPolicy Bypass -File .\resguardo\restore.ps1 -Archivo "C:\ruta\bar_app_2026-10-20_040000.sql"
#>
param(
  [string]$Archivo = "",
  [string]$Origen = "$env:USERPROFILE\Documents\BarApp-Backups"
)

$ErrorActionPreference = 'Stop'
$BaseDatos = 'bar_app'
$Config = Join-Path $PSScriptRoot 'mysql-backup.cnf'

New-Item -ItemType Directory -Force -Path $Origen | Out-Null
$Log = Join-Path $Origen 'resguardo.log'

function Escribir-Log([string]$mensaje) {
  $linea = "{0}  {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $mensaje
  Write-Host $linea
  Add-Content -Path $Log -Value $linea -Encoding UTF8
}

function Buscar-Ejecutable([string]$nombre) {
  $cmd = Get-Command $nombre -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $encontrado = Get-ChildItem 'C:\Program Files\MySQL' -Recurse -Filter "$nombre.exe" -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($encontrado) { return $encontrado.FullName }
  throw "No se encontró $nombre.exe. Verificá que MySQL Server esté instalado."
}

try {
  if (-not (Test-Path $Config)) {
    throw "Falta el archivo de credenciales $Config (copiá mysql-backup.cnf.example y completalo)"
  }

  # ---------- 1) Elegir el resguardo ----------
  if (-not $Archivo) {
    $lista = @(Get-ChildItem $Origen -Filter '*.sql' | Sort-Object LastWriteTime -Descending | Select-Object -First 10)
    if ($lista.Count -eq 0) { throw "No hay resguardos en $Origen" }

    Write-Host ''
    Write-Host 'Resguardos disponibles (del más nuevo al más viejo):'
    for ($i = 0; $i -lt $lista.Count; $i++) {
      Write-Host ("  [{0}] {1}   ({2:N0} KB)" -f ($i + 1), $lista[$i].Name, ($lista[$i].Length / 1KB))
    }
    $opcion = Read-Host 'Número del resguardo a restaurar'
    $indice = 0
    if (-not [int]::TryParse($opcion, [ref]$indice) -or $indice -lt 1 -or $indice -gt $lista.Count) {
      throw 'Opción inválida'
    }
    $Archivo = $lista[$indice - 1].FullName
  }

  if (-not (Test-Path $Archivo)) { throw "No existe el archivo $Archivo" }
  $nombre = Split-Path $Archivo -Leaf

  # ---------- 2) Verificar integridad ----------
  $archivoHash = "$Archivo.sha256"
  if (Test-Path $archivoHash) {
    $esperado = ((Get-Content $archivoHash -Raw).Trim() -split '\s+')[0]
    $actual = (Get-FileHash $Archivo -Algorithm SHA256).Hash
    if ($esperado -ne $actual) {
      throw 'El archivo fue modificado o está dañado: la huella SHA256 no coincide'
    }
    Write-Host 'Integridad verificada: la huella SHA256 coincide.' -ForegroundColor Green
  }
  else {
    Write-Warning 'No existe el archivo .sha256: no se puede verificar la integridad.'
  }

  if ((Get-Content $Archivo -Tail 1) -notmatch 'Dump completed') {
    throw 'El resguardo está incompleto (no termina con "Dump completed")'
  }

  # ---------- 3) Confirmación ----------
  Write-Host ''
  Write-Host "ATENCIÓN: se reemplazarán los datos actuales de '$BaseDatos' por los de $nombre" -ForegroundColor Yellow
  $confirmacion = Read-Host 'Escribí SI (en mayúsculas) para continuar'
  if ($confirmacion -cne 'SI') {
    Write-Host 'Restauración cancelada. No se modificó nada.'
    exit 0
  }

  # ---------- 4) Resguardo de seguridad previo ----------
  Escribir-Log 'Haciendo un resguardo de seguridad del estado actual antes de restaurar...'
  & (Join-Path $PSScriptRoot 'backup.ps1') -Destino $Origen -Prefijo 'pre-restauracion'
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo hacer el resguardo previo; se cancela la restauración' }

  # ---------- 5) Restaurar ----------
  $mysql = Buscar-Ejecutable 'mysql'
  $ruta = $Archivo -replace '\\', '/'
  Escribir-Log "Restaurando $nombre en '$BaseDatos'..."

  & $mysql "--defaults-extra-file=$Config" --default-character-set=utf8mb4 -e "source $ruta"
  if ($LASTEXITCODE -ne 0) { throw "mysql terminó con código de error $LASTEXITCODE" }

  # ---------- Comprobación ----------
  $consulta = "SELECT 'Usuarios', COUNT(*) FROM $BaseDatos.``user`` " +
    "UNION ALL SELECT 'Productos', COUNT(*) FROM $BaseDatos.producto " +
    "UNION ALL SELECT 'Turnos de agenda', COUNT(*) FROM $BaseDatos.agenda " +
    "UNION ALL SELECT 'Reservas', COUNT(*) FROM $BaseDatos.reserva"
  $conteo = & $mysql "--defaults-extra-file=$Config" -N -B -e $consulta

  Write-Host ''
  Write-Host 'Registros en la base restaurada:' -ForegroundColor Green
  $conteo | ForEach-Object { Write-Host "  $($_ -replace "`t", ': ')" }

  Escribir-Log "OK  Restauración de $nombre completada"
  exit 0
}
catch {
  Escribir-Log "ERROR  $($_.Exception.Message)"
  exit 1
}
