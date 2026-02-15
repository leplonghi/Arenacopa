Add-Type -AssemblyName System.Windows.Forms
$FileBrowser = New-Object System.Windows.Forms.OpenFileDialog
$FileBrowser.Title = "Selecione a imagem da Logo oficial"
$FileBrowser.Filter = "Imagens PNG (*.png)|*.png|Todas as Imagens (*.jpg;*.jpeg;*.png)|*.jpg;*.jpeg;*.png"

if ($FileBrowser.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    $Source = $FileBrowser.FileName
    $Dest = "$PSScriptRoot\..\public\logo.png"
    Copy-Item -Path $Source -Destination $Dest -Force
    Write-Host "SUCESSO: Logo copiada para $Dest"
} else {
    Write-Host "CANCELADO: Nenhuma imagem selecionada."
    exit 1
}
