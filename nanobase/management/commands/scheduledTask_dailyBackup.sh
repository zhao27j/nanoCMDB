#!/bin/bash

SOURCE_FOLDER="/webDev/nanoCMDB"

DESTINATION_FOLDER="/webDev/backup"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

TAR_BALL="dailyFull_$TIMESTAMP.tar.gz"

LOG_FILE="$DESTINATION_FOLDER/dailyFull_$TIMESTAMP.log"

tar -czvf "$DESTINATION_FOLDER/$TAR_BALL" -C "$SOURCE_FOLDER" . > "$LOG_FILE" 2>&1