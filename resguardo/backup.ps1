<#
  RESGUARDO (BACKUP) COMPLETO DE LA BASE bar_app
  ------------------------------------------------
  - Genera un archivo .sql con fecha y hora (resguardo completo).
  - Lo verifica: que no esté vacío, que esté completo y calcula su huella SHA256.
  - Opcional: deja una segunda copia en otra ubicación (pendrive, Google Drive, etc.).
  - Borra los resguardos más viejos que la cantidad de días de retención.
  - Registra todo en resguardo.log.

  Uso (desde la carpeta del proyecto):
    powershell -ExecutionPolicy Bypass -File .\resguardo\backup.ps1
    powershell -ExecutionPolicy Bypass -File .\resguardo\backup.ps1 -CopiaExterna "G:\Mi unidad\BarApp-Backups"
#>
param(
  [string]$Destino = "$env:USERPROFILE\Documents\BarApp-Backups",
  [string]$CopiaExterna = "",
  [int]$DiasRetencion = 30,
  [string]$Prefijo = "bar_app"
)

$ErrorActionPreference = 'Stop'
$BaseDatos = 'bar_app'
$Config = Join-Path $PSScriptRoot 'mysql-backup.cnf'

New-Item -ItemType Directory -Force -Path $Destino | Out-Null
$Log = Join-Path $Destino 'resguardo.log'

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

  $mysqldump = Buscar-Ejecutable 'mysqldump'
  $fecha = Get-Date -Format 'yyyy-MM-dd_HHmmss'
  $archivo = Join-Path $Destino "${Prefijo}_$fecha.sql"

  Escribir-Log "Iniciando resguardo de '$BaseDatos' -> $archivo"

  # --single-transaction: copia consistente sin bloquear la base mientras el sistema funciona
  # --routines --triggers --events: incluye procedimientos, triggers y eventos
  # --databases: incluye CREATE DATABASE, así la restauración funciona aunque la base no exista
  & $mysqldump "--defaults-extra-file=$Config" `
    --single-transaction --routines --triggers --events `
    --default-character-set=utf8mb4 `
    --databases $BaseDatos `
    "--result-file=$archivo"

  if ($LASTEXITCODE -ne 0) { throw "mysqldump terminó con código de error $LASTEXITCODE" }

  # ---------- Verificación del resguardo ----------
  $info = Get-Item $archivo
  if ($info.Length -eq 0) { throw 'El archivo de resguardo quedó vacío' }

  $ultimaLinea = Get-Content $archivo -Tail 1
  if ($ultimaLinea -notmatch 'Dump completed') {
    throw 'El resguardo está incompleto (no termina con "Dump completed")'
  }

  # Huella digital: permite detectar si el archivo se dañó o modificó antes de restaurarlo
  $hash = (Get-FileHash $archivo -Algorithm SHA256).Hash
  Set-Content -Path "$archivo.sha256" -Value "$hash  $($info.Name)" -Encoding ASCII

  Escribir-Log ("OK  {0}  ({1:N0} KB)  SHA256={2}..." -f $info.Name, ($info.Length / 1KB), $hash.Substring(0, 16))

  # ---------- Copia externa (opcional) ----------
  if ($CopiaExterna) {
    New-Item -ItemType Directory -Force -Path $CopiaExterna | Out-Null
    Copy-Item $archivo, "$archivo.sha256" -Destination $CopiaExterna -Force
    Escribir-Log "Copia externa guardada en $CopiaExterna"
  }

  # ---------- Retención: borrar resguardos viejos ----------
  $limite = (Get-Date).AddDays(-$DiasRetencion)
  Get-ChildItem $Destino -Filter "${Prefijo}_*.sql*" |
    Where-Object { $_.LastWriteTime -lt $limite } |
    ForEach-Object {
      Remove-Item $_.FullName
      Escribir-Log "Eliminado por antigüedad (más de $DiasRetencion días): $($_.Name)"
    }

  exit 0
}
catch {
  Escribir-Log "ERROR  $($_.Exception.Message)"
  exit 1
}
