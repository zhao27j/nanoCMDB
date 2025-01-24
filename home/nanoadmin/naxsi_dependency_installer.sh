#!/bin/bash

# List of packages to check
packages=(
    "build-essential"
    "ca-certificates"
    "dpkg-dev"
    "zlib1g-dev"
    "libgd-dev"
    "libgeoip-dev"
    "libpcre2-dev"
    "libpcre3-dev"
    "libperl-dev"
    "libssl-dev"
    "libxslt1-dev"
    "gzip"
    "git"
    "nginx"
    "tar"
    "wget"
)

# Function to check if a package is installed
check_package() {
    if dpkg -s "$1" >/dev/null 2>&1; then
        echo "$1 is installed"
    else
        echo "$1 is not installed"
        missing_packages+=("$1")
    fi
}

# Array to hold missing packages
missing_packages=()

# Check each package in the list
for package in "${packages[@]}"; do
    check_package "$package"
done

# Install missing packages
if [ ${#missing_packages[@]} -ne 0 ]; then
    echo "Installing missing packages..."
    sudo apt-get install -y "${missing_packages[@]}"
else
    echo "All packages are already installed"
fi
