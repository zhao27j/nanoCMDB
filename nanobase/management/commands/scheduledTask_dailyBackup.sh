#!/bin/bash

SOURCE_FOLDER="/webDev/nanoCMDB"

DESTINATION_FOLDER="/webDev/nanoDATA"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

TAR_FILE="dailyBackup_$TIMESTAMP.tar.gz"

LOG_FILE="/webDev/nanoDATA/dailyBackup_$TIMESTAMP.log"

tar -czvf "$DESTINATION_FOLDER/$TAR_FILE" -C "$SOURCE_FOLDER" . > "$LOG_FILE" 2>&1
