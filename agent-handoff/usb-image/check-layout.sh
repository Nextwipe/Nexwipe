#!/usr/bin/env bash
# Checks a finished stick image has the org-stick layout. Usage: check-layout.sh <image.img>
#   p1: Microsoft basic data FAT32 named NEXWIPE (Windows shows it; UEFI boots from it), marker /.disk/nexwipe-stick
#   p2: ND-STATE with GPT attributes 62+63 (hidden, no drive letter) so Windows never offers to format it
#   grub.cfg finds the stick by the marker file (a renamed volume still boots) and boots to RAM (toram)
# Needs sgdisk and mtools. Reads only; never writes the image.
set -euo pipefail
IMG="${1:?image file}"
fail=0
bad() { echo "LAYOUT FAIL: $*"; fail=1; }

p1="$(sgdisk -i 1 "$IMG")"; p2="$(sgdisk -i 2 "$IMG")"
grep -q 'EBD0A0A2-B9E5-4433-87C0-68B6B72699C7' <<<"$p1" || bad "p1 is not Microsoft basic data"
grep -q "Partition name: 'NEXWIPE'" <<<"$p1" || bad "p1 is not named NEXWIPE"
grep -q "Partition name: 'ND-STATE'" <<<"$p2" || bad "p2 is not named ND-STATE"
grep -q 'Attribute flags: C000000000000000' <<<"$p2" || bad "p2 is not hidden/no-drive-letter"

off="$(awk '/First sector/ {print $3 * 512}' <<<"$p1")"
export MTOOLS_SKIP_CHECK=1
mdir -i "$IMG@@$off" ::/.disk/nexwipe-stick >/dev/null 2>&1 || bad "marker /.disk/nexwipe-stick missing"
cfg="$(mtype -i "$IMG@@$off" ::/EFI/BOOT/grub.cfg 2>/dev/null || true)"
grep -q 'search --no-floppy --set=root --file /.disk/nexwipe-stick' <<<"$cfg" || bad "grub.cfg does not search by marker file"
grep -q 'toram' <<<"$cfg" || bad "grub.cfg does not boot to RAM"

[[ $fail -eq 0 ]] && echo "check-layout: OK"
exit $fail
