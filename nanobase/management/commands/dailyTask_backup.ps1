$date = Get-Date -Format "yyyy-MM-dd"
$destination = "C:\webDev\nanoDATA\daily_backup\Archive_$date.zip"
$source_folder = "C:\webDev\nanoCMDB\uploads"
$source_file = "C:\webDev\nanoCMDB\db.sqlite3"
Compress-Archive -Path $source_folder,$source_file -DestinationPath $destination