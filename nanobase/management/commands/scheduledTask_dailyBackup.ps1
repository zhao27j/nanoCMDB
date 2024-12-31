$src_file = "C:\webDev\nanoCMDB\db.sqlite3"
$dest_folder = "C:\webDev\nanoDATA\daily_backup"
Copy-Item -Path $src_file -Destination $dest_folder # copy the DB file to the destination folder

$date = Get-Date -Format "yyyyMMdd" # "yyyy-MM-dd"
$time = Get-Date -Format "HHmmss"

$src_folder = "C:\webDev\nanoCMDB\uploads"
$src_file = "C:\webDev\nanoDATA\daily_backup\db.sqlite3"
$dest_file = "C:\webDev\nanoDATA\daily_backup\archive_${date}_${time}.zip"
Compress-Archive -Path $src_folder, $src_file -DestinationPath $dest_file # compress the temporary folder

Remove-Item -Path $src_file # remove the srouce file