"""Inspect a built APK; not a substitute for device tests or final signed AAB review."""
from pathlib import Path
import json
import re
import struct
import subprocess
import zipfile


def load_alignments(data):
    if data[:4] != b'\x7fELF' or data[5] != 1:
        raise ValueError('Expected little-endian ELF shared library')
    if data[4] == 2:
        offset = struct.unpack_from('<Q', data, 32)[0]
        size, count = struct.unpack_from('<HH', data, 54)
        layout = '<IIQQQQQQ'
    elif data[4] == 1:
        offset = struct.unpack_from('<I', data, 28)[0]
        size, count = struct.unpack_from('<HH', data, 42)
        layout = '<IIIIIIII'
    else:
        raise ValueError('Unsupported ELF class')
    if size < struct.calcsize(layout) or count == 0:
        raise ValueError('Missing/invalid ELF program headers')
    alignments = []
    for index in range(count):
        header = struct.unpack_from(layout, data, offset + index * size)
        if header[0] == 1:  # PT_LOAD
            alignments.append(header[7])
    if not alignments or any(value < 16384 or value & (value - 1) for value in alignments):
        raise ValueError('PT_LOAD segments must have at least 16 KB power-of-two alignment')
    return alignments


def main():
    root = Path(__file__).resolve().parent.parent
    apk = root / 'android/app/build/outputs/apk/release/app-release.apk'
    output = root / 'android-native-evidence.json'
    if apk.is_symlink() or not apk.is_file() or not apk.resolve().is_relative_to(root):
        raise ValueError('Expected regular release APK in the project build directory')
    badging = subprocess.check_output(['aapt2', 'dump', 'badging', str(apk)], text=True)
    target = re.search(r"targetSdkVersion:'(\d+)'", badging)
    if not target or int(target.group(1)) < 36:
        raise ValueError('Target API must be at least 36')
    permissions = re.findall(r"uses-permission(?:-sdk-\d+)?: name='([^']+)'", badging)
    forbidden = {'RECORD_AUDIO', 'READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO',
                 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'SYSTEM_ALERT_WINDOW',
                 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'READ_CONTACTS'}
    if any(permission.split('.')[-1] in forbidden for permission in permissions):
        raise ValueError('Unexpected sensitive permission in merged APK')
    manifest = subprocess.check_output(['aapt2', 'dump', 'xmltree', str(apk), '--file', 'AndroidManifest.xml'], text=True)
    backup = re.search(r'android:allowBackup[^\n]*', manifest)
    if not backup or not re.search(r'(?:0x0|false)\s*$', backup.group(0)):
        raise ValueError('Application backup must be disabled')
    debug = re.search(r'android:debuggable[^\n]*', manifest)
    if debug and not re.search(r'(?:0x0|false)\s*$', debug.group(0)):
        raise ValueError('Release APK must not be debuggable')
    libraries = []
    with zipfile.ZipFile(apk) as archive:
        for name in archive.namelist():
            if name == 'assets/index.android.bundle' and b'temporary probe; never production route' in archive.read(name):
                raise ValueError('Native test probe must never ship in the normal APK')
            if name.startswith('lib/') and name.endswith('.so'):
                libraries.append({'file': name, 'loadAlignments': load_alignments(archive.read(name))})
    if not libraries:
        raise ValueError('No native libraries found; invalid native verification artifact')
    subprocess.run(['zipalign', '-c', '-P', '16', '-v', '4', str(apk)], check=True, stdout=subprocess.DEVNULL)
    with output.open('w') as stream:
        json.dump({'targetApi': int(target.group(1)), 'permissions': permissions,
                   'backupEnabled': False, 'debuggable': False, 'libraries': libraries,
                   'zipAlignment16KB': True, 'scope': 'Inspected APK only; final AAB/device tests remain required'}, stream, indent=2)
    print(f'APK checks passed: target {target.group(1)}, {len(libraries)} libraries with 16 KB alignment')


if __name__ == '__main__':
    main()
