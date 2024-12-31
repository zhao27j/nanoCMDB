# Define variables
$containerId = "b52332c5ba04"    # Replace with your Docker container ID
$srcPath = "/nanoCMDB"  # Replace with the path inside the container
$destPath = "C:\webDev\nanoDATA\daily_backup"  # Replace with your local path

# $destFile = "C:\backup\container_backup.zip"  # Replace with your backup zip file path

docker cp ${containerId}:$srcPath $destPath # Copy files from Docker container to local system

$date = Get-Date -Format "yyyyMMdd" # "yyyy-MM-dd"
$time = Get-Date -Format "HHmmss"

$destPath = "${destPath}\nanoCMDB"
$dest_file = "C:\webDev\nanoDATA\daily_backup\archive_${date}_${time}.zip"
Compress-Archive -Path $destPath -DestinationPath $dest_file # compress the temporary folder

Remove-Item -Path $destPath -Recurse -Force # remove the copied folders/files

# Compress the copied files into a zip file
# Add-Type -Assembly "System.IO.Compression.FileSystem"
# [System.IO.Compression.ZipFile]::CreateFromDirectory($destinationPath, $backupZip)

# Write-Host "Files have been copied and zipped successfully!"

# Create a directory for the backup
# if (-Not (Test-Path -Path $destinationPath)) {
#    New-Item -ItemType Directory -Path $destinationPath
#}